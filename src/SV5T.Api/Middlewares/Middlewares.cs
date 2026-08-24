using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using SV5T.Application.Common.Exceptions;

namespace SV5T.Api.Middlewares;

public sealed partial class CorrelationIdMiddleware(
    RequestDelegate next,
    ILogger<CorrelationIdMiddleware> logger)
{
    public const string HeaderName = "X-Correlation-ID";

    public async Task InvokeAsync(HttpContext context)
    {
        var supplied = context.Request.Headers[HeaderName].FirstOrDefault();
        var correlationId = IsValid(supplied)
            ? supplied!
            : context.TraceIdentifier;
        context.TraceIdentifier = correlationId;
        context.Response.Headers[HeaderName] = correlationId;

        using (logger.BeginScope(new Dictionary<string, object>
        {
            ["CorrelationId"] = correlationId
        }))
        {
            await next(context);
        }
    }

    private static bool IsValid(string? value) =>
        !string.IsNullOrWhiteSpace(value) &&
        value.Length <= 64 &&
        CorrelationIdPattern().IsMatch(value);

    [GeneratedRegex("^[A-Za-z0-9._-]+$", RegexOptions.CultureInvariant)]
    private static partial Regex CorrelationIdPattern();
}

public sealed class ExceptionHandlingMiddleware(
    RequestDelegate next,
    ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            var traceId = context.TraceIdentifier;
            if (exception is UseCaseException applicationException)
            {
                logger.LogWarning(
                    "Handled request failure. StatusCode: {StatusCode}, ErrorCode: {ErrorCode}, TraceId: {TraceId}",
                    ToStatusCode(applicationException.Kind),
                    applicationException.ErrorCode,
                    traceId);
            }
            else
            {
                logger.LogError(
                    exception,
                    "Unhandled request failure. TraceId: {TraceId}",
                    traceId);
            }

            if (context.Response.HasStarted)
            {
                throw;
            }

            var status = exception is UseCaseException handled
                ? ToStatusCode(handled.Kind)
                : StatusCodes.Status500InternalServerError;
            var code = exception is UseCaseException publicException
                ? publicException.ErrorCode
                : "internal_error";
            var detail = exception is UseCaseException exposedException
                ? exposedException.PublicMessage
                : "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.";

            context.Response.Clear();
            context.Response.StatusCode = status;
            context.Response.ContentType = "application/problem+json";
            var problem = new ProblemDetails
            {
                Status = status,
                Title = ToVietnameseTitle(status),
                Detail = detail,
                Type = $"https://httpstatuses.com/{status}",
                Instance = context.Request.Path
            };
            problem.Extensions["code"] = code;
            problem.Extensions["traceId"] = traceId;
            await context.Response.WriteAsJsonAsync(
                problem,
                context.RequestAborted);
        }
    }

    private static string ToVietnameseTitle(int status) => status switch
    {
        StatusCodes.Status400BadRequest => "Yêu cầu không hợp lệ",
        StatusCodes.Status401Unauthorized => "Chưa xác thực",
        StatusCodes.Status403Forbidden => "Không có quyền truy cập",
        StatusCodes.Status404NotFound => "Không tìm thấy dữ liệu",
        StatusCodes.Status409Conflict => "Dữ liệu bị trùng lặp hoặc xung đột",
        StatusCodes.Status429TooManyRequests => "Thao tác quá thường xuyên",
        StatusCodes.Status503ServiceUnavailable => "Dịch vụ tạm thời không khả dụng",
        _ => "Lỗi hệ thống"
    };

    private static int ToStatusCode(ApplicationErrorKind kind) => kind switch
    {
        ApplicationErrorKind.Validation => StatusCodes.Status400BadRequest,
        ApplicationErrorKind.Unauthorized => StatusCodes.Status401Unauthorized,
        ApplicationErrorKind.Forbidden => StatusCodes.Status403Forbidden,
        ApplicationErrorKind.NotFound => StatusCodes.Status404NotFound,
        ApplicationErrorKind.Conflict => StatusCodes.Status409Conflict,
        ApplicationErrorKind.RateLimited => StatusCodes.Status429TooManyRequests,
        ApplicationErrorKind.Unavailable => StatusCodes.Status503ServiceUnavailable,
        _ => StatusCodes.Status500InternalServerError
    };
}

public sealed class SecurityHeadersMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.Path.StartsWithSegments("/swagger"))
        {
            await next(context);
            return;
        }

        context.Response.OnStarting(() =>
        {
            var headers = context.Response.Headers;
            headers.XContentTypeOptions = "nosniff";
            headers.XFrameOptions = "DENY";
            headers["Referrer-Policy"] = "no-referrer";
            headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()";
            headers["Content-Security-Policy"] =
                "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";
            if (context.Request.Path.StartsWithSegments("/api/auth"))
            {
                headers.CacheControl = "no-store";
                headers.Pragma = "no-cache";
            }
            return Task.CompletedTask;
        });
        await next(context);
    }
}

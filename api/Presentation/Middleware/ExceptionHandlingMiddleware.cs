using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using SV5T.Application.Common.Exceptions;

namespace SV5T.Presentation.Middleware;

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
                Title = ReasonPhrases.GetReasonPhrase(status),
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

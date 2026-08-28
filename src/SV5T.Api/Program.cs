using System.Net;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.OpenApi;
using SV5T.Api.Middlewares;
using SV5T.Api.Security;
using SV5T.Application;
using SV5T.Application.Common.Abstractions;
using SV5T.Infrastructure;
using SV5T.Infrastructure.Configuration;

DotEnvLoader.LoadBackendEnvironment();
var builder = WebApplication.CreateBuilder(args);
if (!builder.Environment.IsDevelopment())
{
    ValidateProductionConfiguration(builder.Configuration);
}

builder.WebHost.ConfigureKestrel(options =>
{
    options.AddServerHeader = false;
    options.Limits.MaxRequestBodySize = 64 * 1024;
});

builder.Logging.ClearProviders();
if (builder.Environment.IsDevelopment())
{
    builder.Logging.AddSimpleConsole(options =>
    {
        options.SingleLine = true;
        options.TimestampFormat = "HH:mm:ss ";
        options.UseUtcTimestamp = false;
        options.IncludeScopes = false;
    });
}
else
{
    builder.Logging.AddJsonConsole();
}

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter()));

builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var sanitizedErrors = new Dictionary<string, string[]>();
        foreach (var (key, modelStateEntry) in context.ModelState)
        {
            if (modelStateEntry.Errors.Count == 0) continue;

            var cleanErrors = modelStateEntry.Errors.Select(err =>
            {
                var msg = err.ErrorMessage;
                if (string.IsNullOrWhiteSpace(msg) && err.Exception != null)
                {
                    msg = err.Exception.Message;
                }

                // Loại bỏ hoàn toàn dấu vết CLR Types, Namespaces, Path, LineNumbers
                if (msg.Contains("could not be converted", StringComparison.OrdinalIgnoreCase) ||
                    msg.Contains("range of values", StringComparison.OrdinalIgnoreCase) ||
                    msg.Contains("JSON", StringComparison.OrdinalIgnoreCase) ||
                    msg.Contains("SV5T.", StringComparison.OrdinalIgnoreCase))
                {
                    return "Giá trị cung cấp không hợp lệ hoặc không đúng định dạng.";
                }

                return msg;
            }).ToArray();

            sanitizedErrors[key] = cleanErrors;
        }

        var problem = new ValidationProblemDetails(sanitizedErrors)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Dữ liệu yêu cầu không hợp lệ",
            Detail = "Một hoặc nhiều trường thông tin không đúng định dạng yêu cầu.",
            Type = "https://httpstatuses.com/400",
            Instance = context.HttpContext.Request.Path
        };
        problem.Extensions["code"] = "validation_error";
        problem.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
        return new BadRequestObjectResult(problem)
        {
            ContentTypes = { "application/problem+json" }
        };
    };
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddProblemDetails();
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Nhập access token JWT."
        });
    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [new OpenApiSecuritySchemeReference("Bearer", document, null)] = []
        });
});

builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment);
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, HttpCurrentUser>();

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders =
        ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    foreach (var value in builder.Configuration
                 .GetSection("ReverseProxy:KnownProxies")
                 .Get<string[]>() ?? [])
    {
        if (IPAddress.TryParse(value, out var address))
        {
            options.KnownProxies.Add(address);
        }
    }
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/problem+json";
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter =
                Math.Ceiling(retryAfter.TotalSeconds).ToString(
                    System.Globalization.CultureInfo.InvariantCulture);
        }

        await context.HttpContext.Response.WriteAsJsonAsync(
            new
            {
                type = "https://httpstatuses.com/429",
                title = "Thao tác quá thường xuyên",
                detail = "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau giây lát.",
                status = 429,
                code = "rate_limited",
                traceId = context.HttpContext.TraceIdentifier
            },
            cancellationToken);
    };

    AddIpPolicy(options, AuthRateLimitPolicies.Register, 5, TimeSpan.FromMinutes(10));
    AddIpPolicy(options, AuthRateLimitPolicies.Login, 10, TimeSpan.FromMinutes(1));
    AddIpPolicy(options, AuthRateLimitPolicies.Otp, 10, TimeSpan.FromMinutes(1));
    AddIpPolicy(options, AuthRateLimitPolicies.Email, 5, TimeSpan.FromMinutes(10));
    AddIpPolicy(options, AuthRateLimitPolicies.Refresh, 30, TimeSpan.FromMinutes(1));
});

var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>() ?? [];

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .WithHeaders("Content-Type", "Authorization", CorrelationIdMiddleware.HeaderName)
            .WithMethods("GET", "POST", "PUT", "OPTIONS")
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseForwardedHeaders();
app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseMiddleware<SecurityHeadersMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false
});
var readyHealthCheck = app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = registration => registration.Tags.Contains("ready")
});
var readyHosts = builder.Configuration
    .GetSection("HealthChecks:ReadyAllowedHosts")
    .Get<string[]>() ?? [];
if (readyHosts.Length > 0)
{
    readyHealthCheck.RequireHost(readyHosts);
}

static void AddIpPolicy(
    RateLimiterOptions options,
    string name,
    int permitLimit,
    TimeSpan window)
{
    options.AddPolicy(
        name,
        context => RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = permitLimit,
                Window = window,
                QueueLimit = 0,
                AutoReplenishment = true
            }));
}

static void ValidateProductionConfiguration(IConfiguration configuration)
{
    var allowedHosts = configuration["AllowedHosts"];
    if (string.IsNullOrWhiteSpace(allowedHosts) || allowedHosts == "*")
    {
        throw new InvalidOperationException(
            "Production AllowedHosts must contain explicit host names.");
    }

    var origins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
    if (origins.Length == 0 || origins.Any(origin =>
            !Uri.TryCreate(origin, UriKind.Absolute, out var uri) ||
            uri.Scheme != Uri.UriSchemeHttps))
    {
        throw new InvalidOperationException(
            "Production CORS origins must be explicit HTTPS origins.");
    }

    if (configuration.GetValue<bool>("Redis:RequireTls") is false)
    {
        throw new InvalidOperationException("Production Redis TLS is required.");
    }
}

app.Run();

public partial class Program;

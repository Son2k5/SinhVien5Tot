using System.Text.Json.Serialization;
using System.Net;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi;
using SV5T.Application;
using SV5T.Infrastructure;
using SV5T.Presentation.Middleware;
using SV5T.Presentation.Security;
using SV5T.Application.Interfaces.Services.Commons;
using SV5T.Configuration;

DotEnvLoader.LoadBackendEnvironment();
var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(options =>
    options.Limits.MaxRequestBodySize = 64 * 1024);

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
        var problem = new ValidationProblemDetails(context.ModelState)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Bad Request",
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
builder.Services.AddInfrastructure(builder.Configuration);
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
                title = "Too Many Requests",
                status = 429,
                code = "rate_limited",
                traceId = context.HttpContext.TraceIdentifier
            },
            cancellationToken);
    };

    AddIpPolicy(options, "auth-register", 5, TimeSpan.FromMinutes(10));
    AddIpPolicy(options, "auth-login", 10, TimeSpan.FromMinutes(1));
    AddIpPolicy(options, "auth-otp", 10, TimeSpan.FromMinutes(1));
    AddIpPolicy(options, "auth-email", 5, TimeSpan.FromMinutes(10));
    AddIpPolicy(options, "auth-refresh", 30, TimeSpan.FromMinutes(1));
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
            .WithMethods("GET", "POST", "OPTIONS")
            .AllowCredentials();
    });
});

var app = builder.Build();

app.UseMiddleware<CorrelationIdMiddleware>();
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseForwardedHeaders();
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

app.Run();

public partial class Program;

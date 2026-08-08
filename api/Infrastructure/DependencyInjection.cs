using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using SV5T.Application.Interfaces.Persistence;
using SV5T.Application.Interfaces.Repositories;
using SV5T.Application.Interfaces.Services.Auth;
using SV5T.Application.Interfaces.Services.Commons;
using SV5T.Infrastructure.Auth;
using SV5T.Infrastructure.Email;
using SV5T.Infrastructure.Health;
using SV5T.Infrastructure.Options.Authentication;
using SV5T.Infrastructure.Options.Integrations;
using SV5T.Infrastructure.Persistence;
using SV5T.Infrastructure.Repositories;
using System.Globalization;

namespace SV5T.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "ConnectionStrings:DefaultConnection must be configured.");
        }

        services.AddDbContextPool<ApplicationDbContext>(
            options =>
                options.UseMySql(
                    connectionString,
                    new MySqlServerVersion(new Version(8, 4, 0)),
                    mysqlOptions =>
                    {
                        mysqlOptions.CommandTimeout(15);
                        // Auth transactions also perform non-idempotent Redis operations.
                        // Automatic EF retries would replay those operations and are not
                        // compatible with the explicit transactions in UnitOfWork.
                    }),
            poolSize: 128);

        services.AddOptions<JwtOptions>()
            .Bind(configuration.GetSection(JwtOptions.SectionName))
            .Validate(
                value =>
                    !string.IsNullOrWhiteSpace(value.Issuer) &&
                    !string.IsNullOrWhiteSpace(value.Audience) &&
                    Encoding.UTF8.GetByteCount(value.Key) >= 32 &&
                    value.AccessTokenMinutes is > 0 and <= 60 &&
                    value.RefreshTokenDays is > 0 and <= 30 &&
                    value.MaxConcurrentSessions is >= 1 and <= 20,
                "Jwt configuration is invalid.")
            .ValidateOnStart();
        services.AddOptions<OtpOptions>()
            .Bind(configuration.GetSection(OtpOptions.SectionName))
            .Validate(
                value =>
                    Encoding.UTF8.GetByteCount(value.Pepper) >= 32 &&
                    value.ExpirySeconds is >= 60 and <= 900 &&
                    value.ResendSeconds is >= 30 and <= 300 &&
                    value.MaxAttempts is >= 3 and <= 10 &&
                    value.MaxRequestsPerHour is >= 1 and <= 20,
                "Otp configuration is invalid.")
            .ValidateOnStart();
        services.AddOptions<IdentifierHashOptions>()
            .Bind(configuration.GetSection(IdentifierHashOptions.SectionName))
            .Validate(
                value => Encoding.UTF8.GetByteCount(value.Key) >= 32,
                "IdentifierHash:Key must contain at least 32 bytes.")
            .ValidateOnStart();
        services.AddOptions<SchoolEmailOptions>()
            .Bind(configuration.GetSection(SchoolEmailOptions.SectionName))
            .Validate(
                value => value.AllowedDomains.Length > 0 &&
                         value.AllowedDomains.All(
                             domain => !string.IsNullOrWhiteSpace(domain)),
                "At least one school email domain must be configured.")
            .ValidateOnStart();
        services.AddOptions<RedisOptions>()
            .Bind(configuration.GetSection(RedisOptions.SectionName))
            .Validate(
                value =>
                    !string.IsNullOrWhiteSpace(value.KeyPrefix) &&
                    value.ConnectTimeoutMilliseconds is >= 1_000 and <= 30_000 &&
                    value.OperationTimeoutMilliseconds is >= 1_000 and <= 30_000 &&
                    value.KeepAliveSeconds is >= 15 and <= 300 &&
                    value.LoginMaxAttempts is >= 3 and <= 20 &&
                    value.LoginIpMaxAttempts is >= 5 and <= 100 &&
                    value.LoginBlockMinutes is >= 5 and <= 120,
                "Redis configuration is invalid.")
            .ValidateOnStart();

        var redisConnection = configuration.GetConnectionString("Redis");
        if (string.IsNullOrWhiteSpace(redisConnection))
        {
            throw new InvalidOperationException(
                "ConnectionStrings:Redis must be configured.");
        }

        var redis = configuration
            .GetSection(RedisOptions.SectionName)
            .Get<RedisOptions>() ?? new RedisOptions();
        var redisConfiguration = ConfigurationOptions.Parse(redisConnection);
        redisConfiguration.AbortOnConnectFail = false;
        redisConfiguration.ConnectRetry = 3;
        redisConfiguration.ConnectTimeout = redis.ConnectTimeoutMilliseconds;
        redisConfiguration.SyncTimeout = redis.OperationTimeoutMilliseconds;
        redisConfiguration.AsyncTimeout = redis.OperationTimeoutMilliseconds;
        redisConfiguration.KeepAlive = redis.KeepAliveSeconds;
        redisConfiguration.ClientName = "sv5t-api";
        redisConfiguration.ReconnectRetryPolicy = new ExponentialRetry(5_000);

        if (redis.RequireAuthentication &&
            string.IsNullOrWhiteSpace(redisConfiguration.Password))
        {
            throw new InvalidOperationException(
                "Redis authentication is required. Configure a password in ConnectionStrings:Redis.");
        }

        if (redis.RequireTls && !redisConfiguration.Ssl)
        {
            throw new InvalidOperationException(
                "Redis TLS is required. Add ssl=true to ConnectionStrings:Redis.");
        }

        services.AddSingleton<IConnectionMultiplexer>(provider =>
        {
            var logger = provider
                .GetRequiredService<ILoggerFactory>()
                .CreateLogger("SV5T.Redis");
            var connection = ConnectionMultiplexer.Connect(redisConfiguration);
            connection.ConnectionFailed += (_, args) =>
                logger.LogError(
                    args.Exception,
                    "Redis connection failed. FailureType: {FailureType}",
                    args.FailureType);
            connection.ConnectionRestored += (_, args) =>
                logger.LogInformation(
                    "Redis connection restored. FailureType: {FailureType}",
                    args.FailureType);
            connection.ErrorMessage += (_, args) =>
            {
                if (!args.Message.Contains("BUSYGROUP", StringComparison.Ordinal))
                {
                    logger.LogWarning("Redis error: {Message}", args.Message);
                }
            };
            return connection;
        });

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IOtpService, OtpService>();
        services.AddSingleton<ISha256Hasher, Sha256Hasher>();
        services.AddSingleton<ISchoolEmailValidator, SchoolEmailValidator>();
        services.AddSingleton<IRefreshTokenFactory, RefreshTokenFactory>();
        services.AddSingleton<IAuthRedisStore, AuthRedisStore>();
        services.AddSingleton<IAuthChallengeStore, RedisAuthChallengeStore>();
        services.AddSingleton<IJwtService, JwtService>();
        services.AddHostedService<RefreshTokenCleanupService>();
        services.AddEmailServices(configuration);
        services.AddHealthChecks()
            .AddCheck<DatabaseHealthCheck>(
                "database",
                tags: ["ready"])
            .AddCheck<RedisHealthCheck>(
                "redis",
                tags: ["ready"]);

        var jwt = configuration
            .GetSection(JwtOptions.SectionName)
            .Get<JwtOptions>() ?? new JwtOptions();
        JwtSecurityTokenHandler.DefaultMapInboundClaims = false;
        services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwt.Issuer,
                    ValidAudience = jwt.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwt.Key)),
                    ClockSkew = TimeSpan.Zero,
                    NameClaimType = JwtRegisteredClaimNames.Sub
                };
                options.Events = new JwtBearerEvents
                {
                    OnChallenge = async context =>
                    {
                        context.HandleResponse();
                        context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                        context.Response.ContentType = "application/problem+json";
                        await context.Response.WriteAsJsonAsync(new
                        {
                            type = "https://httpstatuses.com/401",
                            title = "Unauthorized",
                            status = 401,
                            detail = "Yêu cầu cần access token hợp lệ.",
                            code = "unauthorized",
                            traceId = context.HttpContext.TraceIdentifier
                        });
                    },
                    OnForbidden = async context =>
                    {
                        context.Response.StatusCode = StatusCodes.Status403Forbidden;
                        context.Response.ContentType = "application/problem+json";
                        await context.Response.WriteAsJsonAsync(new
                        {
                            type = "https://httpstatuses.com/403",
                            title = "Forbidden",
                            status = 403,
                            detail = "Bạn không có quyền thực hiện thao tác này.",
                            code = "forbidden",
                            traceId = context.HttpContext.TraceIdentifier
                        });
                    },
                    OnTokenValidated = async context =>
                    {
                        var jti = context.Principal?.FindFirst(
                            JwtRegisteredClaimNames.Jti)?.Value;
                        if (string.IsNullOrWhiteSpace(jti))
                        {
                            context.Fail("JWT không có jti.");
                            return;
                        }

                        var store = context.HttpContext.RequestServices
                            .GetRequiredService<IAuthRedisStore>();
                        if (await store.IsAccessTokenBlacklistedAsync(jti))
                        {
                            context.Fail("Access token đã bị thu hồi.");
                            return;
                        }

                        var subject = context.Principal?.FindFirst(
                            JwtRegisteredClaimNames.Sub)?.Value;
                        if (!Guid.TryParse(subject, out var userId))
                        {
                            context.Fail("JWT thiếu thông tin phiên bắt buộc.");
                            return;
                        }

                        var users = context.HttpContext.RequestServices
                            .GetRequiredService<IUserRepository>();
                        var user = await users.GetByIdAsync(
                            userId,
                            context.HttpContext.RequestAborted);
                        if (user is null ||
                            !user.IsActive ||
                            !user.IsVerified)
                        {
                            context.Fail("Phiên đăng nhập không còn hiệu lực.");
                        }
                    }
                };
            });
        services.AddAuthorization();

        return services;
    }
}

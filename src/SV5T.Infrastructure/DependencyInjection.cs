using System.IdentityModel.Tokens.Jwt;
using System.Text;
using CloudinaryDotNet;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using SV5T.Application.Common.Interfaces;
using SV5T.Domain.Auth;
using SV5T.Domain.Users;
using SV5T.Domain.Welcome;
using SV5T.Infrastructure.Email;
using SV5T.Infrastructure.Health;
using SV5T.Infrastructure.Identity;
using SV5T.Infrastructure.Options;
using SV5T.Infrastructure.Persistence.Context;
using SV5T.Infrastructure.Persistence.Repositories;
using SV5T.Infrastructure.Persistence.UnitOfWork;
using SV5T.Infrastructure.Security.Hashing;
using SV5T.Infrastructure.Security.Pii;
using SV5T.Infrastructure.Storage;

namespace SV5T.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
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
                     value.RefreshTokenIdleMinutes is >= 15 and <= 1_440 &&
                     value.RefreshTokenDays is >= 1 and <= 90 &&
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

        services.AddOptions<PiiEncryptionOptions>()
            .Bind(configuration.GetSection(PiiEncryptionOptions.SectionName))
            .Validate(
                value => value.BatchSize is >= 10 and <= 1_000,
                "PiiEncryption configuration is invalid.")
            .ValidateOnStart();

        services.AddOptions<CloudinaryOptions>()
            .Bind(configuration.GetSection(CloudinaryOptions.SectionName))
            .Validate(
                value => !string.IsNullOrWhiteSpace(value.CloudName) &&
                         !string.IsNullOrWhiteSpace(value.ApiKey) &&
                         !string.IsNullOrWhiteSpace(value.ApiSecret),
                "Cloudinary configuration is invalid.")
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

        services.AddSingleton<IPiiProtector, DataProtectionPiiProtector>();
        services.AddSingleton(provider =>
        {
            var options = provider
                .GetRequiredService<Microsoft.Extensions.Options.IOptions<CloudinaryOptions>>()
                .Value;
            var cloudinary = new Cloudinary(new Account(
                options.CloudName, options.ApiKey, options.ApiSecret));
            cloudinary.Api.Secure = true;
            return cloudinary;
        });

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IAvatarStorage, CloudinaryAvatarStorage>();
        services.AddScoped<IPortalContentRepository, PortalContentRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
        services.AddScoped<IUnitOfWork, UnitOfWork>();
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddSingleton<IOtpService, OtpService>();
        services.AddSingleton<ISha256Hasher, Sha256Hasher>();
        services.AddSingleton<ISchoolEmailValidator, SchoolEmailValidator>();
        services.AddSingleton<IRefreshTokenFactory, RefreshTokenFactory>();
        services.AddSingleton<IAuthRedisStore, AuthRedisStore>();
        services.AddSingleton<IAuthChallengePayloadProtector, DataProtectionAuthChallengePayloadProtector>();
        services.AddSingleton<IAuthChallengeStore, RedisAuthChallengeStore>();
        services.AddSingleton<IJwtService, JwtService>();
        services.AddHostedService<RefreshTokenCleanupService>();
        services.AddHostedService<UnverifiedUserCleanupService>();
        services.AddEmailServices(configuration, environment);
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
                            title = "Chưa xác thực",
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
                            title = "Không có quyền truy cập",
                            status = 403,
                            detail = "Bạn không có quyền thực hiện thao tác này.",
                            code = "forbidden",
                            traceId = context.HttpContext.TraceIdentifier
                        });
                    }
                };
            });
        services.AddAuthorization();

        return services;
    }
}


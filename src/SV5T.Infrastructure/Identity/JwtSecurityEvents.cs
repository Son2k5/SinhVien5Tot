using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Users.Abstractions;
using SV5T.Infrastructure.Options;

namespace SV5T.Infrastructure.Identity;

public sealed class JwtSecurityEvents : JwtBearerEvents
{
    private readonly ILogger<JwtSecurityEvents>? _logger;

    public JwtSecurityEvents()
    {
    }

    public JwtSecurityEvents(ILogger<JwtSecurityEvents> logger)
    {
        _logger = logger;
    }
    public override async Task TokenValidated(TokenValidatedContext context)
    {
        var principal = context.Principal;
        if (principal is null)
        {
            LogDenied("missing_principal", null);
            context.Fail("Missing authenticated principal.");
            return;
        }

        var subClaim = principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value
            ?? principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(subClaim, out var userId))
        {
            LogDenied("invalid_sub", userId: null);
            context.Fail("Missing or invalid sub claim.");
            return;
        }

        var svClaim = principal.FindFirst("sv")?.Value;
        if (!int.TryParse(
                svClaim,
                NumberStyles.None,
                CultureInfo.InvariantCulture,
                out var tokenSv))
        {
            LogDenied("invalid_sv_claim", userId);
            context.Fail("Missing or invalid security version claim.");
            return;
        }

        var services = context.HttpContext.RequestServices;
        var redisStore = services.GetRequiredService<IAuthRedisStore>();
        var userRepository = services.GetRequiredService<IUserRepository>();
        var jwtOptions = services.GetRequiredService<IOptions<JwtOptions>>().Value;

        int currentSv;

        var cachedSv = await redisStore.GetUserSecurityVersionAsync(userId);
        if (cachedSv.HasValue)
        {
            currentSv = cachedSv.Value;
        }
        else
        {
            var user = await userRepository.GetByIdAsync(
                userId,
                context.HttpContext.RequestAborted);

            if (user is null)
            {
                LogDenied("user_not_found", userId);
                context.Fail("User no longer exists.");
                return;
            }

            currentSv = user.SecurityVersion;

            // Backfill cache to avoid DB hit on every request.
            await redisStore.SetUserSecurityVersionAsync(
                userId,
                currentSv,
                TimeSpan.FromMinutes(Math.Max(jwtOptions.AccessTokenMinutes + 5, 30)));
        }

        if (tokenSv != currentSv)
        {
            _logger?.LogWarning(
                "Jwt TokenValidated denied: reason={Reason} userId={UserId} tokenSv={TokenSv} currentSv={CurrentSv} redisHit={RedisHit}",
                "sv_mismatch",
                userId,
                tokenSv,
                currentSv,
                cachedSv.HasValue);
            context.Fail("Token has been invalidated.");
        }
    }

    public override async Task AuthenticationFailed(AuthenticationFailedContext context)
    {
        // Ghi lý do thật (signature/lifetime/issuer/audience/key) ra log server.
        // Client vẫn chỉ nhận 401 generic từ Challenge() để không lộ secret.
        _logger?.LogWarning(
            context.Exception,
            "Jwt AuthenticationFailed: {ExceptionType} traceId={TraceId}",
            context.Exception.GetType().Name,
            context.HttpContext.TraceIdentifier);
        await Task.CompletedTask;
    }

    private void LogDenied(string reason, Guid? userId) =>
        _logger?.LogWarning(
            "Jwt TokenValidated denied: reason={Reason} userId={UserId}",
            reason,
            userId);

    public override async Task Challenge(JwtBearerChallengeContext context)
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
    }

    public override async Task Forbidden(ForbiddenContext context)
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
}

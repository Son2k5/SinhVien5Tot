using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using SV5T.Application.Common.Interfaces;

namespace SV5T.Api.Security;

public sealed class HttpCurrentUser(IHttpContextAccessor httpContextAccessor)
    : ICurrentUser
{
    private ClaimsPrincipal? Principal => httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public Guid? UserId =>
        Guid.TryParse(
            Principal?.FindFirstValue(JwtRegisteredClaimNames.Sub),
            out var userId)
            ? userId
            : null;

    public bool IsInRole(string role) => Principal?.IsInRole(role) == true;
}

internal static class AuthRateLimitPolicies
{
    internal const string Register = "auth-register";
    internal const string Login = "auth-login";
    internal const string Otp = "auth-otp";
    internal const string Email = "auth-email";
    internal const string Refresh = "auth-refresh";
}

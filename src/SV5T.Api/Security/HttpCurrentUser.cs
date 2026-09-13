using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using SV5T.Application.Common.Abstractions;

namespace SV5T.Api.Security;

public sealed class HttpCurrentUser(IHttpContextAccessor httpContextAccessor) : ICurrentUser
{
    private ClaimsPrincipal? Principal => httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public Guid? UserId =>
        Guid.TryParse(
            Principal?.FindFirstValue(JwtRegisteredClaimNames.Sub)
                ?? Principal?.FindFirstValue(ClaimTypes.NameIdentifier),
            out var userId
        )
            ? userId
            : null;

    public bool IsInRole(string role) => Principal?.IsInRole(role) == true;
}

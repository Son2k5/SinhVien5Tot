using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using SV5T.Application.Interfaces.Services.Commons;

namespace SV5T.Presentation.Security;

public sealed class HttpCurrentUser(IHttpContextAccessor httpContextAccessor)
    : ICurrentUser
{
    private ClaimsPrincipal? Principal => httpContextAccessor.HttpContext?.User;

    public bool IsAuthenticated => Principal?.Identity?.IsAuthenticated == true;

    public Guid? UserId => Guid.TryParse(
        Principal?.FindFirstValue(JwtRegisteredClaimNames.Sub),
        out var userId)
        ? userId
        : null;

    public bool IsInRole(string role) => Principal?.IsInRole(role) == true;
}

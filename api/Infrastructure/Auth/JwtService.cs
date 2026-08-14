using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SV5T.Application.DTOs.Auth;
using SV5T.Application.Interfaces.Services.Auth;
using SV5T.Domain.Entities;
using SV5T.Infrastructure.Options.Authentication;

namespace SV5T.Infrastructure.Auth;

public sealed class JwtService(IOptions<JwtOptions> options) : IJwtService
{
    public GeneratedAccessToken Generate(User user)
    {
        var value = options.Value;
        var now = DateTime.UtcNow;
        var expiresAt = now.AddMinutes(value.AccessTokenMinutes);
        var jti = Guid.NewGuid().ToString("N");
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString("D")),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, jti),
            new Claim("sv", user.SecurityVersion.ToString(
                System.Globalization.CultureInfo.InvariantCulture)),
            new Claim(ClaimTypes.Role, user.Role.ToString())
        };
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(value.Key)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            value.Issuer,
            value.Audience,
            claims,
            now,
            expiresAt,
            credentials);
        return new GeneratedAccessToken(
            new JwtSecurityTokenHandler().WriteToken(token),
            jti,
            expiresAt);
    }
}

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using SV5T.Application.Auth.Dtos;
using SV5T.Application.Common.Interfaces;
using SV5T.Domain.Users;
using SV5T.Infrastructure.Options;

namespace SV5T.Infrastructure.Identity;

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

public sealed class OtpService(IOptions<OtpOptions> options) : IOtpService
{
    public TimeSpan Expiry => TimeSpan.FromSeconds(options.Value.ExpirySeconds);

    public int MaxAttempts => options.Value.MaxAttempts;

    private readonly byte[] pepper =
        Encoding.UTF8.GetBytes(options.Value.Pepper);

    public string Generate()
    {
        return RandomNumberGenerator.GetInt32(0, 1_000_000)
            .ToString("D6");
    }

    public string Hash(string otp)
    {
        using var hmac = new HMACSHA256(pepper);
        return Convert.ToHexString(
            hmac.ComputeHash(Encoding.UTF8.GetBytes(otp)));
    }

    public bool FixedTimeEquals(string leftHash, string rightHash)
    {
        try
        {
            return CryptographicOperations.FixedTimeEquals(
                Convert.FromHexString(leftHash),
                Convert.FromHexString(rightHash));
        }
        catch
        {
            return false;
        }
    }
}

public sealed class RefreshTokenFactory(
    ISha256Hasher sha256Hasher,
    IOptions<JwtOptions> options) : IRefreshTokenFactory
{
    public TimeSpan IdleTimeout =>
        TimeSpan.FromMinutes(options.Value.RefreshTokenIdleMinutes);

    public GeneratedRefreshToken Generate(
        bool isPersistent,
        DateTime? absoluteExpiresAtUtc = null)
    {
        var now = DateTime.UtcNow;
        var absoluteExpiry = absoluteExpiresAtUtc ??
            now.AddDays(options.Value.RefreshTokenDays);
        var tokenId = Guid.NewGuid();
        var secret = WebEncoders.Base64UrlEncode(
            RandomNumberGenerator.GetBytes(32));
        var rawToken = $"{tokenId:N}.{secret}";
        return new GeneratedRefreshToken(
            tokenId,
            rawToken,
            sha256Hasher.HashToken(rawToken),
            absoluteExpiry,
            absoluteExpiry,
            isPersistent);
    }

    public bool TryGetTokenId(string rawToken, out Guid tokenId)
    {
        tokenId = Guid.Empty;
        if (string.IsNullOrWhiteSpace(rawToken))
        {
            return false;
        }

        var separator = rawToken.IndexOf('.');
        if (separator <= 0)
        {
            return false;
        }

        return Guid.TryParseExact(rawToken[..separator], "N", out tokenId);
    }
}

public sealed class SchoolEmailValidator(
    IOptions<SchoolEmailOptions> options) : ISchoolEmailValidator
{
    public bool IsAllowed(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        var at = email.LastIndexOf('@');
        if (at <= 0 || at == email.Length - 1)
        {
            return false;
        }

        var domain = email[(at + 1)..];
        return options.Value.AllowedDomains.Any(
            allowed => string.Equals(
                allowed, domain, StringComparison.OrdinalIgnoreCase));
    }
}

public interface IAuthChallengePayloadProtector
{
    string Protect(string plaintext);
    string Unprotect(string protectedValue);
}

public sealed class DataProtectionAuthChallengePayloadProtector(
    IDataProtectionProvider provider) : IAuthChallengePayloadProtector
{
    private readonly IDataProtector protector = provider.CreateProtector(
        "SV5T.AuthChallenge.Payload.v1");

    public string Protect(string plaintext) =>
        string.IsNullOrEmpty(plaintext) ? plaintext : protector.Protect(plaintext);

    public string Unprotect(string protectedValue) =>
        string.IsNullOrEmpty(protectedValue)
            ? protectedValue
            : protector.Unprotect(protectedValue);
}


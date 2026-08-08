using System.Security.Cryptography;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using SV5T.Application.DTOs.Auth;
using SV5T.Application.Interfaces.Services.Auth;
using SV5T.Infrastructure.Options.Authentication;

namespace SV5T.Infrastructure.Auth;

public sealed class RefreshTokenFactory(
    ISha256Hasher sha256Hasher,
    IOptions<JwtOptions> options) : IRefreshTokenFactory
{
    public GeneratedRefreshToken Generate()
    {
        var tokenId = Guid.NewGuid();
        var secret = WebEncoders.Base64UrlEncode(
            RandomNumberGenerator.GetBytes(32));
        var rawToken = $"{tokenId:N}.{secret}";
        return new GeneratedRefreshToken(
            tokenId,
            rawToken,
            sha256Hasher.HashToken(rawToken),
            DateTime.UtcNow.AddDays(options.Value.RefreshTokenDays));
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

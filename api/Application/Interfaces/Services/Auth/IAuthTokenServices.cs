using SV5T.Application.DTOs.Auth;
using SV5T.Domain.Entities;

namespace SV5T.Application.Interfaces.Services.Auth;

public interface IJwtService
{
    GeneratedAccessToken Generate(User user);
}

public interface IRefreshTokenFactory
{
    TimeSpan IdleTimeout { get; }

    GeneratedRefreshToken Generate(
        bool isPersistent,
        DateTime? absoluteExpiresAtUtc = null);
    bool TryGetTokenId(string rawToken, out Guid tokenId);
}

public interface ISchoolEmailValidator
{
    bool IsAllowed(string email);
}

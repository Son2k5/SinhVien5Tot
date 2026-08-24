using SV5T.Application.Auth.Dtos;
using SV5T.Application.Common.Models;
using SV5T.Domain.Auth.Enums;
using SV5T.Domain.Users;

namespace SV5T.Application.Common.Interfaces;

public interface IJwtService
{
    GeneratedAccessToken Generate(User user);
}

public interface IOtpService
{
    TimeSpan Expiry { get; }
    int MaxAttempts { get; }
    string Generate();
    string Hash(string otp);
    bool FixedTimeEquals(string leftHash, string rightHash);
}

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string? passwordHash);
}

public interface ISha256Hasher
{
    string HashToken(string token);
    string HashIdentifier(string value);
    bool VerifyToken(string token, string expectedHash);
}

public interface ISchoolEmailValidator
{
    bool IsAllowed(string email);
}

public interface IRefreshTokenFactory
{
    TimeSpan IdleTimeout { get; }
    GeneratedRefreshToken Generate(
        bool isPersistent,
        DateTime? absoluteExpiresAtUtc = null);
    bool TryGetTokenId(string rawToken, out Guid tokenId);
}

public interface IAuthChallengeStore
{
    Task<AuthChallengeData?> GetAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task StoreAsync(
        AuthChallengeData challenge,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<int> IncrementFailureAsync(
        Guid id,
        AuthChallengePurpose purpose,
        DateTime nowUtc,
        CancellationToken cancellationToken = default);

    Task<bool> TryConsumeAsync(
        Guid id,
        AuthChallengePurpose purpose,
        string expectedOtpHash,
        DateTime consumedAtUtc,
        CancellationToken cancellationToken = default);

    Task<bool> TryReplaceOtpAsync(
        Guid id,
        AuthChallengePurpose purpose,
        string otpHash,
        DateTime expiresAtUtc,
        DateTime updatedAtUtc,
        CancellationToken cancellationToken = default);
}

public enum OtpPurpose
{
    Register,
    ResetPassword
}

public enum OtpIssueResult
{
    Allowed,
    Cooldown,
    RateLimited
}

public interface IAuthRedisStore
{
    Task<OtpIssueResult> ReserveOtpRequestAsync(string email);
    Task<bool> IsLoginBlockedAsync(string email, string ipAddress);
    Task RecordLoginFailureAsync(string email, string ipAddress);
    Task ClearAccountLoginFailuresAsync(string email);
}

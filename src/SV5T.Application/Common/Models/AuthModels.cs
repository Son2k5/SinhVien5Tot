using SV5T.Domain.Auth.Enums;

namespace SV5T.Application.Common.Models;

public sealed record AuthChallengeData(
    Guid Id,
    AuthChallengePurpose Purpose,
    string Email,
    string NormalizedEmail,
    string? DisplayName,
    string? PasswordHash,
    string OtpHash,
    int FailedAttempts,
    int MaxAttempts,
    DateTime ExpiresAtUtc,
    DateTime CreatedAtUtc);

public static class TokenIdlePolicy
{
    public static bool IsIdleExpired(
        DateTime lastUsedAtUtc,
        DateTime nowUtc,
        TimeSpan idleTimeout) =>
        nowUtc - lastUsedAtUtc > idleTimeout;
}

using SV5T.Domain.Enums;

namespace SV5T.Application.Models.Auth;

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

namespace SV5T.Application.DTOs.Auth;

public sealed record GeneratedAccessToken(
    string Token,
    string Jti,
    DateTime ExpiresAtUtc);

public sealed record GeneratedRefreshToken(
    Guid TokenId,
    string RawToken,
    string TokenHash,
    DateTime ExpiresAtUtc);

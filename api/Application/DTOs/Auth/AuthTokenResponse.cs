namespace SV5T.Application.DTOs.Auth;

public sealed record AuthTokenResponse(
    string AccessToken,
    DateTime ExpiresAtUtc);
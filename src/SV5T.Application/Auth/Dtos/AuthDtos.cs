namespace SV5T.Application.Auth.Dtos;

public sealed record RegistrationStartedResponse(
    Guid RegistrationId,
    string Message);

public sealed record PasswordResetStartedResponse(
    Guid ResetId,
    string Message);

public sealed record AuthTokenResponse(
    string AccessToken,
    DateTime ExpiresAtUtc);

public sealed record AuthTokens(
    string AccessToken,
    DateTime AccessTokenExpiresAtUtc,
    string RefreshToken,
    DateTime RefreshTokenExpiresAtUtc,
    bool IsPersistent);

public sealed record ForgotPasswordRequest(string Email);

public sealed record GeneratedAccessToken(
    string Token,
    string Jti,
    DateTime ExpiresAtUtc);

public sealed record GeneratedRefreshToken(
    Guid TokenId,
    string RawToken,
    string TokenHash,
    DateTime ExpiresAtUtc,
    DateTime AbsoluteExpiresAtUtc,
    bool IsPersistent);

public sealed record LoginRequest(
    string Email,
    string Password,
    bool RememberMe = false);

public sealed record MessageResponse(string Message);

public sealed record RegisterRequest(string Name, string Email, string Password);

public sealed record ResendOtpRequest(Guid RegistrationId);

public sealed record ResetPasswordRequest(
    Guid ResetId,
    string Otp,
    string NewPassword);

public sealed record VerifyOtpRequest(Guid RegistrationId, string Otp);

public sealed record VerifyResetOtpRequest(Guid ResetId, string Otp);

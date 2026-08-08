namespace SV5T.Application.DTOs.Auth;

public sealed record ResetPasswordRequest(
    Guid ResetId,
    string Otp,
    string NewPassword);

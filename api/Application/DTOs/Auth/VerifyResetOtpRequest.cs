namespace SV5T.Application.DTOs.Auth;

public sealed record VerifyResetOtpRequest(Guid ResetId, string Otp);

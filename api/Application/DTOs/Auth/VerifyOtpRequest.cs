namespace SV5T.Application.DTOs.Auth;

public sealed record VerifyOtpRequest(Guid RegistrationId, string Otp);

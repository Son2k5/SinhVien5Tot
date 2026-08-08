namespace SV5T.Application.DTOs.Auth;

public sealed record RegistrationStartedResponse(
    Guid RegistrationId,
    string Message);

public sealed record PasswordResetStartedResponse(
    Guid ResetId,
    string Message);

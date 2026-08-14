using SV5T.Application.DTOs.Auth;
using SV5T.Application.Interfaces.Services.Auth;

namespace SV5T.Application.Services;

public sealed class AuthService(
    RegistrationService registration,
    TokenService tokens,
    PasswordResetService passwordReset) : IAuthService
{
    public Task<Guid> RegisterAsync(
        RegisterRequest request,
        CancellationToken cancellationToken = default) =>
        registration.RegisterAsync(request, cancellationToken);

    public Task VerifyOtpAsync(
        VerifyOtpRequest request,
        CancellationToken cancellationToken = default) =>
        registration.VerifyOtpAsync(request, cancellationToken);

    public Task ResendOtpAsync(
        ResendOtpRequest request,
        CancellationToken cancellationToken = default) =>
        registration.ResendOtpAsync(request, cancellationToken);

    public Task<AuthTokens> LoginAsync(
        LoginRequest request,
        string ipAddress,
        CancellationToken cancellationToken = default) =>
        tokens.LoginAsync(request, ipAddress, cancellationToken);

    public Task<AuthTokens> RefreshAsync(
        string refreshToken,
        CancellationToken cancellationToken = default) =>
        tokens.RefreshAsync(refreshToken, cancellationToken);

    public Task<Guid> ForgotPasswordAsync(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken = default) =>
        passwordReset.ForgotPasswordAsync(request, cancellationToken);

    public Task VerifyResetOtpAsync(
        VerifyResetOtpRequest request,
        CancellationToken cancellationToken = default) =>
        passwordReset.VerifyResetOtpAsync(request, cancellationToken);

    public Task ResetPasswordAsync(
        ResetPasswordRequest request,
        CancellationToken cancellationToken = default) =>
        passwordReset.ResetPasswordAsync(request, cancellationToken);

    public Task LogoutAsync(
        Guid userId,
        string? refreshToken,
        CancellationToken cancellationToken = default) =>
        tokens.LogoutAsync(
            userId,
            refreshToken,
            cancellationToken);
}

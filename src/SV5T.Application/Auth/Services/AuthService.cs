using SV5T.Application.Auth.Commands.ForgotPassword;
using SV5T.Application.Auth.Commands.Login;
using SV5T.Application.Auth.Commands.Logout;
using SV5T.Application.Auth.Commands.RefreshToken;
using SV5T.Application.Auth.Commands.Register;
using SV5T.Application.Auth.Commands.ResendOtp;
using SV5T.Application.Auth.Commands.ResetPassword;
using SV5T.Application.Auth.Commands.VerifyOtp;
using SV5T.Application.Auth.Commands.VerifyResetOtp;
using SV5T.Application.Auth.Dtos;
using SV5T.Domain.Auth;

namespace SV5T.Application.Auth.Services;

public interface IAuthService
{
    Task<Guid> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);
    Task VerifyOtpAsync(VerifyOtpRequest request, CancellationToken cancellationToken = default);
    Task ResendOtpAsync(ResendOtpRequest request, CancellationToken cancellationToken = default);
    Task<AuthTokens> LoginAsync(
        LoginRequest request,
        string ipAddress,
        CancellationToken cancellationToken = default);
    Task<AuthTokens> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default);
    Task<Guid> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default);
    Task VerifyResetOtpAsync(
        VerifyResetOtpRequest request,
        CancellationToken cancellationToken = default);
    Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default);
    Task LogoutAsync(
        Guid userId,
        string? refreshToken,
        CancellationToken cancellationToken = default);
}

public sealed class AuthService(
    RegisterHandler registerHandler,
    VerifyOtpHandler verifyOtpHandler,
    ResendOtpHandler resendOtpHandler,
    LoginHandler loginHandler,
    RefreshTokenHandler refreshTokenHandler,
    LogoutHandler logoutHandler,
    ForgotPasswordHandler forgotPasswordHandler,
    VerifyResetOtpHandler verifyResetOtpHandler,
    ResetPasswordHandler resetPasswordHandler) : IAuthService
{
    public Task<Guid> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default) =>
        registerHandler.HandleAsync(new RegisterCommand(request.Name, request.Email, request.Password), cancellationToken);

    public Task VerifyOtpAsync(VerifyOtpRequest request, CancellationToken cancellationToken = default) =>
        verifyOtpHandler.HandleAsync(new VerifyOtpCommand(request.RegistrationId, request.Otp), cancellationToken);

    public Task ResendOtpAsync(ResendOtpRequest request, CancellationToken cancellationToken = default) =>
        resendOtpHandler.HandleAsync(new ResendOtpCommand(request.RegistrationId), cancellationToken);

    public Task<AuthTokens> LoginAsync(LoginRequest request, string ipAddress, CancellationToken cancellationToken = default) =>
        loginHandler.HandleAsync(new LoginCommand(request, ipAddress), cancellationToken);

    public Task<AuthTokens> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default) =>
        refreshTokenHandler.HandleAsync(new RefreshTokenCommand(refreshToken), cancellationToken);

    public Task<Guid> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default) =>
        forgotPasswordHandler.HandleAsync(new ForgotPasswordCommand(request), cancellationToken);

    public Task VerifyResetOtpAsync(VerifyResetOtpRequest request, CancellationToken cancellationToken = default) =>
        verifyResetOtpHandler.HandleAsync(new VerifyResetOtpCommand(request), cancellationToken);

    public Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default) =>
        resetPasswordHandler.HandleAsync(new ResetPasswordCommand(request), cancellationToken);

    public Task LogoutAsync(Guid userId, string? refreshToken, CancellationToken cancellationToken = default) =>
        logoutHandler.HandleAsync(new LogoutCommand(userId, refreshToken), cancellationToken);
}

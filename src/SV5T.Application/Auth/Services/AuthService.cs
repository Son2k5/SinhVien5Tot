using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
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
using SV5T.Application.Common.Interfaces;
using SV5T.Domain.Auth;
using SV5T.Domain.Users;

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

public sealed class RegistrationService(
    IUserRepository userRepository,
    IAuthChallengeStore challengeStore,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    IOtpService otpService,
    IAuthRedisStore throttleStore,
    IEmailQueue emailQueue,
    IValidator<RegisterRequest> registerValidator,
    IValidator<VerifyOtpRequest> verifyOtpValidator,
    IValidator<ResendOtpRequest> resendOtpValidator)
{
    public Task<Guid> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default) =>
        new RegisterHandler(userRepository, challengeStore, passwordHasher, otpService, throttleStore, emailQueue, registerValidator)
            .HandleAsync(new RegisterCommand(request.Name, request.Email, request.Password), cancellationToken);

    public Task VerifyOtpAsync(VerifyOtpRequest request, CancellationToken cancellationToken = default) =>
        new VerifyOtpHandler(userRepository, challengeStore, unitOfWork, otpService, verifyOtpValidator)
            .HandleAsync(new VerifyOtpCommand(request.RegistrationId, request.Otp), cancellationToken);

    public Task ResendOtpAsync(ResendOtpRequest request, CancellationToken cancellationToken = default) =>
        new ResendOtpHandler(challengeStore, otpService, throttleStore, emailQueue, resendOtpValidator)
            .HandleAsync(new ResendOtpCommand(request.RegistrationId), cancellationToken);
}

public sealed class TokenService(
    IUserRepository userRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    ISha256Hasher sha256Hasher,
    IAuthRedisStore throttleStore,
    IJwtService jwtService,
    IRefreshTokenFactory refreshTokenFactory,
    IValidator<LoginRequest> loginValidator)
{
    public Task<AuthTokens> LoginAsync(LoginRequest request, string ipAddress, CancellationToken cancellationToken = default) =>
        new LoginHandler(userRepository, refreshTokenRepository, unitOfWork, passwordHasher, throttleStore, jwtService, refreshTokenFactory, loginValidator)
            .HandleAsync(new LoginCommand(request, ipAddress), cancellationToken);

    public Task<AuthTokens> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default) =>
        new RefreshTokenHandler(userRepository, refreshTokenRepository, unitOfWork, sha256Hasher, jwtService, refreshTokenFactory)
            .HandleAsync(new RefreshTokenCommand(refreshToken), cancellationToken);

    public Task LogoutAsync(Guid userId, string? refreshToken, CancellationToken cancellationToken = default) =>
        new LogoutHandler(refreshTokenRepository, unitOfWork, sha256Hasher, refreshTokenFactory)
            .HandleAsync(new LogoutCommand(userId, refreshToken), cancellationToken);
}

public sealed class PasswordResetService(
    IUserRepository userRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IAuthChallengeStore challengeStore,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    IOtpService otpService,
    ISha256Hasher sha256Hasher,
    IAuthRedisStore throttleStore,
    IEmailQueue emailQueue,
    ILogger<PasswordResetService> logger,
    IValidator<ForgotPasswordRequest> forgotPasswordValidator,
    IValidator<VerifyResetOtpRequest> verifyResetOtpValidator,
    IValidator<ResetPasswordRequest> resetPasswordValidator)
{
    public Task<Guid> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default)
    {
        _ = logger;
        return new ForgotPasswordHandler(userRepository, challengeStore, otpService, sha256Hasher, throttleStore, emailQueue, NullLogger<ForgotPasswordHandler>.Instance, forgotPasswordValidator)
            .HandleAsync(new ForgotPasswordCommand(request), cancellationToken);
    }

    public Task VerifyResetOtpAsync(VerifyResetOtpRequest request, CancellationToken cancellationToken = default) =>
        new VerifyResetOtpHandler(challengeStore, otpService, verifyResetOtpValidator)
            .HandleAsync(new VerifyResetOtpCommand(request), cancellationToken);

    public Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default) =>
        new ResetPasswordHandler(userRepository, refreshTokenRepository, challengeStore, unitOfWork, passwordHasher, otpService, resetPasswordValidator)
            .HandleAsync(new ResetPasswordCommand(request), cancellationToken);
}

public sealed class AuthService : IAuthService
{
    private readonly RegisterHandler _registerHandler;
    private readonly VerifyOtpHandler _verifyOtpHandler;
    private readonly ResendOtpHandler _resendOtpHandler;
    private readonly LoginHandler _loginHandler;
    private readonly RefreshTokenHandler _refreshTokenHandler;
    private readonly LogoutHandler _logoutHandler;
    private readonly ForgotPasswordHandler _forgotPasswordHandler;
    private readonly VerifyResetOtpHandler _verifyResetOtpHandler;
    private readonly ResetPasswordHandler _resetPasswordHandler;

    public AuthService(
        RegisterHandler registerHandler,
        VerifyOtpHandler verifyOtpHandler,
        ResendOtpHandler resendOtpHandler,
        LoginHandler loginHandler,
        RefreshTokenHandler refreshTokenHandler,
        LogoutHandler logoutHandler,
        ForgotPasswordHandler forgotPasswordHandler,
        VerifyResetOtpHandler verifyResetOtpHandler,
        ResetPasswordHandler resetPasswordHandler)
    {
        _registerHandler = registerHandler;
        _verifyOtpHandler = verifyOtpHandler;
        _resendOtpHandler = resendOtpHandler;
        _loginHandler = loginHandler;
        _refreshTokenHandler = refreshTokenHandler;
        _logoutHandler = logoutHandler;
        _forgotPasswordHandler = forgotPasswordHandler;
        _verifyResetOtpHandler = verifyResetOtpHandler;
        _resetPasswordHandler = resetPasswordHandler;
    }

    public AuthService(
        RegistrationService registration,
        TokenService tokens,
        PasswordResetService reset)
    {
        _registerHandler = null!;
        _verifyOtpHandler = null!;
        _resendOtpHandler = null!;
        _loginHandler = null!;
        _refreshTokenHandler = null!;
        _logoutHandler = null!;
        _forgotPasswordHandler = null!;
        _verifyResetOtpHandler = null!;
        _resetPasswordHandler = null!;
        _registration = registration;
        _tokens = tokens;
        _reset = reset;
    }

    private readonly RegistrationService? _registration;
    private readonly TokenService? _tokens;
    private readonly PasswordResetService? _reset;

    public Task<Guid> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default) =>
        _registration is not null
            ? _registration.RegisterAsync(request, cancellationToken)
            : _registerHandler.HandleAsync(new RegisterCommand(request.Name, request.Email, request.Password), cancellationToken);

    public Task VerifyOtpAsync(VerifyOtpRequest request, CancellationToken cancellationToken = default) =>
        _registration is not null
            ? _registration.VerifyOtpAsync(request, cancellationToken)
            : _verifyOtpHandler.HandleAsync(new VerifyOtpCommand(request.RegistrationId, request.Otp), cancellationToken);

    public Task ResendOtpAsync(ResendOtpRequest request, CancellationToken cancellationToken = default) =>
        _registration is not null
            ? _registration.ResendOtpAsync(request, cancellationToken)
            : _resendOtpHandler.HandleAsync(new ResendOtpCommand(request.RegistrationId), cancellationToken);

    public Task<AuthTokens> LoginAsync(LoginRequest request, string ipAddress, CancellationToken cancellationToken = default) =>
        _tokens is not null
            ? _tokens.LoginAsync(request, ipAddress, cancellationToken)
            : _loginHandler.HandleAsync(new LoginCommand(request, ipAddress), cancellationToken);

    public Task<AuthTokens> RefreshAsync(string refreshToken, CancellationToken cancellationToken = default) =>
        _tokens is not null
            ? _tokens.RefreshAsync(refreshToken, cancellationToken)
            : _refreshTokenHandler.HandleAsync(new RefreshTokenCommand(refreshToken), cancellationToken);

    public Task<Guid> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken cancellationToken = default) =>
        _reset is not null
            ? _reset.ForgotPasswordAsync(request, cancellationToken)
            : _forgotPasswordHandler.HandleAsync(new ForgotPasswordCommand(request), cancellationToken);

    public Task VerifyResetOtpAsync(VerifyResetOtpRequest request, CancellationToken cancellationToken = default) =>
        _reset is not null
            ? _reset.VerifyResetOtpAsync(request, cancellationToken)
            : _verifyResetOtpHandler.HandleAsync(new VerifyResetOtpCommand(request), cancellationToken);

    public Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken cancellationToken = default) =>
        _reset is not null
            ? _reset.ResetPasswordAsync(request, cancellationToken)
            : _resetPasswordHandler.HandleAsync(new ResetPasswordCommand(request), cancellationToken);

    public Task LogoutAsync(Guid userId, string? refreshToken, CancellationToken cancellationToken = default) =>
        _tokens is not null
            ? _tokens.LogoutAsync(userId, refreshToken, cancellationToken)
            : _logoutHandler.HandleAsync(new LogoutCommand(userId, refreshToken), cancellationToken);
}

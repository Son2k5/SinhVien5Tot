using SV5T.Application.DTOs.Auth;

namespace SV5T.Application.Interfaces.Services.Auth;

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
        string jti,
        DateTime accessTokenExpiresAtUtc,
        string? refreshToken,
        CancellationToken cancellationToken = default);
}

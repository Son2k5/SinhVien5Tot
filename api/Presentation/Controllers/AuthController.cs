using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.DTOs.Auth;
using SV5T.Application.Interfaces.Services.Auth;

namespace SV5T.Presentation.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("register")]
    [EnableRateLimiting("auth-register")]
    [ProducesResponseType<RegistrationStartedResponse>(StatusCodes.Status202Accepted)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<RegistrationStartedResponse>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var registrationId = await authService.RegisterAsync(request, cancellationToken);
        return Accepted(new RegistrationStartedResponse(
            registrationId,
            "Nếu yêu cầu hợp lệ, OTP đã được gửi đến email của bạn."));
    }

    [HttpPost("verify-otp")]
    [EnableRateLimiting("auth-otp")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<MessageResponse>> VerifyOtp(
        VerifyOtpRequest request,
        CancellationToken cancellationToken)
    {
        await authService.VerifyOtpAsync(request, cancellationToken);
        return Ok(new MessageResponse("Xác thực email thành công."));
    }

    [HttpPost("resend-otp")]
    [EnableRateLimiting("auth-email")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<MessageResponse>> ResendOtp(
        ResendOtpRequest request,
        CancellationToken cancellationToken)
    {
        await authService.ResendOtpAsync(request, cancellationToken);
        return Ok(new MessageResponse("OTP mới đã được gửi."));
    }

    [HttpPost("login")]
    [EnableRateLimiting("auth-login")]
    [ProducesResponseType<AuthTokenResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<AuthTokenResponse>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var tokens = await authService.LoginAsync(
            request, ipAddress, cancellationToken);
        SetRefreshCookie(tokens.RefreshToken, tokens.RefreshTokenExpiresAtUtc);
        return Ok(new AuthTokenResponse(
            tokens.AccessToken, tokens.AccessTokenExpiresAtUtc));
    }

    [HttpPost("refresh-token")]
    [EnableRateLimiting("auth-refresh")]
    [ProducesResponseType<AuthTokenResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<AuthTokenResponse>> Refresh(
        CancellationToken cancellationToken)
    {
        if (!Request.Cookies.TryGetValue("refreshToken", out var refreshToken))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
                "invalid_session");
        }

        var tokens = await authService.RefreshAsync(
            refreshToken, cancellationToken);
        SetRefreshCookie(tokens.RefreshToken, tokens.RefreshTokenExpiresAtUtc);
        return Ok(new AuthTokenResponse(
            tokens.AccessToken, tokens.AccessTokenExpiresAtUtc));
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting("auth-email")]
    [ProducesResponseType<PasswordResetStartedResponse>(StatusCodes.Status202Accepted)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<PasswordResetStartedResponse>> ForgotPassword(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var resetId = await authService.ForgotPasswordAsync(request, cancellationToken);
        return Accepted(new PasswordResetStartedResponse(
            resetId,
            "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi."));
    }

    [HttpPost("verify-reset-otp")]
    [EnableRateLimiting("auth-otp")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<MessageResponse>> VerifyResetOtp(
        VerifyResetOtpRequest request,
        CancellationToken cancellationToken)
    {
        await authService.VerifyResetOtpAsync(request, cancellationToken);
        return Ok(new MessageResponse("OTP hợp lệ. Bạn có thể tạo mật khẩu mới."));
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting("auth-otp")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<MessageResponse>> ResetPassword(
        ResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        await authService.ResetPasswordAsync(request, cancellationToken);
        DeleteRefreshCookie();
        return Ok(new MessageResponse("Đặt lại mật khẩu thành công."));
    }

    [Authorize]
    [HttpPost("logout")]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<MessageResponse>> Logout(
        CancellationToken cancellationToken)
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub);
        var jti = User.FindFirstValue(JwtRegisteredClaimNames.Jti);
        var exp = User.FindFirstValue(JwtRegisteredClaimNames.Exp);

        if (!Guid.TryParse(sub, out var userId) ||
            string.IsNullOrWhiteSpace(jti) ||
            !long.TryParse(exp, NumberStyles.Integer, CultureInfo.InvariantCulture, out var expUnix))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Access token không hợp lệ.");
        }

        Request.Cookies.TryGetValue("refreshToken", out var refreshToken);
        await authService.LogoutAsync(
            userId,
            jti,
            DateTimeOffset.FromUnixTimeSeconds(expUnix).UtcDateTime,
            refreshToken,
            cancellationToken);
        DeleteRefreshCookie();
        return Ok(new MessageResponse("Đăng xuất thành công."));
    }

    private void SetRefreshCookie(string token, DateTime expiresAtUtc)
    {
        Response.Cookies.Append("refreshToken", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth",
            Expires = expiresAtUtc
        });
    }

    private void DeleteRefreshCookie()
    {
        Response.Cookies.Delete("refreshToken", new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Path = "/api/auth"
        });
    }
}

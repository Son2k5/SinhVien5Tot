using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.RateLimiting;
using SV5T.Api.Security;
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
using SV5T.Application.Common.Exceptions;

namespace SV5T.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(ISender sender) : ControllerBase
{
    private const string RefreshTokenCookieName = "refreshToken";
    private const string RefreshTokenCookiePath = "/api/auth";

    [HttpPost("register")]
    [EnableRateLimiting(AuthRateLimitPolicies.Register)]
    [ProducesResponseType<RegistrationStartedResponse>(StatusCodes.Status202Accepted)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<RegistrationStartedResponse>> Register(
        RegisterRequest request,
        CancellationToken cancellationToken)
    {
        var registrationId = await sender.Send(
            new RegisterCommand(request.Name, request.Email, request.Password),
            cancellationToken);
        return Accepted(new RegistrationStartedResponse(
            registrationId,
            "Nếu yêu cầu hợp lệ, OTP đã được gửi đến email của bạn."));
    }

    [HttpPost("verify-otp")]
    [EnableRateLimiting(AuthRateLimitPolicies.Otp)]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<MessageResponse>> VerifyOtp(
        VerifyOtpRequest request,
        CancellationToken cancellationToken)
    {
        await sender.Send(
            new VerifyOtpCommand(request.RegistrationId, request.Otp),
            cancellationToken);
        return Ok(new MessageResponse("Xác thực email thành công."));
    }

    [HttpPost("resend-otp")]
    [EnableRateLimiting(AuthRateLimitPolicies.Email)]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<MessageResponse>> ResendOtp(
        ResendOtpRequest request,
        CancellationToken cancellationToken)
    {
        await sender.Send(
            new ResendOtpCommand(request.RegistrationId),
            cancellationToken);
        return Ok(new MessageResponse("OTP mới đã được gửi."));
    }

    [HttpPost("login")]
    [EnableRateLimiting(AuthRateLimitPolicies.Login)]
    [ProducesResponseType<AuthTokenResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<AuthTokenResponse>> Login(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var tokens = await sender.Send(
            new LoginCommand(request, ipAddress),
            cancellationToken);
        SetRefreshCookie(
            tokens.RefreshToken,
            tokens.RefreshTokenExpiresAtUtc,
            tokens.IsPersistent);
        return Ok(new AuthTokenResponse(
            tokens.AccessToken, tokens.AccessTokenExpiresAtUtc));
    }

    [HttpPost("refresh")]
    [HttpPost("refresh-token")]
    [EnableRateLimiting(AuthRateLimitPolicies.Refresh)]
    [ProducesResponseType<AuthTokenResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<AuthTokenResponse>> Refresh(
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] RefreshRequest? body,
        CancellationToken cancellationToken)
    {
        string? refreshToken = null;
        if (Request.Cookies.TryGetValue(RefreshTokenCookieName, out var cookieToken) &&
            !string.IsNullOrWhiteSpace(cookieToken))
        {
            refreshToken = cookieToken;
        }
        else if (!string.IsNullOrWhiteSpace(body?.RefreshToken))
        {
            refreshToken = body.RefreshToken;
        }
        else if (Request.Headers.TryGetValue("X-Refresh-Token", out var headerToken) &&
                 !string.IsNullOrWhiteSpace(headerToken))
        {
            refreshToken = headerToken.ToString();
        }

        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
                "invalid_session");
        }

        AuthTokens tokens;
        try
        {
            tokens = await sender.Send(
                new RefreshTokenCommand(refreshToken),
                cancellationToken);
        }
        catch (UseCaseException exception)
            when (exception.Kind == ApplicationErrorKind.Unauthorized)
        {
            DeleteRefreshCookie();
            throw;
        }
        SetRefreshCookie(
            tokens.RefreshToken,
            tokens.RefreshTokenExpiresAtUtc,
            tokens.IsPersistent);
        return Ok(new AuthTokenResponse(
            tokens.AccessToken, tokens.AccessTokenExpiresAtUtc));
    }

    [HttpPost("forgot-password")]
    [EnableRateLimiting(AuthRateLimitPolicies.Email)]
    [ProducesResponseType<PasswordResetStartedResponse>(StatusCodes.Status202Accepted)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<PasswordResetStartedResponse>> ForgotPassword(
        ForgotPasswordRequest request,
        CancellationToken cancellationToken)
    {
        var resetId = await sender.Send(
            new ForgotPasswordCommand(request.Email),
            cancellationToken);
        return Accepted(new PasswordResetStartedResponse(
            resetId,
            "Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi."));
    }

    [HttpPost("verify-reset-otp")]
    [EnableRateLimiting(AuthRateLimitPolicies.Otp)]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<MessageResponse>> VerifyResetOtp(
        VerifyResetOtpRequest request,
        CancellationToken cancellationToken)
    {
        await sender.Send(
            new VerifyResetOtpCommand(request.ResetId, request.Otp),
            cancellationToken);
        return Ok(new MessageResponse("OTP hợp lệ. Bạn có thể tạo mật khẩu mới."));
    }

    [HttpPost("reset-password")]
    [EnableRateLimiting(AuthRateLimitPolicies.Otp)]
    [ProducesResponseType<MessageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<MessageResponse>> ResetPassword(
        ResetPasswordRequest request,
        CancellationToken cancellationToken)
    {
        await sender.Send(
            new ResetPasswordCommand(request.ResetId, request.Otp, request.NewPassword),
            cancellationToken);
        DeleteRefreshCookie();
        return Ok(new MessageResponse("Đặt lại mật khẩu thành công."));
    }

    [Authorize]
    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout(
        [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] RefreshRequest? body,
        CancellationToken cancellationToken)
    {
        var sub = User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(sub, out var userId))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Access token không hợp lệ.");
        }

        string? refreshToken = null;
        if (Request.Cookies.TryGetValue(RefreshTokenCookieName, out var cookieToken) &&
            !string.IsNullOrWhiteSpace(cookieToken))
        {
            refreshToken = cookieToken;
        }
        else if (!string.IsNullOrWhiteSpace(body?.RefreshToken))
        {
            refreshToken = body.RefreshToken;
        }
        else if (Request.Headers.TryGetValue("X-Refresh-Token", out var headerToken) &&
                 !string.IsNullOrWhiteSpace(headerToken))
        {
            refreshToken = headerToken.ToString();
        }

        await sender.Send(
            new LogoutCommand(userId, refreshToken),
            cancellationToken);
        DeleteRefreshCookie();
        return NoContent();
    }

    private void SetRefreshCookie(
        string token,
        DateTime expiresAtUtc,
        bool isPersistent)
    {
        Response.Cookies.Append(RefreshTokenCookieName, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Path = RefreshTokenCookiePath,
            Expires = isPersistent ? expiresAtUtc : null,
            IsEssential = true
        });
    }

    private void DeleteRefreshCookie()
    {
        Response.Cookies.Delete(RefreshTokenCookieName, new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Path = RefreshTokenCookiePath
        });
    }
}

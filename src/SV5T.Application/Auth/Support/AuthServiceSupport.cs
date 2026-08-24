using FluentValidation;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Models;
using SV5T.Domain.Auth.Enums;

namespace SV5T.Application.Auth.Support;

public static class AuthServiceSupport
{
    public static string NormalizeEmail(string email) =>
        email.Trim().ToLowerInvariant();

    public static void EnsureChallengeUsable(
        AuthChallengeData? challenge,
        AuthChallengePurpose purpose,
        DateTime nowUtc,
        bool allowExpired = false)
    {
        if (challenge is null ||
            challenge.Purpose != purpose ||
            challenge.FailedAttempts >= challenge.MaxAttempts ||
            (!allowExpired && challenge.ExpiresAtUtc <= nowUtc))
        {
            throw InvalidChallenge();
        }
    }

    public static UseCaseException InvalidChallenge() =>
        new(
            ApplicationErrorKind.Validation,
            "Mã xác thực không hợp lệ, đã hết hạn hoặc đã được sử dụng.",
            "invalid_challenge");

    public static UseCaseException InvalidSession() =>
        new(
            ApplicationErrorKind.Unauthorized,
            "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
            "invalid_session");

    public static UseCaseException IdleSessionExpired() =>
        new(
            ApplicationErrorKind.Unauthorized,
            "Phiên đăng nhập đã hết hạn do không hoạt động.",
            "idle_timeout");

    public static async Task ValidateAsync<T>(
        IValidator<T> validator,
        T value,
        CancellationToken cancellationToken)
    {
        var result = await validator.ValidateAsync(value, cancellationToken);
        if (!result.IsValid)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                string.Join(" ", result.Errors.Select(error => error.ErrorMessage)),
                "validation_error");
        }
    }
}

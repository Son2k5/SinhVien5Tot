using FluentValidation;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Models.Auth;
using SV5T.Domain.Enums;

namespace SV5T.Application.Services;

internal static class AuthServiceSupport
{
    internal static string NormalizeEmail(string email) =>
        email.Trim().ToLowerInvariant();

    internal static void EnsureChallengeUsable(
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

    internal static UseCaseException InvalidChallenge() =>
        new(
            ApplicationErrorKind.Validation,
            "Mã xác thực không hợp lệ, đã hết hạn hoặc đã được sử dụng.",
            "invalid_challenge");

    internal static UseCaseException InvalidSession() =>
        new(
            ApplicationErrorKind.Unauthorized,
            "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.",
            "invalid_session");

    internal static UseCaseException IdleSessionExpired() =>
        new(
            ApplicationErrorKind.Unauthorized,
            "Phiên đăng nhập đã hết hạn do không hoạt động trong 2 giờ.",
            "idle_timeout");

    internal static async Task ValidateAsync<T>(
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

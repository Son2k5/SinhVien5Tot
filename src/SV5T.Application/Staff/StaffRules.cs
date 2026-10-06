using System.Globalization;
using System.Text.RegularExpressions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Users;
using SV5T.Domain.Users.Enums;

namespace SV5T.Application.Staff;

public static partial class StaffRules
{
    public const string NotFoundMessage = "Không tìm thấy nhân sự.";
    public const string ConcurrencyMessage = "Dữ liệu đã được thay đổi, vui lòng tải lại.";

    public static bool IsManageable(Role role) => role == Role.Mentor;

    public static Guid EnsureAdmin(ICurrentUser currentUser)
    {
        if (!currentUser.IsAuthenticated || currentUser.UserId is not Guid actorUserId)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Không xác định được phiên đăng nhập.",
                "invalid_session");
        }

        if (!currentUser.IsInRole(nameof(Role.Admin)))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Forbidden,
                "Bạn không có quyền thực hiện thao tác này.",
                "forbidden");
        }

        return actorUserId;
    }

    public static void EnsureNotSelf(Guid actorUserId, Guid targetUserId)
    {
        if (actorUserId == targetUserId)
        {
            throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                NotFoundMessage,
                "staff_not_found");
        }
    }

    public static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    public static string NormalizeEmailKey(string email) => NormalizeEmail(email).ToUpperInvariant();

    public static string EscapeLike(string value) => value
        .Replace("\\", "\\\\", StringComparison.Ordinal)
        .Replace("%", "\\%", StringComparison.Ordinal)
        .Replace("_", "\\_", StringComparison.Ordinal);

    public static bool IsValidVietnamesePhone(string? phone) =>
        string.IsNullOrWhiteSpace(phone) || VietnamesePhoneRegex().IsMatch(phone.Trim());

    public static string EncodeRowVersion(DateTime? updatedAt, DateTime createdAt)
    {
        var value = NormalizeDatabaseTimestamp(updatedAt ?? createdAt);
        return value.ToString("O", CultureInfo.InvariantCulture);
    }

    public static void EnsureRowVersion(User user, string rowVersion)
    {
        if (!string.Equals(
                EncodeRowVersion(user.UpdatedAt, user.CreatedAt),
                rowVersion,
                StringComparison.Ordinal))
        {
            throw ConcurrencyConflict();
        }
    }

    public static DateTime NextUpdatedAt(DateTime? current)
    {
        var now = NormalizeDatabaseTimestamp(DateTime.UtcNow);
        var previous = current.HasValue ? NormalizeDatabaseTimestamp(current.Value) : DateTime.MinValue;
        return now > previous ? now : previous.AddTicks(10);
    }

    public static StaffResponse ToResponse(User user) => new(
        user.Id,
        user.DisplayName ?? string.Empty,
        user.Email,
        user.PhoneNumber,
        user.Role,
        user.IsActive,
        user.AvatarUrl,
        user.CreatedAt,
        EncodeRowVersion(user.UpdatedAt, user.CreatedAt));

    public static UseCaseException StaffNotFound() => new(
        ApplicationErrorKind.NotFound,
        NotFoundMessage,
        "staff_not_found");

    public static UseCaseException ConcurrencyConflict() => new(
        ApplicationErrorKind.Conflict,
        ConcurrencyMessage,
        "staff_concurrency_conflict");

    private static DateTime NormalizeDatabaseTimestamp(DateTime value)
    {
        var utc = value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
        };
        return new DateTime(utc.Ticks - utc.Ticks % 10, DateTimeKind.Utc);
    }

    [GeneratedRegex(@"^(0|\+84)\d{9,10}$", RegexOptions.CultureInvariant)]
    private static partial Regex VietnamesePhoneRegex();
}

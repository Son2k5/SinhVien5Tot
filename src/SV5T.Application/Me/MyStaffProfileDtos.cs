using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Users;
using SV5T.Domain.Users.Enums;

namespace SV5T.Application.Me;

public sealed record MyStaffProfileResponse(
    Guid Id,
    string Email,
    string FullName,
    string? Phone,
    Role Role,
    string? AvatarUrl,
    DateTime CreatedAt,
    string RowVersion);

public sealed record UpdateMyStaffProfileRequest(
    string FullName,
    string? Phone,
    string RowVersion);

public sealed record MyStaffAvatarResponse(string? AvatarUrl);

public static class MyStaffProfileVersion
{
    public static string Encode(DateTime? updatedAt)
    {
        var ticks = updatedAt?.Ticks ?? 0L;
        return Convert.ToBase64String(BitConverter.GetBytes(ticks));
    }

    public static bool TryDecode(string? value, out DateTime? updatedAt)
    {
        updatedAt = null;
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        try
        {
            var bytes = Convert.FromBase64String(value);
            if (bytes.Length != sizeof(long))
            {
                return false;
            }

            var ticks = BitConverter.ToInt64(bytes);
            if (ticks == 0)
            {
                return true;
            }

            if (ticks < DateTime.MinValue.Ticks || ticks > DateTime.MaxValue.Ticks)
            {
                return false;
            }

            updatedAt = new DateTime(ticks, DateTimeKind.Utc);
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }

    public static bool Matches(DateTime? current, DateTime? expected) =>
        current?.Ticks == expected?.Ticks;

    public static DateTime UtcNowForDatabase()
    {
        var now = DateTime.UtcNow;
        return new DateTime(now.Ticks - now.Ticks % 10, DateTimeKind.Utc);
    }
}

internal static class MyStaffProfileSupport
{
    internal static Guid RequireStaffUserId(ICurrentUser currentUser)
    {
        if (!currentUser.UserId.HasValue)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phiên đăng nhập không hợp lệ.",
                "invalid_session");
        }

        if (!currentUser.IsInRole(nameof(Role.Admin)) &&
            !currentUser.IsInRole(nameof(Role.Mentor)))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Forbidden,
                "Bạn không có quyền truy cập hồ sơ nhân sự.",
                "staff_profile_access_denied");
        }

        return currentUser.UserId.Value;
    }

    internal static MyStaffProfileResponse ToResponse(User user) =>
        new(
            user.Id,
            user.Email,
            user.DisplayName ?? string.Empty,
            user.PhoneNumber,
            user.Role,
            user.AvatarUrl,
            user.CreatedAt,
            MyStaffProfileVersion.Encode(user.UpdatedAt));
}

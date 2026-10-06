using SV5T.Domain.Users.Enums;

namespace SV5T.Application.Staff;

public enum StaffStatus
{
    Active,
    Locked
}

public sealed record StaffResponse(
    Guid Id,
    string FullName,
    string Email,
    string? Phone,
    Role Role,
    bool IsActive,
    string? AvatarUrl,
    DateTime CreatedAt,
    string RowVersion);

public sealed record CreateStaffResponse(
    StaffResponse Staff,
    bool InvitationSent);

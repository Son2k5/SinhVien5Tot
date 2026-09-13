using SV5T.Domain.Users.Enums;

namespace SV5T.Application.Users.Dtos;

public sealed record UserSummaryResponse(
    Guid Id,
    string Email,
    string? DisplayName,
    Role Role,
    string? AvatarUrl,
    bool IsVerified,
    bool IsActive,
    int SecurityVersion,
    DateTime CreatedAt,
    DateTime? UpdatedAt,
    string? ProfileFullName,
    string? ProfileFaculty);

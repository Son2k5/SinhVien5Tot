using SV5T.Domain.Enums;

namespace SV5T.Application.DTOs.Users;

public sealed record UserDto(
    Guid Id,
    string Email,
    Role Role,
    string? AvatarUrl,
    bool IsVerified,
    bool IsActive);

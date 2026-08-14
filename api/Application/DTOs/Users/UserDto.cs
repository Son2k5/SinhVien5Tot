using SV5T.Domain.Enums;

namespace SV5T.Application.DTOs.Users;

public sealed record UserDto(
    Guid Id,
    string Email,
    string DisplayName,
    Role Role,
    string? AvatarUrl);

using SV5T.Application.DTOs.Users;

namespace SV5T.Application.Interfaces.Services.Users;

public interface IUserService
{
    Task<UserDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserProfileDto?> GetMyProfileAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
    Task<UserProfileDto> UpdateMyProfileAsync(
        Guid userId,
        UpdateUserProfileRequest request,
        CancellationToken cancellationToken = default);
    Task<UserDto> UpdateMyAvatarAsync(
        Guid userId,
        UpdateUserAvatarRequest request,
        CancellationToken cancellationToken = default);
}

using SV5T.Application.DTOs.Users;
using SV5T.Application.Interfaces.Repositories;
using SV5T.Application.Interfaces.Services.Users;

namespace SV5T.Application.Services;

public sealed class UserService(IUserRepository userRepository) : IUserService
{
    public async Task<UserDto?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var user = await userRepository.GetByIdAsync(id, cancellationToken);

        return user is null
            ? null
            : new UserDto(
                user.Id,
                user.Email,
                user.Role,
                user.AvatarUrl,
                user.IsVerified,
                user.IsActive);
    }
}

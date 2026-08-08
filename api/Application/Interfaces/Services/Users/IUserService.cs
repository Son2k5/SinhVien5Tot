using SV5T.Application.DTOs.Users;

namespace SV5T.Application.Interfaces.Services.Users;

public interface IUserService
{
    Task<UserDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
}

using SV5T.Application.Users.Dtos;
using SV5T.Domain.Users;

namespace SV5T.Application.Users.Abstractions;

public interface IUserRepository
{
    Task<User?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserSummaryResponse?> GetSummaryByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<User?> GetByNormalizedEmailAsync(
        string normalizedEmail,
        bool tracking = false,
        CancellationToken cancellationToken = default);
    Task<User?> GetByIdWithProfileAsync(
        Guid id,
        bool tracking = false,
        CancellationToken cancellationToken = default);
    Task<bool> ExistsStudentCodeAsync(
        string studentCode,
        Guid excludeUserId,
        CancellationToken cancellationToken = default);
    Task AddProfileAsync(
        UserProfile profile,
        CancellationToken cancellationToken = default);
    Task AddAddressAsync(
        UserAddress address,
        CancellationToken cancellationToken = default);
    Task AddAsync(User user, CancellationToken cancellationToken = default);
    Task<int> DeleteUnverifiedBeforeAsync(DateTime cutoffUtc, CancellationToken cancellationToken = default);
}

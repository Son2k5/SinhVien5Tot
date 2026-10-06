using SV5T.Application.Users.Dtos;
using SV5T.Application.Me;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Staff;
using SV5T.Domain.Users;
using SV5T.Domain.Users.Enums;

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
    Task<MyStaffProfileResponse?> GetMyStaffProfileAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException();
    Task<User?> GetStaffUserForUpdateAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException();
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
    Task<PagedResponse<StaffResponse>> GetStaffPagedAsync(
        Role? role,
        StaffStatus? status,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException();
    Task<StaffResponse?> GetStaffResponseAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException();
    Task<User?> GetManageableStaffForUpdateAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException();
    Task<bool> StaffEmailExistsAsync(
        string normalizedEmail,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException();
    Task<bool> HasStaffWorkHistoryAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        throw new NotSupportedException();
    void Remove(User user) => throw new NotSupportedException();
    Task<int> DeleteUnverifiedBeforeAsync(DateTime cutoffUtc, CancellationToken cancellationToken = default);
}

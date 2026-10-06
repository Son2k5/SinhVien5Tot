using Microsoft.EntityFrameworkCore;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Staff;
using SV5T.Application.Users.Abstractions;
using SV5T.Application.Users.Dtos;
using SV5T.Application.Me;
using SV5T.Domain.Users;
using SV5T.Domain.Users.Enums;
using SV5T.Infrastructure.Persistence.Context;

namespace SV5T.Infrastructure.Persistence.Repositories.Users;

public sealed class UserRepository(ApplicationDbContext dbContext) : IUserRepository
{
    public Task<User?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Id == id, cancellationToken);

    public Task<UserSummaryResponse?> GetSummaryByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return dbContext.Users
            .AsNoTracking()
            .Where(user => user.Id == id)
            .Select(user => new UserSummaryResponse(
                user.Id,
                user.Email,
                user.DisplayName,
                user.Role,
                user.AvatarUrl,
                user.IsVerified,
                user.IsActive,
                user.SecurityVersion,
                user.CreatedAt,
                user.UpdatedAt,
                user.Profile == null ? null : user.Profile.FullName,
                user.Profile == null ? null : user.Profile.Faculty))
            .FirstOrDefaultAsync(cancellationToken);
    }

    public Task<User?> GetByNormalizedEmailAsync(
        string normalizedEmail,
        bool tracking = false,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Users.AsQueryable();
        if (!tracking)
        {
            query = query.AsNoTracking();
        }
        return query.FirstOrDefaultAsync(
            user => user.NormalizedEmail == normalizedEmail,
            cancellationToken);
    }

    public Task<User?> GetByIdWithProfileAsync(
        Guid id,
        bool tracking = false,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Users
            .Include(user => user.Profile)
            .Include(user => user.Addresses)
            .AsQueryable();
        if (!tracking)
        {
            query = query.AsNoTracking();
        }

        return query.FirstOrDefaultAsync(user => user.Id == id, cancellationToken);
    }

    public Task<MyStaffProfileResponse?> GetMyStaffProfileAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        dbContext.Users
            .AsNoTracking()
            .Where(user =>
                user.Id == id &&
                user.IsActive &&
                user.IsVerified &&
                !user.IsDeleted &&
                (user.Role == Role.Admin || user.Role == Role.Mentor))
            .Select(user => new MyStaffProfileResponse(
                user.Id,
                user.Email,
                user.DisplayName ?? string.Empty,
                user.PhoneNumber,
                user.Role,
                user.AvatarUrl,
                user.CreatedAt,
                MyStaffProfileVersion.Encode(user.UpdatedAt)))
            .FirstOrDefaultAsync(cancellationToken);

    public Task<User?> GetStaffUserForUpdateAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        dbContext.Users.FirstOrDefaultAsync(
            user =>
                user.Id == id &&
                user.IsActive &&
                user.IsVerified &&
                !user.IsDeleted &&
                (user.Role == Role.Admin || user.Role == Role.Mentor),
            cancellationToken);

    public Task<bool> ExistsStudentCodeAsync(
        string studentCode,
        Guid excludeUserId,
        CancellationToken cancellationToken = default) =>
        dbContext.UserProfiles
            .AsNoTracking()
            .AnyAsync(
                profile => profile.StudentCode == studentCode &&
                           profile.UserId != excludeUserId,
                cancellationToken);

    public Task AddProfileAsync(
        UserProfile profile,
        CancellationToken cancellationToken = default) =>
        dbContext.UserProfiles.AddAsync(profile, cancellationToken).AsTask();

    public Task AddAddressAsync(
        UserAddress address,
        CancellationToken cancellationToken = default) =>
        dbContext.UserAddresses.AddAsync(address, cancellationToken).AsTask();

    public Task AddAsync(
        User user,
        CancellationToken cancellationToken = default)
    {
        return dbContext.Users.AddAsync(user, cancellationToken).AsTask();
    }

    public async Task<PagedResponse<StaffResponse>> GetStaffPagedAsync(
        Role? role,
        StaffStatus? status,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Users
            .AsNoTracking()
            .Where(user => user.Role == Role.Mentor && !user.IsDeleted);

        if (role.HasValue)
        {
            query = query.Where(user => user.Role == role.Value);
        }
        if (status.HasValue)
        {
            var isActive = status.Value == StaffStatus.Active;
            query = query.Where(user => user.IsActive == isActive);
        }
        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{StaffRules.EscapeLike(search)}%";
            query = query.Where(user =>
                EF.Functions.Like(user.DisplayName ?? string.Empty, pattern, "\\") ||
                EF.Functions.Like(user.Email, pattern, "\\"));
        }

        var totalCount = await query.CountAsync(cancellationToken);
        var rows = await query
            .OrderBy(user => user.DisplayName)
            .ThenBy(user => user.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(user => new
            {
                user.Id,
                FullName = user.DisplayName ?? string.Empty,
                user.Email,
                Phone = user.PhoneNumber,
                user.Role,
                user.IsActive,
                user.AvatarUrl,
                user.CreatedAt,
                user.UpdatedAt
            })
            .ToListAsync(cancellationToken);
        var items = rows
            .Select(row => new StaffResponse(
                row.Id,
                row.FullName,
                row.Email,
                row.Phone,
                row.Role,
                row.IsActive,
                row.AvatarUrl,
                row.CreatedAt,
                StaffRules.EncodeRowVersion(row.UpdatedAt, row.CreatedAt)))
            .ToArray();

        return new PagedResponse<StaffResponse>(
            items,
            totalCount,
            page,
            pageSize,
            (int)Math.Ceiling(totalCount / (double)pageSize));
    }

    public async Task<StaffResponse?> GetStaffResponseAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var row = await dbContext.Users
            .AsNoTracking()
            .Where(user =>
                user.Id == id &&
                user.Role == Role.Mentor &&
                !user.IsDeleted)
            .Select(user => new
            {
                user.Id,
                FullName = user.DisplayName ?? string.Empty,
                user.Email,
                Phone = user.PhoneNumber,
                user.Role,
                user.IsActive,
                user.AvatarUrl,
                user.CreatedAt,
                user.UpdatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);
        return row is null
            ? null
            : new StaffResponse(
                row.Id,
                row.FullName,
                row.Email,
                row.Phone,
                row.Role,
                row.IsActive,
                row.AvatarUrl,
                row.CreatedAt,
                StaffRules.EncodeRowVersion(row.UpdatedAt, row.CreatedAt));
    }

    public Task<User?> GetManageableStaffForUpdateAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        dbContext.Users.FirstOrDefaultAsync(
            user =>
                user.Id == id &&
                user.Role == Role.Mentor &&
                !user.IsDeleted,
            cancellationToken);

    public Task<bool> StaffEmailExistsAsync(
        string normalizedEmail,
        CancellationToken cancellationToken = default) =>
        dbContext.Users
            .AsNoTracking()
            .AnyAsync(user => user.NormalizedEmail == normalizedEmail, cancellationToken);

    public async Task<bool> HasStaffWorkHistoryAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var actor = id.ToString("D");
        return await dbContext.Applications.AsNoTracking().AnyAsync(
                   item => item.ApplicantUserId == id || item.AssignedReviewerId == id,
                   cancellationToken) ||
               await dbContext.Evidences.AsNoTracking().AnyAsync(
                   item => item.ReviewedBy == id || item.CreatedBy == actor || item.UpdatedBy == actor,
                   cancellationToken) ||
               await dbContext.ReviewLogs.AsNoTracking().AnyAsync(
                   item => item.ActorId == id,
                   cancellationToken) ||
               await dbContext.Articles.AsNoTracking().AnyAsync(
                   item => item.AuthorUserId == id,
                   cancellationToken) ||
               await dbContext.ArticleImages.AsNoTracking().AnyAsync(
                   item => item.UploadedByUserId == id,
                   cancellationToken) ||
               await dbContext.ConversationParticipants.AsNoTracking().AnyAsync(
                   item => item.UserId == id,
                   cancellationToken) ||
               await dbContext.Messages.AsNoTracking().AnyAsync(
                   item => item.SenderUserId == id,
                   cancellationToken) ||
               await dbContext.ChatBlocks.AsNoTracking().AnyAsync(
                   item => item.BlockerUserId == id || item.BlockedUserId == id,
                   cancellationToken) ||
               await dbContext.AdminAuditLogs.AsNoTracking().AnyAsync(
                   item => item.ActorId == id,
                   cancellationToken) ||
               await dbContext.Campaigns.AsNoTracking().AnyAsync(
                   item => item.CreatedBy == actor || item.UpdatedBy == actor,
                   cancellationToken) ||
               await dbContext.StandardSets.AsNoTracking().AnyAsync(
                   item => item.CreatedBy == actor || item.UpdatedBy == actor,
                   cancellationToken) ||
               await dbContext.Standards.AsNoTracking().AnyAsync(
                   item => item.CreatedBy == actor || item.UpdatedBy == actor,
                   cancellationToken) ||
               await dbContext.Criteria.AsNoTracking().AnyAsync(
                   item => item.CreatedBy == actor || item.UpdatedBy == actor,
                   cancellationToken) ||
               await dbContext.Applications.AsNoTracking().AnyAsync(
                   item => item.CreatedBy == actor || item.UpdatedBy == actor,
                   cancellationToken) ||
               await dbContext.Users.AsNoTracking().AnyAsync(
                   item => item.Id != id &&
                       (item.DeletedBy == id || item.CreatedBy == actor || item.UpdatedBy == actor),
                   cancellationToken);
    }

    public void Remove(User user) => dbContext.Users.Remove(user);

    public Task<int> DeleteUnverifiedBeforeAsync(
        DateTime cutoffUtc,
        CancellationToken cancellationToken = default) =>
        dbContext.Users
            .Where(user => !user.IsVerified && user.CreatedAt <= cutoffUtc)
            .ExecuteDeleteAsync(cancellationToken);
}

using Microsoft.EntityFrameworkCore;
using SV5T.Application.Interfaces.Repositories;
using SV5T.Domain.Entities;
using SV5T.Infrastructure.Persistence;

namespace SV5T.Infrastructure.Repositories;

public sealed class UserRepository(ApplicationDbContext dbContext) : IUserRepository
{
    public Task<User?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return dbContext.Users
            .AsNoTracking()
            .Where(user => user.Id == id)
            .Select(user => new User
            {
                Id = user.Id,
                Email = user.Email,
                NormalizedEmail = user.NormalizedEmail,
                DisplayName = user.DisplayName,
                Role = user.Role,
                AvatarUrl = user.AvatarUrl,
                IsVerified = user.IsVerified,
                IsActive = user.IsActive,
                SecurityVersion = user.SecurityVersion,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                Profile = user.Profile == null
                    ? null
                    : new UserProfile
                    {
                        Id = user.Profile.Id,
                        UserId = user.Profile.UserId,
                        FullName = user.Profile.FullName,
                        Faculty = user.Profile.Faculty
                    }
            })
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

    public Task AddAsync(
        User user,
        CancellationToken cancellationToken = default)
    {
        return dbContext.Users.AddAsync(user, cancellationToken).AsTask();
    }
}

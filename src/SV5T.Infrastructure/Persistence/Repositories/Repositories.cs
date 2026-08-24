using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SV5T.Domain.Auth;
using SV5T.Domain.Users;
using SV5T.Domain.Welcome;
using SV5T.Infrastructure.Options;
using SV5T.Infrastructure.Persistence.Context;

namespace SV5T.Infrastructure.Persistence.Repositories;

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

    public Task<int> DeleteUnverifiedBeforeAsync(
        DateTime cutoffUtc,
        CancellationToken cancellationToken = default) =>
        dbContext.Users
            .Where(user => !user.IsVerified && user.CreatedAt <= cutoffUtc)
            .ExecuteDeleteAsync(cancellationToken);
}

public sealed class RefreshTokenRepository(
    ApplicationDbContext dbContext,
    IOptions<JwtOptions> jwtOptions)
    : IRefreshTokenRepository
{
    public Task<RefreshToken?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        dbContext.RefreshTokens
            .SingleOrDefaultAsync(token => token.Id == id, cancellationToken);

    public Task AddAsync(
        RefreshToken refreshToken,
        CancellationToken cancellationToken = default) =>
        dbContext.RefreshTokens.AddAsync(refreshToken, cancellationToken).AsTask();

    public Task<int> TryRevokeActiveAsync(
        Guid id,
        Guid userId,
        string token,
        DateTime revokedAtUtc,
        Guid? replacedByTokenId = null,
        CancellationToken cancellationToken = default) =>
        dbContext.RefreshTokens
            .Where(refreshToken =>
                refreshToken.Id == id &&
                refreshToken.UserId == userId &&
                refreshToken.Token == token &&
                !refreshToken.IsRevoked)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(refreshToken => refreshToken.IsRevoked, true)
                    .SetProperty(refreshToken => refreshToken.RevokedAtUtc, revokedAtUtc)
                    .SetProperty(
                        refreshToken => refreshToken.ReplacedByTokenId,
                        replacedByTokenId),
                cancellationToken);

    public Task<int> RevokeAllActiveAsync(
        Guid userId,
        DateTime revokedAtUtc,
        CancellationToken cancellationToken = default) =>
        dbContext.RefreshTokens
            .Where(token => token.UserId == userId && !token.IsRevoked)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(token => token.IsRevoked, true)
                    .SetProperty(token => token.RevokedAtUtc, revokedAtUtc),
                cancellationToken);

    public Task<int> RevokeFamilyAsync(
        Guid familyId,
        Guid userId,
        DateTime revokedAtUtc,
        CancellationToken cancellationToken = default) =>
        dbContext.RefreshTokens
            .Where(token =>
                token.FamilyId == familyId &&
                token.UserId == userId &&
                !token.IsRevoked)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(token => token.IsRevoked, true)
                    .SetProperty(token => token.RevokedAtUtc, revokedAtUtc),
                cancellationToken);

    public async Task<int> RevokeExcessActiveAsync(
        Guid userId,
        DateTime revokedAtUtc,
        CancellationToken cancellationToken = default)
    {
        var excessFamilyIds = await dbContext.RefreshTokens
            .Where(token => token.UserId == userId && !token.IsRevoked)
            .OrderByDescending(token => token.CreatedAtUtc)
            .ThenByDescending(token => token.Id)
            .Skip(jwtOptions.Value.MaxConcurrentSessions)
            .Select(token => token.FamilyId)
            .Distinct()
            .ToArrayAsync(cancellationToken);

        if (excessFamilyIds.Length == 0)
        {
            return 0;
        }

        return await dbContext.RefreshTokens
            .Where(token =>
                excessFamilyIds.Contains(token.FamilyId) &&
                !token.IsRevoked)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(token => token.IsRevoked, true)
                    .SetProperty(token => token.RevokedAtUtc, revokedAtUtc),
                cancellationToken);
    }

    public async Task<int> DeleteStaleAsync(
        DateTime retentionCutoffUtc,
        CancellationToken cancellationToken = default)
    {
        var expired = await dbContext.RefreshTokens
            .Where(token => token.ExpiresAtUtc <= retentionCutoffUtc)
            .ExecuteDeleteAsync(cancellationToken);
        var revoked = await dbContext.RefreshTokens
            .Where(token =>
                token.IsRevoked &&
                token.RevokedAtUtc <= retentionCutoffUtc)
            .ExecuteDeleteAsync(cancellationToken);
        return expired + revoked;
    }
}

public sealed class PortalContentRepository(ApplicationDbContext dbContext)
    : IPortalContentRepository
{
    public async Task<IReadOnlyList<PortalContent>> GetPublishedAsync(
        DateTime nowUtc,
        int limit,
        CancellationToken cancellationToken = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 50);
        return await dbContext.PortalContents
            .AsNoTracking()
            .Where(content =>
                content.IsPublished &&
                content.PublishedAtUtc <= nowUtc &&
                (!content.ExpiresAtUtc.HasValue || content.ExpiresAtUtc > nowUtc))
            .OrderByDescending(content => content.IsFeatured)
            .ThenByDescending(content => content.PublishedAtUtc)
            .Take(safeLimit)
            .ToListAsync(cancellationToken);
    }
}


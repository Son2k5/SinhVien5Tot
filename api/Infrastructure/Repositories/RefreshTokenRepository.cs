using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using SV5T.Application.Interfaces.Repositories;
using SV5T.Domain.Entities;
using SV5T.Infrastructure.Options.Authentication;
using SV5T.Infrastructure.Persistence;

namespace SV5T.Infrastructure.Repositories;

public sealed class RefreshTokenRepository(
    ApplicationDbContext dbContext,
    IOptions<JwtOptions> jwtOptions)
    : IRefreshTokenRepository
{
    public Task<RefreshToken?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default) =>
        dbContext.RefreshTokens.AsNoTracking().FirstOrDefaultAsync(
            token => token.Id == id,
            cancellationToken);

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

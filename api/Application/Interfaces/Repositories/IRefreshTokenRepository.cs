using SV5T.Domain.Entities;

namespace SV5T.Application.Interfaces.Repositories;

public interface IRefreshTokenRepository
{
    Task<RefreshToken?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task AddAsync(
        RefreshToken refreshToken,
        CancellationToken cancellationToken = default);

    Task<int> TryRevokeActiveAsync(
        Guid id,
        Guid userId,
        string token,
        DateTime revokedAtUtc,
        CancellationToken cancellationToken = default);

    Task<int> RevokeAllActiveAsync(
        Guid userId,
        DateTime revokedAtUtc,
        CancellationToken cancellationToken = default);

    Task<int> RevokeExcessActiveAsync(
        Guid userId,
        DateTime revokedAtUtc,
        CancellationToken cancellationToken = default);

    Task<int> DeleteStaleAsync(
        DateTime retentionCutoffUtc,
        CancellationToken cancellationToken = default);
}

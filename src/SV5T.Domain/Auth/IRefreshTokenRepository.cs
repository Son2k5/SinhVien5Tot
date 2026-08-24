namespace SV5T.Domain.Auth;

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
        Guid? replacedByTokenId = null,
        CancellationToken cancellationToken = default);

    Task<int> RevokeAllActiveAsync(
        Guid userId,
        DateTime revokedAtUtc,
        CancellationToken cancellationToken = default);

    Task<int> RevokeFamilyAsync(
        Guid familyId,
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

namespace SV5T.Domain.Awards;

public interface IAwardRepository
{
    Task<Award?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Award>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(Award award, CancellationToken cancellationToken = default);
}

namespace SV5T.Domain.Criteria;

public interface ICriterionRepository
{
    Task<Criterion?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Criterion>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(Criterion criterion, CancellationToken cancellationToken = default);
}

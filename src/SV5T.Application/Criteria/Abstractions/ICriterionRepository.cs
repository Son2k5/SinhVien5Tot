using SV5T.Domain.Criteria;

namespace SV5T.Application.Criteria.Abstractions;

public interface ICriterionRepository
{
    Task<Criterion?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<Criterion>> GetAllAsync(CancellationToken cancellationToken = default);
    Task AddAsync(Criterion criterion, CancellationToken cancellationToken = default);
}

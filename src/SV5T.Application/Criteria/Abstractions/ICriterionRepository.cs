using SV5T.Domain.Criteria;

namespace SV5T.Application.Criteria.Abstractions;

public interface ICriterionRepository
{
    Task<Criterion?> GetByIdAsync(
        Guid id,
        bool tracking = false,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Criterion>> GetByStandardIdAsync(
        Guid standardId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Criterion>> GetByStandardSetIdAsync(
        Guid standardSetId,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsCodeInStandardAsync(
        Guid standardId,
        string code,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default);

    Task AddAsync(Criterion criterion, CancellationToken cancellationToken = default);
    Task UpdateAsync(Criterion criterion, CancellationToken cancellationToken = default);
    Task RemoveAsync(Criterion criterion, CancellationToken cancellationToken = default);
    Task RemoveRangeAsync(IEnumerable<Criterion> criteria, CancellationToken cancellationToken = default);
}

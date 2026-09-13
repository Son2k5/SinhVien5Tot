using SV5T.Domain.Standards;

namespace SV5T.Application.Standards.Abstractions;

public interface IStandardRepository
{
    Task<Standard?> GetByIdAsync(
        Guid id,
        bool includeCriteria = false,
        bool tracking = false,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Standard>> GetByStandardSetIdAsync(
        Guid standardSetId,
        bool includeCriteria = false,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsCodeInStandardSetAsync(
        Guid standardSetId,
        string code,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default);

    Task AddAsync(Standard standard, CancellationToken cancellationToken = default);
    Task UpdateAsync(Standard standard, CancellationToken cancellationToken = default);
    Task RemoveAsync(Standard standard, CancellationToken cancellationToken = default);
    Task RemoveRangeAsync(IEnumerable<Standard> standards, CancellationToken cancellationToken = default);
}

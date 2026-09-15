using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Standards;

namespace SV5T.Application.Standards.Abstractions;

public interface IStandardSetRepository
{
    Task<StandardSet?> GetByIdAsync(
        Guid id,
        bool includeStandards = false,
        bool includeCriteria = false,
        bool tracking = false,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StandardSet>> GetAllAsync(
        CancellationToken cancellationToken = default);

    Task<bool> ExistsByNameAsync(
        string name,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default);

    [Obsolete("Composite (AcademicYear, Level, AwardType, Version) is no longer unique. Use ExistsByNameAsync instead.")]
    Task<bool> ExistsByAcademicYearAndLevelAsync(
        string academicYear,
        AwardLevel level,
        AwardType awardType,
        int version,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default);

    Task AddAsync(StandardSet standardSet, CancellationToken cancellationToken = default);
    Task UpdateAsync(StandardSet standardSet, CancellationToken cancellationToken = default);
    Task RemoveAsync(StandardSet standardSet, CancellationToken cancellationToken = default);
}

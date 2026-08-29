using SV5T.Application.Common.Models;
using SV5T.Domain.Evidences;
using SV5T.Domain.Submissions;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Evidences.Abstractions;

public interface IEvidenceRepository
{
    Task<Evidence?> GetByIdAsync(
        Guid id,
        bool tracking = false,
        CancellationToken cancellationToken = default);

    Task<PagedResult<Evidence>> GetPagedAsync(
        Guid? campaignId,
        EvidenceStatus? status,
        Guid? applicationId,
        int pageIndex,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task UpdateAsync(Evidence evidence, CancellationToken cancellationToken = default);
    Task AddReviewLogAsync(ReviewLog reviewLog, CancellationToken cancellationToken = default);
}

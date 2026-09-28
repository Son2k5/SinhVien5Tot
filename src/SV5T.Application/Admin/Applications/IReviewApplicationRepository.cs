using SV5T.Application.Common.Models;
using SV5T.Domain.Submissions.Enums;
using SubmissionApplication = SV5T.Domain.Submissions.Application;

namespace SV5T.Application.Admin.Applications;

public interface IReviewApplicationRepository
{
    Task<PagedResult<SubmissionApplication>> GetSubmittedPagedAsync(Guid? campaignId,
        SubmissionStatus? status, int pageIndex, int pageSize, CancellationToken ct);
    Task<SubmissionApplication?> GetByIdAsync(Guid id, bool tracking, CancellationToken ct);
    Task AddReviewLogAsync(SV5T.Domain.Submissions.ReviewLog log, CancellationToken ct);
}

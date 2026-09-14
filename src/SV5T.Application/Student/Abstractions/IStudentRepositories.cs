using SV5T.Application.Common.Models;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Criteria;
using SV5T.Domain.Evidences;
using SV5T.Domain.Standards;
using SubmissionApplication = SV5T.Domain.Submissions.Application;
using SV5T.Domain.Submissions;

namespace SV5T.Application.Student.Abstractions;

public interface IStudentApplicationRepository
{
    Task<SubmissionApplication?> GetByIdAsync(
        Guid id,
        bool tracking = false,
        CancellationToken cancellationToken = default);

    Task<SubmissionApplication?> GetByIdForUserAsync(
        Guid id,
        Guid userId,
        bool tracking = false,
        CancellationToken cancellationToken = default);

    Task<SubmissionApplication?> GetByCampaignAndUserAsync(
        Guid campaignId,
        Guid userId,
        bool tracking = false,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<SubmissionApplication>> GetByUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<PagedResult<SubmissionApplication>> GetPagedByUserAsync(
        Guid userId,
        int pageIndex,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task AddAsync(SubmissionApplication application, CancellationToken cancellationToken = default);

    Task AddReviewLogAsync(ReviewLog reviewLog, CancellationToken cancellationToken = default);
}

public interface IStudentCampaignRepository
{
    Task<Campaign?> GetByIdAsync(
        Guid id,
        bool includeDetails = false,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Campaign>> GetOpenAsync(CancellationToken cancellationToken = default);

    Task<PagedResult<Campaign>> GetOpenPagedAsync(
        int pageIndex,
        int pageSize,
        CancellationToken cancellationToken = default);
}

public interface IStudentCriterionRepository
{
    Task<Criterion?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Criterion>> GetRequirementsByStandardSetIdAsync(
        Guid standardSetId,
        CancellationToken cancellationToken = default);
}

public interface IStudentEvidenceRepository
{
    Task<Evidence?> GetByIdAsync(
        Guid id,
        bool tracking = false,
        CancellationToken cancellationToken = default);

    Task<Evidence?> GetByIdForUserAsync(
        Guid id,
        Guid userId,
        bool tracking = false,
        CancellationToken cancellationToken = default);

    Task<Evidence?> GetByApplicationAndCriterionAsync(
        Guid applicationId,
        Guid criterionId,
        bool tracking = false,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Evidence>> GetByApplicationAsync(
        Guid applicationId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Evidence>> GetByApplicationForUserAsync(
        Guid applicationId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task AddAsync(Evidence evidence, CancellationToken cancellationToken = default);
}

public interface IStudentStandardSetRepository
{
    Task<StandardSet?> GetByIdWithCriteriaAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}

public sealed record StoredEvidenceFile(
    string Url,
    string PublicId,
    string ResourceType,
    long Bytes,
    string OriginalFileName);

public interface IEvidenceFileStorage
{
    Task<StoredEvidenceFile> UploadAsync(
        Guid userId,
        Guid applicationId,
        Stream content,
        string fileName,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        string publicId,
        string resourceType,
        CancellationToken cancellationToken = default);
}

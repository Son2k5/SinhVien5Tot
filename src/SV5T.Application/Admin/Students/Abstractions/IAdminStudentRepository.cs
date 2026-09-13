using SV5T.Application.Common.Models;
using SV5T.Domain.Evidences;
using SV5T.Domain.Submissions;
using SV5T.Domain.Users;
using SubmissionApplication = SV5T.Domain.Submissions.Application;

namespace SV5T.Application.Admin.Students.Abstractions;

public sealed record AdminStudentFilter(
    string? Search,
    string? Faculty,
    string? Major,
    string? AdministrativeClass,
    int? AcademicYear,
    string? School,
    string? SchoolYear,
    bool? IsActive,
    bool? IsVerified,
    bool IncludeDeleted,
    string? SortBy,
    string? SortDir,
    int PageIndex,
    int PageSize
);

public interface IAdminStudentRepository
{
    Task<PagedResult<User>> GetPagedAsync(AdminStudentFilter filter, CancellationToken cancellationToken = default);

    Task<User?> GetByIdAsync(
        Guid id,
        bool tracking = false,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default
    );

    Task<IReadOnlyList<User>> GetByIdsAsync(
        IEnumerable<Guid> ids,
        bool tracking = false,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default
    );

    Task<IReadOnlyList<SubmissionApplication>> GetApplicationsAsync(
        Guid studentId,
        CancellationToken cancellationToken = default
    );

    Task<IReadOnlyList<Evidence>> GetEvidencesAsync(Guid studentId, CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ReviewLog>> GetReviewLogsAsync(Guid studentId, CancellationToken cancellationToken = default);

    Task<Evidence?> GetEvidenceForStudentAsync(
        Guid studentId,
        Guid evidenceId,
        bool tracking = false,
        CancellationToken cancellationToken = default
    );

    Task AddReviewLogAsync(ReviewLog reviewLog, CancellationToken cancellationToken = default);
}

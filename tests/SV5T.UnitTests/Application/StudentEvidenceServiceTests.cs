using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Student.Abstractions;
using SV5T.Application.Student.Dtos;
using SV5T.Application.Student.Evidences.Commands.UpsertEvidence;
using SV5T.Domain.Criteria;
using SV5T.Domain.Evidences;
using SV5T.Domain.Standards;
using SV5T.Domain.Standards.Enums;
using SV5T.Domain.Submissions;
using SV5T.Domain.Submissions.Enums;
using Xunit;

namespace SV5T.UnitTests.Application;

public sealed class StudentEvidenceServiceTests
{
    private readonly FakeStudentApplicationRepository _applicationRepo = new();
    private readonly FakeStudentEvidenceRepository _evidenceRepo = new();
    private readonly FakeStudentCriterionRepository _criterionRepo = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly Guid _currentUserId = Guid.NewGuid();

    private UpsertEvidenceHandler CreateHandler() =>
        new(
            _applicationRepo,
            _evidenceRepo,
            _criterionRepo,
            _unitOfWork,
            new FakeCurrentUser(_currentUserId));

    [Fact]
    public async Task UpsertEvidence_WhenNew_CreatesEvidenceWithNullTemplateId()
    {
        var appId = Guid.NewGuid();
        var criterionId = Guid.NewGuid();

        _applicationRepo.Applications.Add(new SV5T.Domain.Submissions.Application
        {
            Id = appId,
            ApplicantUserId = _currentUserId,
            Status = SubmissionStatus.Draft
        });

        var standard = new Standard
        {
            Id = Guid.NewGuid(),
            GroupCode = StandardGroupCode.Study,
            Title = "Học tập tốt"
        };

        var criterion = new Criterion
        {
            Id = criterionId,
            Type = CriterionType.Requirement,
            Code = "TC_01",
            Title = "Điểm rèn luyện",
            Standard = standard,
            StandardId = standard.Id
        };
        _criterionRepo.Criteria.Add(criterion);

        var handler = CreateHandler();
        var command = new UpsertEvidenceCommand(
            appId,
            criterionId,
            new UpsertEvidenceRequest("{\"score\": 9.0}", null));

        var result = await handler.Handle(command, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(criterionId, result.CriterionId);
        Assert.Equal("TC_01", result.CriterionCode);
        Assert.Equal(EvidenceStatus.Draft, result.Status);

        var saved = Assert.Single(_evidenceRepo.Evidences);
        Assert.Equal(appId, saved.ApplicationId);
        Assert.Equal(criterionId, saved.CriterionId);
        Assert.Equal("{\"score\": 9.0}", saved.DataJson);
    }

    [Fact]
    public async Task UpsertEvidence_WhenNew_DoesNotAttachCriterionNavigation()
    {
        // Regression cho bug 409 unique_constraint_violation do EF re-INSERT criteria:
        // criterion load bằng AsNoTracking (Detached) nên handler KHÔNG được gán
        // navigation Criterion vào entity Evidence mới.
        var appId = Guid.NewGuid();
        var criterionId = Guid.NewGuid();

        _applicationRepo.Applications.Add(new SV5T.Domain.Submissions.Application
        {
            Id = appId,
            ApplicantUserId = _currentUserId,
            Status = SubmissionStatus.Draft
        });

        _criterionRepo.Criteria.Add(new Criterion
        {
            Id = criterionId,
            Type = CriterionType.Requirement,
            Code = "TC_NAV",
            Title = "Không gán navigation",
            Standard = new Standard
            {
                Id = Guid.NewGuid(),
                GroupCode = StandardGroupCode.Study,
                Title = "Học tập tốt"
            }
        });

        var handler = CreateHandler();
        var result = await handler.Handle(
            new UpsertEvidenceCommand(
                appId,
                criterionId,
                new UpsertEvidenceRequest("{}", null)),
            CancellationToken.None);

        Assert.Equal("TC_NAV", result.CriterionCode);
        var saved = Assert.Single(_evidenceRepo.Evidences);
        Assert.Equal(criterionId, saved.CriterionId);
        Assert.Null(saved.Criterion);
    }

    [Fact]
    public async Task UpsertEvidence_WhenCriterionNotRequirement_ThrowsValidationException()
    {
        var appId = Guid.NewGuid();
        var criterionId = Guid.NewGuid();

        _applicationRepo.Applications.Add(new SV5T.Domain.Submissions.Application
        {
            Id = appId,
            ApplicantUserId = _currentUserId,
            Status = SubmissionStatus.Draft
        });

        _criterionRepo.Criteria.Add(new Criterion
        {
            Id = criterionId,
            Type = CriterionType.Group, // Not Requirement
            Code = "TC_GRP",
            Title = "Nhóm tiêu chí"
        });

        var handler = CreateHandler();
        var command = new UpsertEvidenceCommand(
            appId,
            criterionId,
            new UpsertEvidenceRequest("{}", null));

        var ex = await Assert.ThrowsAsync<UseCaseException>(() =>
            handler.Handle(command, CancellationToken.None));

        Assert.Equal(ApplicationErrorKind.Validation, ex.Kind);
        Assert.Equal("criterion_not_requirement", ex.ErrorCode);
    }

    [Fact]
    public async Task UpsertEvidence_WhenApplicationSubmitted_ThrowsConflictException()
    {
        var appId = Guid.NewGuid();
        var criterionId = Guid.NewGuid();

        _applicationRepo.Applications.Add(new SV5T.Domain.Submissions.Application
        {
            Id = appId,
            ApplicantUserId = _currentUserId,
            Status = SubmissionStatus.Submitted // Not editable
        });

        var handler = CreateHandler();
        var command = new UpsertEvidenceCommand(
            appId,
            criterionId,
            new UpsertEvidenceRequest("{}", null));

        var ex = await Assert.ThrowsAsync<UseCaseException>(() =>
            handler.Handle(command, CancellationToken.None));

        Assert.Equal(ApplicationErrorKind.Conflict, ex.Kind);
        Assert.Equal("application_not_editable", ex.ErrorCode);
    }

    private sealed class FakeStudentApplicationRepository : IStudentApplicationRepository
    {
        public List<SV5T.Domain.Submissions.Application> Applications { get; } = [];

        public Task<SV5T.Domain.Submissions.Application?> GetByIdAsync(
            Guid id, bool tracking = false, CancellationToken cancellationToken = default) =>
            Task.FromResult(Applications.FirstOrDefault(a => a.Id == id));

        public Task<SV5T.Domain.Submissions.Application?> GetByIdForUserAsync(
            Guid id, Guid userId, bool tracking = false, CancellationToken cancellationToken = default) =>
            Task.FromResult(Applications.FirstOrDefault(a => a.Id == id && a.ApplicantUserId == userId));

        public Task<SV5T.Domain.Submissions.Application?> GetByCampaignAndUserAsync(
            Guid campaignId, Guid userId, bool tracking = false, CancellationToken cancellationToken = default) =>
            Task.FromResult(Applications.FirstOrDefault(a => a.CampaignId == campaignId && a.ApplicantUserId == userId));

        public Task<IReadOnlyList<SV5T.Domain.Submissions.Application>> GetByUserAsync(
            Guid userId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<SV5T.Domain.Submissions.Application>>(
                Applications.Where(a => a.ApplicantUserId == userId).ToList());

        public Task<PagedResult<SV5T.Domain.Submissions.Application>> GetPagedByUserAsync(
            Guid userId, int pageIndex, int pageSize, CancellationToken cancellationToken = default)
        {
            var userApps = Applications.Where(a => a.ApplicantUserId == userId).ToList();
            return Task.FromResult(new PagedResult<SV5T.Domain.Submissions.Application>(
                userApps, userApps.Count, pageIndex, pageSize));
        }

        public Task AddAsync(SV5T.Domain.Submissions.Application application, CancellationToken cancellationToken = default)
        {
            Applications.Add(application);
            return Task.CompletedTask;
        }

        public Task AddReviewLogAsync(ReviewLog reviewLog, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }

    private sealed class FakeStudentEvidenceRepository : IStudentEvidenceRepository
    {
        public List<Evidence> Evidences { get; } = [];

        public Task<Evidence?> GetByIdAsync(
            Guid id, bool tracking = false, CancellationToken cancellationToken = default) =>
            Task.FromResult(Evidences.FirstOrDefault(e => e.Id == id));

        public Task<Evidence?> GetByIdForUserAsync(
            Guid id, Guid userId, bool tracking = false, CancellationToken cancellationToken = default) =>
            Task.FromResult(Evidences.FirstOrDefault(e => e.Id == id));

        public Task<Evidence?> GetByApplicationAndCriterionAsync(
            Guid applicationId, Guid criterionId, bool tracking = false, CancellationToken cancellationToken = default) =>
            Task.FromResult(Evidences.FirstOrDefault(e => e.ApplicationId == applicationId && e.CriterionId == criterionId));

        public Task<IReadOnlyList<Evidence>> GetByApplicationAsync(
            Guid applicationId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Evidence>>(Evidences.Where(e => e.ApplicationId == applicationId).ToList());

        public Task<IReadOnlyList<Evidence>> GetByApplicationForUserAsync(
            Guid applicationId, Guid userId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Evidence>>(Evidences.Where(e => e.ApplicationId == applicationId).ToList());

        public Task AddAsync(Evidence evidence, CancellationToken cancellationToken = default)
        {
            Evidences.Add(evidence);
            return Task.CompletedTask;
        }
    }

    private sealed class FakeStudentCriterionRepository : IStudentCriterionRepository
    {
        public List<Criterion> Criteria { get; } = [];

        public Task<Criterion?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Criteria.FirstOrDefault(c => c.Id == id));

        public Task<IReadOnlyList<Criterion>> GetRequirementsByStandardSetIdAsync(
            Guid standardSetId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Criterion>>(Criteria);
    }

    private sealed class FakeCurrentUser(Guid? userId) : ICurrentUser
    {
        public Guid? UserId => userId;
        public bool IsAuthenticated => true;
        public bool IsInRole(string role) => true;
    }

    private sealed class FakeUnitOfWork : IUnitOfWork
    {
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default) => operation(cancellationToken);
    }
}

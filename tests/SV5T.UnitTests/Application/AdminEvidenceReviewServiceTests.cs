using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Services;
using SV5T.Application.Admin.Validators;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Models;
using SV5T.Application.Evidences.Abstractions;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Campaigns.Enums;
using SV5T.Domain.Criteria;
using SV5T.Domain.Evidences;
using SV5T.Domain.Standards.Enums;
using SV5T.Domain.Submissions;
using SV5T.Domain.Submissions.Enums;
using SubmissionApplication = SV5T.Domain.Submissions.Application;
using Xunit;

namespace SV5T.UnitTests.Application;

public sealed class AdminEvidenceReviewServiceTests
{
    private readonly FakeEvidenceRepository _evidenceRepo = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly FakeCurrentUser _currentUser = new(Guid.NewGuid());

    private AdminEvidenceReviewService CreateService() =>
        new(
            _evidenceRepo,
            _unitOfWork,
            _currentUser,
            new ReviewEvidenceRequestValidator());

    [Fact]
    public async Task ReviewAsync_RowVersionMismatch_ThrowsConcurrencyConflict()
    {
        var evidenceId = Guid.NewGuid();
        var serverRowVersion = new byte[] { 1, 2, 3, 4 };
        var staleClientRowVersion = Convert.ToBase64String(new byte[] { 9, 9, 9, 9 });

        var evidence = new Evidence
        {
            Id = evidenceId,
            Status = EvidenceStatus.Submitted,
            RowVersion = serverRowVersion,
            Application = new SubmissionApplication
            {
                Status = SubmissionStatus.Submitted,
                Campaign = new Campaign
                {
                    Status = CampaignStatus.Reviewing,
                    ReviewDeadline = DateTime.UtcNow.AddDays(10)
                }
            }
        };

        _evidenceRepo.Items.Add(evidence);

        var service = CreateService();
        var request = new ReviewEvidenceRequest(EvidenceStatus.Approved, "Duyệt đạt", staleClientRowVersion);

        var ex = await Assert.ThrowsAsync<UseCaseException>(() => service.ReviewAsync(evidenceId, request));

        Assert.Equal(ApplicationErrorKind.Conflict, ex.Kind);
        Assert.Equal("concurrency_conflict", ex.ErrorCode);
    }

    [Fact]
    public async Task ReviewAsync_ResubmittedApplication_AutoSyncsToUnderReview()
    {
        var evidenceId = Guid.NewGuid();
        var validRowVersion = new byte[] { 5, 6, 7, 8 };
        var clientRowVersionBase64 = Convert.ToBase64String(validRowVersion);

        var application = new SubmissionApplication
        {
            Status = SubmissionStatus.Resubmitted, // Sinh viên nộp lại minh chứng
            Campaign = new Campaign
            {
                Status = CampaignStatus.Reviewing,
                ReviewDeadline = DateTime.UtcNow.AddDays(10)
            }
        };

        var evidence = new Evidence
        {
            Id = evidenceId,
            Status = EvidenceStatus.Submitted,
            RowVersion = validRowVersion,
            Application = application,
            Criterion = new Criterion { Title = "Tiêu chí điểm rèn luyện" },
            EvidenceTypeTemplate = new EvidenceTypeTemplate { Name = "Bảng điểm rèn luyện" }
        };

        _evidenceRepo.Items.Add(evidence);

        var service = CreateService();
        var request = new ReviewEvidenceRequest(EvidenceStatus.Approved, "Minh chứng bổ sung hợp lệ", clientRowVersionBase64);

        var result = await service.ReviewAsync(evidenceId, request);

        Assert.Equal(EvidenceStatus.Approved, result.Status);
        Assert.Equal(SubmissionStatus.UnderReview, application.Status); // Đã auto sync từ Resubmitted -> UnderReview
        Assert.Equal(_currentUser.UserId, application.AssignedReviewerId);
        Assert.Single(_evidenceRepo.ReviewLogs);
        Assert.Equal(ReviewAction.EvidenceApproved, _evidenceRepo.ReviewLogs[0].Action);
    }

    [Fact]
    public async Task ReviewAsync_CampaignDeadlinePassed_ThrowsConflictException()
    {
        var evidenceId = Guid.NewGuid();
        var rowVersion = new byte[] { 1, 1, 1, 1 };

        var evidence = new Evidence
        {
            Id = evidenceId,
            Status = EvidenceStatus.Submitted,
            RowVersion = rowVersion,
            Application = new SubmissionApplication
            {
                Status = SubmissionStatus.Submitted,
                Campaign = new Campaign
                {
                    Status = CampaignStatus.Reviewing,
                    ReviewDeadline = DateTime.UtcNow.AddDays(-1) // Quá hạn
                }
            }
        };

        _evidenceRepo.Items.Add(evidence);

        var service = CreateService();
        var request = new ReviewEvidenceRequest(EvidenceStatus.Approved, "Duyệt", Convert.ToBase64String(rowVersion));

        var ex = await Assert.ThrowsAsync<UseCaseException>(() => service.ReviewAsync(evidenceId, request));

        Assert.Equal(ApplicationErrorKind.Conflict, ex.Kind);
        Assert.Equal("campaign_review_deadline_passed", ex.ErrorCode);
    }

    [Fact]
    public async Task ReviewAsync_RejectWithoutNote_ThrowsValidationException()
    {
        var service = CreateService();
        var request = new ReviewEvidenceRequest(EvidenceStatus.Rejected, null, "AQIDBA==");

        var ex = await Assert.ThrowsAsync<UseCaseException>(() => service.ReviewAsync(Guid.NewGuid(), request));
        Assert.Equal(ApplicationErrorKind.Validation, ex.Kind);
    }

    private sealed class FakeEvidenceRepository : IEvidenceRepository
    {
        public List<Evidence> Items { get; } = [];
        public List<ReviewLog> ReviewLogs { get; } = [];

        public Task<Evidence?> GetByIdAsync(Guid id, bool tracking = false, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.FirstOrDefault(x => x.Id == id));

        public Task<PagedResult<Evidence>> GetPagedAsync(Guid? campaignId, EvidenceStatus? status, Guid? applicationId, int pageIndex, int pageSize, CancellationToken cancellationToken = default) =>
            Task.FromResult(new PagedResult<Evidence>(Items, Items.Count, pageIndex, pageSize));

        public Task UpdateAsync(Evidence evidence, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task AddReviewLogAsync(ReviewLog reviewLog, CancellationToken cancellationToken = default)
        {
            ReviewLogs.Add(reviewLog);
            return Task.CompletedTask;
        }
    }

    private sealed class FakeCurrentUser(Guid? userId) : ICurrentUser
    {
        public Guid? UserId => userId;
        public bool IsAuthenticated => true;
        public bool IsInRole(string role) => string.Equals(role, "Mentor", StringComparison.OrdinalIgnoreCase);
    }

    private sealed class FakeUnitOfWork : IUnitOfWork
    {
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default) => operation(cancellationToken);
    }
}

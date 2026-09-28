using SV5T.Application.Admin.Applications;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Models;
using SV5T.Application.Student.Abstractions;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Campaigns.Enums;
using SV5T.Domain.Criteria;
using SV5T.Domain.Evidences;
using SV5T.Domain.Standards;
using SV5T.Domain.Standards.Enums;
using SV5T.Domain.Submissions;
using SV5T.Domain.Submissions.Enums;
using Xunit;
using SubmissionApplication = SV5T.Domain.Submissions.Application;

namespace SV5T.UnitTests.Application;

public sealed class CampaignApplicationReviewTests
{
    [Fact]
    public async Task Approval_RequiresAllFiveStandards_AndRecordsDecision()
    {
        var application = new SubmissionApplication
        {
            Status = SubmissionStatus.Submitted,
            SubmittedAt = DateTime.UtcNow.AddDays(-1),
            RowVersion = [1, 2, 3],
            Campaign = new Campaign { Status = CampaignStatus.Reviewing,
                ReviewDeadline = DateTime.UtcNow.AddDays(7) }
        };
        var criteria = new FakeCriteria();
        foreach (var group in Enum.GetValues<StandardGroupCode>())
        {
            var standard = new Standard { GroupCode = group };
            var criterion = new Criterion { Type = CriterionType.Requirement,
                Code = group.ToString(), Title = group.ToString(), Standard = standard };
            criteria.Items.Add(criterion);
            application.Evidences.Add(new Evidence { CriterionId = criterion.Id,
                Status = group == StandardGroupCode.Integration ? EvidenceStatus.Submitted : EvidenceStatus.Approved });
        }
        var repository = new FakeApplications(application);
        var handler = new DecideApplicationHandler(repository, criteria, new FakeUow(), new FakeUser());
        var request = new DecideApplicationCommand(application.Id,
            new ReviewApplicationDecisionRequest(SubmissionStatus.Approved, null, "AQID"));

        var error = await Assert.ThrowsAsync<UseCaseException>(() => handler.Handle(request, CancellationToken.None));
        Assert.Equal("application_standards_incomplete", error.ErrorCode);
        Assert.Equal(SubmissionStatus.Submitted, application.Status);

        application.Evidences.Last().Status = EvidenceStatus.Approved;
        var result = await handler.Handle(request, CancellationToken.None);
        Assert.Equal(SubmissionStatus.Approved, result.Status);
        Assert.Equal(5, result.Standards.Count(x => x.Complete));
        Assert.Equal(ReviewAction.ApplicationApproved, Assert.Single(repository.Logs).Action);
    }

    private sealed class FakeApplications(SubmissionApplication app) : IReviewApplicationRepository
    {
        public List<ReviewLog> Logs { get; } = [];
        public Task<PagedResult<SubmissionApplication>> GetSubmittedPagedAsync(Guid? campaignId,
            SubmissionStatus? status, int pageIndex, int pageSize, CancellationToken ct) =>
            Task.FromResult(new PagedResult<SubmissionApplication>([app], 1, pageIndex, pageSize));
        public Task<SubmissionApplication?> GetByIdAsync(Guid id, bool tracking, CancellationToken ct) =>
            Task.FromResult<SubmissionApplication?>(id == app.Id ? app : null);
        public Task AddReviewLogAsync(ReviewLog log, CancellationToken ct)
        {
            Logs.Add(log);
            return Task.CompletedTask;
        }
    }

    private sealed class FakeCriteria : IStudentCriterionRepository
    {
        public List<Criterion> Items { get; } = [];
        public Task<Criterion?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.FirstOrDefault(x => x.Id == id));
        public Task<IReadOnlyList<Criterion>> GetRequirementsByStandardSetIdAsync(Guid standardSetId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Criterion>>(Items);
    }

    private sealed class FakeUow : IUnitOfWork
    {
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation,
            CancellationToken cancellationToken = default) => operation(cancellationToken);
    }

    private sealed class FakeUser : ICurrentUser
    {
        public Guid? UserId { get; } = Guid.NewGuid();
        public bool IsAuthenticated => true;
        public bool IsInRole(string role) => role is "Admin" or "Mentor";
    }
}

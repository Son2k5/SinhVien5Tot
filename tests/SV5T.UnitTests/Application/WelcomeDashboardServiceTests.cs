using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Models;
using SV5T.Application.Standards.Abstractions;
using SV5T.Application.Student.Abstractions;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Evidences;
using SV5T.Domain.Standards;
using SV5T.Domain.Submissions;
using SubmissionApplication = SV5T.Domain.Submissions.Application;
using Xunit;

namespace SV5T.UnitTests.Application;

public sealed class WelcomeDashboardHandlerTests
{
    [Fact]
    public async Task Get_ReturnsProfileAndSeparatesPortalContent()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = "student@ms.hanu.edu.vn",
            DisplayName = "Nguyễn Minh Anh",
            IsActive = true,
            IsVerified = true,
            Profile = new UserProfile
            {
                FullName = "Nguyễn Minh Anh",
                Faculty = "Công nghệ thông tin"
            }
        };
        user.DisplayName = user.Email;
        var handler = CreateHandler(
            new FakeCurrentUser(user.Id),
            new FakeUserRepository(user),
            new FakeContentRepository(
                Content(PortalContentType.Notification),
                Content(PortalContentType.News)));

        var response = await handler.Handle(new GetWelcomeDashboardQuery(), CancellationToken.None);

        Assert.Equal("Nguyễn Minh Anh", response.User.DisplayName);
        Assert.Equal("Công nghệ thông tin", response.User.Faculty);
        Assert.Single(response.Notifications);
        Assert.Single(response.News);
        Assert.NotEmpty(response.Features);
    }

    [Fact]
    public async Task Get_RejectsMissingAuthenticatedSession()
    {
        var handler = CreateHandler(
            new FakeCurrentUser(null),
            new FakeUserRepository(),
            new FakeContentRepository());

        var exception = await Assert.ThrowsAsync<UseCaseException>(
            () => handler.Handle(new GetWelcomeDashboardQuery(), CancellationToken.None));

        Assert.Equal("invalid_session", exception.ErrorCode);
    }

    [Fact]
    public async Task Get_RejectsUnverifiedUser()
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            IsActive = true,
            IsVerified = false
        };
        var handler = CreateHandler(
            new FakeCurrentUser(user.Id),
            new FakeUserRepository(user),
            new FakeContentRepository());

        var exception = await Assert.ThrowsAsync<UseCaseException>(
            () => handler.Handle(new GetWelcomeDashboardQuery(), CancellationToken.None));

        Assert.Equal(ApplicationErrorKind.NotFound, exception.Kind);
    }

    private static PortalContent Content(PortalContentType type) => new()
    {
        Type = type,
        Source = PortalContentSource.System,
        Title = "Nội dung",
        Summary = "Mô tả",
        Route = "/dashboard",
        Icon = "sparkles",
        IsPublished = true,
        PublishedAtUtc = DateTime.UtcNow.AddMinutes(-1)
    };

    private sealed class FakeCurrentUser(Guid? userId) : ICurrentUser
    {
        public bool IsAuthenticated => userId.HasValue;
        public Guid? UserId => userId;
        public bool IsInRole(string role) => false;
    }

    private sealed class FakeUserRepository(params User[] users) : IUserRepository
    {
        public Task<User?> GetByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(users.FirstOrDefault(user => user.Id == id));

        public Task<SV5T.Application.Users.Dtos.UserSummaryResponse?> GetSummaryByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default)
        {
            var user = users.FirstOrDefault(u => u.Id == id);
            if (user == null) return Task.FromResult<SV5T.Application.Users.Dtos.UserSummaryResponse?>(null);
            return Task.FromResult<SV5T.Application.Users.Dtos.UserSummaryResponse?>(new SV5T.Application.Users.Dtos.UserSummaryResponse(
                user.Id,
                user.Email,
                user.DisplayName,
                user.Role,
                user.AvatarUrl,
                user.IsVerified,
                user.IsActive,
                user.SecurityVersion,
                user.CreatedAt,
                user.UpdatedAt,
                user.Profile?.FullName,
                user.Profile?.Faculty));
        }

        public Task<User?> GetByNormalizedEmailAsync(
            string normalizedEmail,
            bool tracking = false,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(users.FirstOrDefault(
                user => user.NormalizedEmail == normalizedEmail));

        public Task<User?> GetByIdWithProfileAsync(
            Guid id,
            bool tracking = false,
            CancellationToken cancellationToken = default) =>
            GetByIdAsync(id, cancellationToken);

        public Task<bool> ExistsStudentCodeAsync(
            string studentCode,
            Guid excludeUserId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(users.Any(user => user.Id != excludeUserId &&
                user.Profile?.StudentCode == studentCode));

        public Task AddProfileAsync(
            UserProfile profile,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task AddAddressAsync(
            UserAddress address,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task AddAsync(
            User user,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task<int> DeleteUnverifiedBeforeAsync(
            DateTime cutoffUtc,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(0);
    }

    private sealed class FakeContentRepository(params PortalContent[] contents)
        : IPortalContentRepository
    {
        public Task<IReadOnlyList<PortalContent>> GetPublishedAsync(
            DateTime nowUtc,
            int limit,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<PortalContent>>(
                contents.Take(limit).ToArray());
    }

    private static GetWelcomeDashboardHandler CreateHandler(
        ICurrentUser currentUser,
        IUserRepository userRepository,
        IPortalContentRepository contentRepository,
        IStudentApplicationRepository? studentApplications = null,
        IStudentEvidenceRepository? studentEvidences = null,
        IStandardSetRepository? standardSetRepository = null,
        IStudentCampaignRepository? studentCampaigns = null) =>
        new(
            currentUser,
            userRepository,
            contentRepository,
            studentApplications ?? new FakeStudentApplicationRepository(),
            studentEvidences ?? new FakeStudentEvidenceRepository(),
            standardSetRepository ?? new FakeStandardSetRepository(),
            studentCampaigns ?? new FakeStudentCampaignRepository());

    private sealed class FakeStudentApplicationRepository : IStudentApplicationRepository
    {
        public Task<SubmissionApplication?> GetByIdAsync(Guid id, bool tracking = false, CancellationToken cancellationToken = default) => Task.FromResult<SubmissionApplication?>(null);
        public Task<SubmissionApplication?> GetByIdForUserAsync(Guid id, Guid userId, bool tracking = false, CancellationToken cancellationToken = default) => Task.FromResult<SubmissionApplication?>(null);
        public Task<SubmissionApplication?> GetByCampaignAndUserAsync(Guid campaignId, Guid userId, bool tracking = false, CancellationToken cancellationToken = default) => Task.FromResult<SubmissionApplication?>(null);
        public Task<IReadOnlyList<SubmissionApplication>> GetByUserAsync(Guid userId, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<SubmissionApplication>>(Array.Empty<SubmissionApplication>());
        public Task<PagedResult<SubmissionApplication>> GetPagedByUserAsync(Guid userId, int pageIndex, int pageSize, CancellationToken cancellationToken = default) => Task.FromResult(new PagedResult<SubmissionApplication>(Array.Empty<SubmissionApplication>(), 0, pageIndex, pageSize));
        public Task AddAsync(SubmissionApplication application, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task AddReviewLogAsync(ReviewLog reviewLog, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class FakeStudentEvidenceRepository : IStudentEvidenceRepository
    {
        public Task<Evidence?> GetByIdAsync(Guid id, bool tracking = false, CancellationToken cancellationToken = default) => Task.FromResult<Evidence?>(null);
        public Task<Evidence?> GetByIdForUserAsync(Guid id, Guid userId, bool tracking = false, CancellationToken cancellationToken = default) => Task.FromResult<Evidence?>(null);
        public Task<Evidence?> GetByApplicationAndCriterionAsync(Guid applicationId, Guid criterionId, bool tracking = false, CancellationToken cancellationToken = default) => Task.FromResult<Evidence?>(null);
        public Task<IReadOnlyList<Evidence>> GetByApplicationAsync(Guid applicationId, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<Evidence>>(Array.Empty<Evidence>());
        public Task<IReadOnlyList<Evidence>> GetByApplicationForUserAsync(Guid applicationId, Guid userId, CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<Evidence>>(Array.Empty<Evidence>());
        public Task AddAsync(Evidence evidence, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class FakeStandardSetRepository : IStandardSetRepository
    {
        public Task<StandardSet?> GetByIdAsync(Guid id, bool includeStandards = false, bool includeCriteria = false, bool tracking = false, CancellationToken cancellationToken = default) => Task.FromResult<StandardSet?>(null);
        public Task<IReadOnlyList<StandardSet>> GetAllAsync(CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<StandardSet>>(Array.Empty<StandardSet>());
        public Task<bool> ExistsByNameAsync(string name, Guid? excludeId = null, CancellationToken cancellationToken = default) => Task.FromResult(false);
        public Task<bool> ExistsByAcademicYearAndLevelAsync(string academicYear, SV5T.Domain.Awards.Enums.AwardLevel level, SV5T.Domain.Awards.Enums.AwardType awardType, int version, Guid? excludeId = null, CancellationToken cancellationToken = default) => Task.FromResult(false);
        public Task AddAsync(StandardSet standardSet, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task UpdateAsync(StandardSet standardSet, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task RemoveAsync(StandardSet standardSet, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }

    private sealed class FakeStudentCampaignRepository : IStudentCampaignRepository
    {
        public Task<Campaign?> GetByIdAsync(Guid id, bool includeDetails = false, CancellationToken cancellationToken = default) => Task.FromResult<Campaign?>(null);
        public Task<IReadOnlyList<Campaign>> GetOpenAsync(CancellationToken cancellationToken = default) => Task.FromResult<IReadOnlyList<Campaign>>(Array.Empty<Campaign>());
        public Task<PagedResult<Campaign>> GetOpenPagedAsync(int pageIndex, int pageSize, CancellationToken cancellationToken = default) => Task.FromResult(new PagedResult<Campaign>(Array.Empty<Campaign>(), 0, pageIndex, pageSize));
    }
}



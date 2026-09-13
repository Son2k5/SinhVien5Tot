using SV5T.Application.Common.Exceptions;
using Xunit;

namespace SV5T.UnitTests.Application;

public sealed class WelcomeDashboardServiceTests
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
        var service = new WelcomeDashboardService(
            new FakeCurrentUser(user.Id),
            new FakeUserRepository(user),
            new FakeContentRepository(
                Content(PortalContentType.Notification),
                Content(PortalContentType.News)));

        var response = await service.GetAsync();

        Assert.Equal("Nguyễn Minh Anh", response.User.DisplayName);
        Assert.Equal("Công nghệ thông tin", response.User.Faculty);
        Assert.Single(response.Notifications);
        Assert.Single(response.News);
        Assert.NotEmpty(response.Features);
    }

    [Fact]
    public async Task Get_RejectsMissingAuthenticatedSession()
    {
        var service = new WelcomeDashboardService(
            new FakeCurrentUser(null),
            new FakeUserRepository(),
            new FakeContentRepository());

        var exception = await Assert.ThrowsAsync<UseCaseException>(
            () => service.GetAsync());

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
        var service = new WelcomeDashboardService(
            new FakeCurrentUser(user.Id),
            new FakeUserRepository(user),
            new FakeContentRepository());

        var exception = await Assert.ThrowsAsync<UseCaseException>(
            () => service.GetAsync());

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
}



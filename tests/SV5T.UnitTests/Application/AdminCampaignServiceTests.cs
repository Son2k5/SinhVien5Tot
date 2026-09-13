using SV5T.Application.Admin.Campaigns.Commands.CreateCampaign;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Campaigns.Abstractions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Models;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Campaigns.Enums;
using SV5T.Domain.Standards;
using SV5T.Domain.Standards.Enums;
using Xunit;

namespace SV5T.UnitTests.Application;

public sealed class AdminCampaignHandlerTests
{
    private readonly FakeCampaignRepository _campaignRepo = new();
    private readonly FakeStandardSetRepository _standardRepo = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly FakeCurrentUser _currentUser = new(Guid.NewGuid());

    private CreateCampaignHandler CreateHandler() =>
        new(
            _campaignRepo,
            _standardRepo,
            _unitOfWork,
            _currentUser);

    [Fact]
    public async Task CreateAsync_SchoolLevelWithPrerequisite_ThrowsValidationException()
    {
        var publishedStandardId = Guid.NewGuid();
        _standardRepo.Items.Add(new StandardSet
        {
            Id = publishedStandardId,
            AcademicYear = "2026-2027",
            Level = AwardLevel.School,
            AwardType = AwardType.Individual,
            Status = StandardSetStatus.Published
        });

        var handler = CreateHandler();
        var request = new CreateCampaignRequest(
            "Chiến dịch SV5T Cấp Trường",
            "2026-2027",
            AwardLevel.School,
            AwardType.Individual,
            publishedStandardId,
            Guid.NewGuid(), // Sai: Cấp trường không được có prerequisite
            DateTime.UtcNow.AddDays(1),
            DateTime.UtcNow.AddDays(10),
            DateTime.UtcNow.AddDays(15),
            DateTime.UtcNow.AddDays(30),
            "Mô tả",
            "[]");

        var ex = await Assert.ThrowsAsync<UseCaseException>(() => handler.Handle(new CreateCampaignCommand(request), CancellationToken.None));
        Assert.Equal("invalid_prerequisite_school", ex.ErrorCode);
    }

    [Fact]
    public async Task CreateAsync_CityLevelWithoutPrerequisite_ThrowsValidationException()
    {
        var publishedStandardId = Guid.NewGuid();
        _standardRepo.Items.Add(new StandardSet
        {
            Id = publishedStandardId,
            AcademicYear = "2026-2027",
            Level = AwardLevel.City,
            AwardType = AwardType.Individual,
            Status = StandardSetStatus.Published
        });

        var handler = CreateHandler();
        var request = new CreateCampaignRequest(
            "Chiến dịch SV5T Cấp Thành phố",
            "2026-2027",
            AwardLevel.City,
            AwardType.Individual,
            publishedStandardId,
            null, // Sai: Cấp Thành phố bắt buộc có prerequisite là cấp Trường
            DateTime.UtcNow.AddDays(1),
            DateTime.UtcNow.AddDays(10),
            DateTime.UtcNow.AddDays(15),
            DateTime.UtcNow.AddDays(30),
            "Mô tả",
            "[]");

        var ex = await Assert.ThrowsAsync<UseCaseException>(() => handler.Handle(new CreateCampaignCommand(request), CancellationToken.None));
        Assert.Equal("missing_prerequisite_city", ex.ErrorCode);
    }

    [Fact]
    public async Task CreateAsync_StandardSetNotPublished_ThrowsValidationException()
    {
        var draftStandardId = Guid.NewGuid();
        _standardRepo.Items.Add(new StandardSet
        {
            Id = draftStandardId,
            AcademicYear = "2026-2027",
            Level = AwardLevel.School,
            AwardType = AwardType.Individual,
            Status = StandardSetStatus.Draft // Chưa publish
        });

        var handler = CreateHandler();
        var request = new CreateCampaignRequest(
            "Chiến dịch SV5T Cấp Trường",
            "2026-2027",
            AwardLevel.School,
            AwardType.Individual,
            draftStandardId,
            null,
            DateTime.UtcNow.AddDays(1),
            DateTime.UtcNow.AddDays(10),
            DateTime.UtcNow.AddDays(15),
            DateTime.UtcNow.AddDays(30),
            "Mô tả",
            "[]");

        var ex = await Assert.ThrowsAsync<UseCaseException>(() => handler.Handle(new CreateCampaignCommand(request), CancellationToken.None));
        Assert.Equal("standard_set_not_published", ex.ErrorCode);
    }

    [Fact]
    public async Task CreateAsync_ValidCityCampaign_Succeeds()
    {
        var schoolCampaignId = Guid.NewGuid();
        _campaignRepo.Items.Add(new Campaign
        {
            Id = schoolCampaignId,
            Name = "Chiến dịch Cấp Trường 2026",
            SchoolYear = "2026-2027",
            Level = AwardLevel.School,
            AwardType = AwardType.Individual,
            Status = CampaignStatus.Open
        });

        var publishedStandardId = Guid.NewGuid();
        _standardRepo.Items.Add(new StandardSet
        {
            Id = publishedStandardId,
            AcademicYear = "2026-2027",
            Level = AwardLevel.City,
            AwardType = AwardType.Individual,
            Status = StandardSetStatus.Published
        });

        var handler = CreateHandler();
        var request = new CreateCampaignRequest(
            "Chiến dịch SV5T Cấp Thành phố 2026",
            "2026-2027",
            AwardLevel.City,
            AwardType.Individual,
            publishedStandardId,
            schoolCampaignId,
            DateTime.UtcNow.AddDays(1),
            DateTime.UtcNow.AddDays(10),
            DateTime.UtcNow.AddDays(15),
            DateTime.UtcNow.AddDays(30),
            "Mô tả",
            "[]");

        var result = await handler.Handle(new CreateCampaignCommand(request), CancellationToken.None);

        Assert.Equal("Chiến dịch SV5T Cấp Thành phố 2026", result.Name);
        Assert.Equal(AwardLevel.City, result.Level);
        Assert.Equal(schoolCampaignId, result.PrerequisiteCampaignId);
    }

    private sealed class FakeCampaignRepository : ICampaignRepository
    {
        public List<Campaign> Items { get; } = [];

        public Task<Campaign?> GetByIdAsync(Guid id, bool includeDetails = false, bool tracking = false, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.FirstOrDefault(x => x.Id == id));

        public Task<IReadOnlyList<Campaign>> GetByIdsAsync(IEnumerable<Guid> ids, bool includeDetails = false, bool tracking = false, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Campaign>>(Items.Where(x => ids.Contains(x.Id)).ToList());

        public Task<IReadOnlyList<Campaign>> GetAllAsync(AwardLevel? level = null, CampaignStatus? status = null, string? schoolYear = null, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Campaign>>(Items);

        public Task<PagedResult<Campaign>> GetPagedAsync(AwardLevel? level, CampaignStatus? status, string? schoolYear, int pageIndex, int pageSize, CancellationToken cancellationToken = default) =>
            Task.FromResult(new PagedResult<Campaign>(Items, Items.Count, pageIndex, pageSize));

        public Task<bool> ExistsByNameAndSchoolYearAsync(string name, string schoolYear, Guid? excludeId = null, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.Any(x => x.Name == name && x.SchoolYear == schoolYear && x.Id != excludeId));

        public Task AddAsync(Campaign campaign, CancellationToken cancellationToken = default)
        {
            Items.Add(campaign);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(Campaign campaign, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task RemoveAsync(Campaign campaign, CancellationToken cancellationToken = default)
        {
            Items.Remove(campaign);
            return Task.CompletedTask;
        }

        public Task RemoveRangeAsync(IEnumerable<Campaign> campaigns, CancellationToken cancellationToken = default)
        {
            foreach (var c in campaigns) Items.Remove(c);
            return Task.CompletedTask;
        }
    }

    private sealed class FakeStandardSetRepository : IStandardSetRepository
    {
        public List<StandardSet> Items { get; } = [];

        public Task<StandardSet?> GetByIdAsync(Guid id, bool includeStandards = false, bool includeCriteria = false, bool tracking = false, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.FirstOrDefault(x => x.Id == id));

        public Task<IReadOnlyList<StandardSet>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<StandardSet>>(Items);

        public Task<bool> ExistsByAcademicYearAndLevelAsync(string academicYear, AwardLevel level, AwardType awardType, int version, Guid? excludeId = null, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.Any(x => x.AcademicYear == academicYear && x.Level == level && x.AwardType == awardType && x.Version == version && x.Id != excludeId));

        public Task AddAsync(StandardSet standardSet, CancellationToken cancellationToken = default)
        {
            Items.Add(standardSet);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(StandardSet standardSet, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task RemoveAsync(StandardSet standardSet, CancellationToken cancellationToken = default)
        {
            Items.Remove(standardSet);
            return Task.CompletedTask;
        }
    }

    private sealed class FakeCurrentUser(Guid? userId) : ICurrentUser
    {
        public Guid? UserId => userId;
        public bool IsAuthenticated => true;
        public bool IsInRole(string role) => string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase);
    }

    private sealed class FakeUnitOfWork : IUnitOfWork
    {
        public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default) => Task.FromResult(1);
        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> operation, CancellationToken cancellationToken = default) => operation(cancellationToken);
    }
}

using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Commands.CreateStandardSet;
using SV5T.Application.Admin.StandardSets.Commands.PublishStandardSet;
using SV5T.Application.Admin.StandardSets.Commands.UnpublishStandardSet;
using SV5T.Application.Admin.Validators;
using SV5T.Application.Campaigns.Abstractions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Models;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Campaigns.Enums;
using SV5T.Domain.Criteria;
using SV5T.Domain.Standards;
using SV5T.Domain.Standards.Enums;
using Xunit;

namespace SV5T.UnitTests.Application;

public sealed class AdminStandardSetHandlerTests
{
    private readonly FakeStandardSetRepository _standardSetRepo = new();
    private readonly FakeStandardRepository _standardRepo = new();
    private readonly FakeCampaignRepository _campaignRepo = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly FakeCurrentUser _currentUser = new(Guid.NewGuid());

    private CreateStandardSetHandler CreateCreateHandler() =>
        new(_standardSetRepo, _unitOfWork, _currentUser);

    private PublishStandardSetHandler CreatePublishHandler() =>
        new(_standardSetRepo, _unitOfWork, _currentUser);

    private UnpublishStandardSetHandler CreateUnpublishHandler() =>
        new(_standardSetRepo, _campaignRepo, _unitOfWork, _currentUser);

    [Fact]
    public async Task CreateAsync_WithoutTemplateIndividual_CreatesDraftStandardSetWith5DefaultStandards()
    {
        var handler = CreateCreateHandler();
        var request = new CreateStandardSetRequest("Bộ tiêu chuẩn ĐH 2026-2027", "2026-2027", AwardLevel.School, AwardType.Individual, null);

        var result = await handler.Handle(new CreateStandardSetCommand(request), CancellationToken.None);

        Assert.Equal("Bộ tiêu chuẩn ĐH 2026-2027", result.Name);
        Assert.Equal("2026-2027", result.AcademicYear);
        Assert.Equal(StandardSetStatus.Draft, result.Status);
        Assert.Equal(1, result.Version);
        Assert.Null(result.PreviousVersionId);
        Assert.NotNull(result.Standards);
        Assert.Equal(5, result.Standards.Count);
    }

    [Fact]
    public async Task CreateAsync_WithTemplate_ClonesStandardsAndCriteriaTreeRecursively()
    {
        var sourceStandardSetId = Guid.NewGuid();
        var sourceStandardId = Guid.NewGuid();
        var parentCriterionId = Guid.NewGuid();
        var childCriterionId = Guid.NewGuid();

        var sourceStandard = new Standard
        {
            Id = sourceStandardId,
            StandardSetId = sourceStandardSetId,
            GroupCode = StandardGroupCode.Ethics,
            Code = "TC_DAO_DUC",
            Title = "Đạo đức tốt",
            Criteria =
            [
                new Criterion
                {
                    Id = parentCriterionId,
                    StandardId = sourceStandardId,
                    Type = CriterionType.Group,
                    Code = "TC_DAO_DUC_GRP",
                    Title = "Nhóm đạo đức"
                },
                new Criterion
                {
                    Id = childCriterionId,
                    StandardId = sourceStandardId,
                    ParentCriterionId = parentCriterionId,
                    Type = CriterionType.Requirement,
                    Code = "TC_DRL",
                    Title = "Điểm rèn luyện",
                    DefinitionJson = """{"minScore": 80}"""
                }
            ]
        };

        var sourceStandardSet = new StandardSet
        {
            Id = sourceStandardSetId,
            AcademicYear = "2025-2026",
            Level = AwardLevel.School,
            AwardType = AwardType.Individual,
            Status = StandardSetStatus.Published,
            Standards = [sourceStandard]
        };

        _standardSetRepo.Items.Add(sourceStandardSet);

        var handler = CreateCreateHandler();
        var request = new CreateStandardSetRequest("Bộ tiêu chuẩn ĐH 2026-2027", "2026-2027", AwardLevel.School, AwardType.Individual, sourceStandardSetId);

        var result = await handler.Handle(new CreateStandardSetCommand(request), CancellationToken.None);

        Assert.Equal("Bộ tiêu chuẩn ĐH 2026-2027", result.Name);
        Assert.Equal("2026-2027", result.AcademicYear);
        Assert.Equal(sourceStandardSetId, result.PreviousVersionId);
        Assert.NotNull(result.Standards);
        Assert.Single(result.Standards);

        var clonedStandard = result.Standards[0];
        Assert.NotEqual(sourceStandardId, clonedStandard.Id);
        Assert.Equal(2, clonedStandard.Criteria!.Count);

        var clonedParent = clonedStandard.Criteria.Single(x => x.Code == "TC_DAO_DUC_GRP");
        var clonedChild = clonedStandard.Criteria.Single(x => x.Code == "TC_DRL");

        Assert.NotEqual(parentCriterionId, clonedParent.Id);
        Assert.NotEqual(childCriterionId, clonedChild.Id);
        Assert.Equal(clonedParent.Id, clonedChild.ParentCriterionId);
    }

    [Fact]
    public async Task PublishAsync_MissingRequiredGroups_ThrowsValidationException()
    {
        var standardSetId = Guid.NewGuid();
        var standardSet = new StandardSet
        {
            Id = standardSetId,
            AcademicYear = "2026-2027",
            Level = AwardLevel.School,
            AwardType = AwardType.Individual,
            Status = StandardSetStatus.Draft,
            Standards =
            [
                new Standard
                {
                    StandardSetId = standardSetId,
                    GroupCode = StandardGroupCode.Ethics,
                    Code = "TC_DAO_DUC",
                    Title = "Đạo đức tốt"
                }
                // Thiếu 4 nhóm còn lại (Study, Fitness, Volunteer, Integration)
            ]
        };

        _standardSetRepo.Items.Add(standardSet);

        var handler = CreatePublishHandler();
        var ex = await Assert.ThrowsAsync<UseCaseException>(() => handler.Handle(new PublishStandardSetCommand(standardSetId), CancellationToken.None));

        Assert.Equal(ApplicationErrorKind.Validation, ex.Kind);
        Assert.Equal("missing_standard_groups", ex.ErrorCode);
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

    private sealed class FakeStandardRepository : IStandardRepository
    {
        public List<Standard> Items { get; } = [];

        public Task<Standard?> GetByIdAsync(Guid id, bool includeCriteria = false, bool tracking = false, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.FirstOrDefault(x => x.Id == id));

        public Task<IReadOnlyList<Standard>> GetByStandardSetIdAsync(Guid standardSetId, bool includeCriteria = false, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Standard>>(Items.Where(x => x.StandardSetId == standardSetId).ToList());

        public Task<bool> ExistsCodeInStandardSetAsync(Guid standardSetId, string code, Guid? excludeId = null, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.Any(x => x.StandardSetId == standardSetId && x.Code == code && x.Id != excludeId));

        public Task AddAsync(Standard standard, CancellationToken cancellationToken = default)
        {
            Items.Add(standard);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(Standard standard, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task RemoveAsync(Standard standard, CancellationToken cancellationToken = default)
        {
            Items.Remove(standard);
            return Task.CompletedTask;
        }

        public Task RemoveRangeAsync(IEnumerable<Standard> standards, CancellationToken cancellationToken = default)
        {
            foreach (var item in standards.ToList()) Items.Remove(item);
            return Task.CompletedTask;
        }
    }

    [Fact]
    public async Task UnpublishAsync_WhenPublishedAndNotInUse_RevertsToDraft()
    {
        var set = new StandardSet
        {
            Id = Guid.NewGuid(),
            AcademicYear = "2026-2027",
            Level = AwardLevel.School,
            AwardType = AwardType.Individual,
            Status = StandardSetStatus.Published,
            PublishedAt = DateTime.UtcNow,
            Version = 1,
            CreatedAt = DateTime.UtcNow
        };
        await _standardSetRepo.AddAsync(set);

        var handler = CreateUnpublishHandler();
        var result = await handler.Handle(new UnpublishStandardSetCommand(set.Id), CancellationToken.None);

        Assert.Equal(StandardSetStatus.Draft, result.Status);
        Assert.Null(result.PublishedAt);
    }

    [Fact]
    public async Task UnpublishAsync_WhenInUseByCampaign_ThrowsConflict()
    {
        var standardSetId = Guid.NewGuid();
        var set = new StandardSet
        {
            Id = standardSetId,
            AcademicYear = "2026-2027",
            Level = AwardLevel.School,
            AwardType = AwardType.Individual,
            Status = StandardSetStatus.Published,
            PublishedAt = DateTime.UtcNow,
            Version = 1,
            CreatedAt = DateTime.UtcNow
        };
        await _standardSetRepo.AddAsync(set);

        _campaignRepo.Items.Add(new Campaign
        {
            Id = Guid.NewGuid(),
            Name = "Chiến dịch 2026",
            StandardSetId = standardSetId,
            SchoolYear = "2026-2027",
            Level = AwardLevel.School,
            AwardType = AwardType.Individual
        });

        var handler = CreateUnpublishHandler();
        var ex = await Assert.ThrowsAsync<UseCaseException>(() => handler.Handle(new UnpublishStandardSetCommand(standardSetId), CancellationToken.None));
        Assert.Equal(ApplicationErrorKind.Conflict, ex.Kind);
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

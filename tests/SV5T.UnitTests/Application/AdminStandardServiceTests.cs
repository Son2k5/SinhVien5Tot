using SV5T.Application.Admin.Services;
using SV5T.Application.Criteria.Abstractions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Standards;
using SV5T.Domain.Standards.Enums;
using Xunit;

namespace SV5T.UnitTests.Application;

public sealed class AdminStandardServiceTests
{
    private readonly FakeStandardSetRepository _standardRepo = new();
    private readonly FakeCriterionRepository _criterionRepo = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly FakeCurrentUser _currentUser = new(Guid.NewGuid());

    private AdminStandardService CreateService() =>
        new(
            _standardRepo,
            _criterionRepo,
            _unitOfWork,
            _currentUser,
            new CreateStandardSetRequestValidator(),
            new UpdateStandardSetRequestValidator(),
            new CreateCriterionRequestValidator(),
            new UpdateCriterionRequestValidator());

    [Fact]
    public async Task CreateAsync_WithoutTemplate_CreatesDraftStandardSet()
    {
        var service = CreateService();
        var request = new CreateStandardSetRequest("2026-2027", AwardLevel.School, AwardType.Individual, null);

        var result = await service.CreateAsync(request);

        Assert.Equal("2026-2027", result.AcademicYear);
        Assert.Equal(StandardSetStatus.Draft, result.Status);
        Assert.Equal(1, result.Version);
        Assert.Null(result.PreviousVersionId);
    }

    [Fact]
    public async Task CreateAsync_WithTemplate_ClonesCriteriaTreeRecursively()
    {
        var sourceStandardId = Guid.NewGuid();
        var parentCriterionId = Guid.NewGuid();
        var childCriterionId = Guid.NewGuid();

        var sourceStandard = new StandardSet
        {
            Id = sourceStandardId,
            AcademicYear = "2025-2026",
            Level = AwardLevel.School,
            AwardType = AwardType.Individual,
            Status = StandardSetStatus.Published,
            Criteria =
            [
                new Criterion
                {
                    Id = parentCriterionId,
                    StandardSetId = sourceStandardId,
                    Type = CriterionType.Group,
                    GroupCode = StandardGroupCode.Ethics,
                    Code = "TC_DAO_DUC",
                    Title = "Đạo đức tốt"
                },
                new Criterion
                {
                    Id = childCriterionId,
                    StandardSetId = sourceStandardId,
                    ParentCriterionId = parentCriterionId,
                    Type = CriterionType.Requirement,
                    Code = "TC_DRL",
                    Title = "Điểm rèn luyện",
                    DefinitionJson = """{"minScore": 80}"""
                }
            ]
        };

        _standardRepo.Items.Add(sourceStandard);

        var service = CreateService();
        var request = new CreateStandardSetRequest("2026-2027", AwardLevel.School, AwardType.Individual, sourceStandardId);

        var result = await service.CreateAsync(request);

        Assert.Equal("2026-2027", result.AcademicYear);
        Assert.Equal(sourceStandardId, result.PreviousVersionId);
        Assert.NotNull(result.Criteria);
        Assert.Equal(2, result.Criteria.Count);

        var clonedParent = result.Criteria.Single(x => x.Code == "TC_DAO_DUC");
        var clonedChild = result.Criteria.Single(x => x.Code == "TC_DRL");

        Assert.NotEqual(parentCriterionId, clonedParent.Id);
        Assert.NotEqual(childCriterionId, clonedChild.Id);
        Assert.Equal(clonedParent.Id, clonedChild.ParentCriterionId);
    }

    [Fact]
    public async Task PublishAsync_MissingRequiredGroups_ThrowsValidationException()
    {
        var standardId = Guid.NewGuid();
        var standard = new StandardSet
        {
            Id = standardId,
            AcademicYear = "2026-2027",
            Level = AwardLevel.School,
            AwardType = AwardType.Individual,
            Status = StandardSetStatus.Draft,
            Criteria =
            [
                new Criterion
                {
                    StandardSetId = standardId,
                    Type = CriterionType.Group,
                    GroupCode = StandardGroupCode.Ethics,
                    Code = "TC_DAO_DUC",
                    Title = "Đạo đức tốt"
                }
                // Thiếu 4 nhóm còn lại (Study, Fitness, Volunteer, Integration)
            ]
        };

        _standardRepo.Items.Add(standard);

        var service = CreateService();
        var ex = await Assert.ThrowsAsync<UseCaseException>(() => service.PublishAsync(standardId));

        Assert.Equal(ApplicationErrorKind.Validation, ex.Kind);
        Assert.Equal("missing_standard_groups", ex.ErrorCode);
    }

    [Fact]
    public async Task AddCriterionAsync_DuplicateCode_ThrowsConflictException()
    {
        var standardId = Guid.NewGuid();
        var standard = new StandardSet
        {
            Id = standardId,
            AcademicYear = "2026-2027",
            Level = AwardLevel.School,
            AwardType = AwardType.Individual,
            Status = StandardSetStatus.Draft
        };

        _standardRepo.Items.Add(standard);
        _criterionRepo.Items.Add(new Criterion
        {
            StandardSetId = standardId,
            Code = "TC01",
            Title = "Tiêu chí 1",
            Type = CriterionType.Requirement,
            DefinitionJson = "{}"
        });

        var service = CreateService();
        var request = new CreateCriterionRequest(
            null,
            CriterionType.Requirement,
            null,
            "TC01",
            "Tiêu chí trùng",
            null,
            1,
            CriterionOperator.All,
            null,
            CriterionEvaluationType.Manual,
            "{}",
            null);

        var ex = await Assert.ThrowsAsync<UseCaseException>(() => service.AddCriterionAsync(standardId, request));

        Assert.Equal(ApplicationErrorKind.Conflict, ex.Kind);
        Assert.Equal("criterion_code_duplicate", ex.ErrorCode);
    }

    private sealed class FakeStandardSetRepository : IStandardSetRepository
    {
        public List<StandardSet> Items { get; } = [];

        public Task<StandardSet?> GetByIdAsync(Guid id, bool includeCriteria = false, bool tracking = false, CancellationToken cancellationToken = default) =>
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

    private sealed class FakeCriterionRepository : ICriterionRepository
    {
        public List<Criterion> Items { get; } = [];

        public Task<Criterion?> GetByIdAsync(Guid id, bool tracking = false, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.FirstOrDefault(x => x.Id == id));

        public Task<IReadOnlyList<Criterion>> GetByStandardSetIdAsync(Guid standardSetId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Criterion>>(Items.Where(x => x.StandardSetId == standardSetId).ToList());

        public Task<bool> ExistsCodeInStandardSetAsync(Guid standardSetId, string code, Guid? excludeId = null, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.Any(x => x.StandardSetId == standardSetId && x.Code == code && x.Id != excludeId));

        public Task AddAsync(Criterion criterion, CancellationToken cancellationToken = default)
        {
            Items.Add(criterion);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(Criterion criterion, CancellationToken cancellationToken = default) =>
            Task.CompletedTask;

        public Task RemoveAsync(Criterion criterion, CancellationToken cancellationToken = default)
        {
            Items.Remove(criterion);
            return Task.CompletedTask;
        }

        public Task RemoveRangeAsync(IEnumerable<Criterion> criteria, CancellationToken cancellationToken = default)
        {
            foreach (var c in criteria.ToList())
            {
                Items.Remove(c);
            }
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

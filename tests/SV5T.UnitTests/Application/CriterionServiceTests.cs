using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Validators;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Criteria.Abstractions;
using SV5T.Application.Criteria.Services;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Criteria;
using SV5T.Domain.Standards;
using SV5T.Domain.Standards.Enums;
using Xunit;

namespace SV5T.UnitTests.Application;

public sealed class CriterionServiceTests
{
    private readonly FakeStandardSetRepository _standardSetRepo = new();
    private readonly FakeStandardRepository _standardRepo = new();
    private readonly FakeCriterionRepository _criterionRepo = new();
    private readonly FakeUnitOfWork _unitOfWork = new();
    private readonly FakeCurrentUser _currentUser = new(Guid.NewGuid());

    private CriterionService CreateService() =>
        new(
            _standardRepo,
            _standardSetRepo,
            _criterionRepo,
            _unitOfWork,
            _currentUser,
            new CreateCriterionRequestValidator(),
            new UpdateCriterionRequestValidator());

    [Fact]
    public async Task AddCriterionAsync_ValidRequest_AddsCriterionSuccessfully()
    {
        var standardSetId = Guid.NewGuid();
        var standardId = Guid.NewGuid();

        var standardSet = new StandardSet
        {
            Id = standardSetId,
            AcademicYear = "2026-2027",
            Level = AwardLevel.School,
            AwardType = AwardType.Individual,
            Status = StandardSetStatus.Draft
        };

        var standard = new Standard
        {
            Id = standardId,
            StandardSetId = standardSetId,
            Code = "TC_DAODUC",
            Title = "Đạo đức tốt"
        };

        _standardSetRepo.Items.Add(standardSet);
        _standardRepo.Items.Add(standard);

        var service = CreateService();
        var request = new CreateCriterionRequest(
            null,
            CriterionType.Requirement,
            "TC_NEW",
            "Tiêu chí mới",
            "Mô tả tiêu chí",
            1,
            CriterionOperator.All,
            null,
            CriterionEvaluationType.Manual,
            "{}",
            "Hướng dẫn duyệt");

        var result = await service.AddCriterionAsync(standardId, request);

        Assert.Equal("TC_NEW", result.Code);
        Assert.Equal("Tiêu chí mới", result.Title);
        Assert.Equal(standardId, result.StandardId);
        Assert.Single(_criterionRepo.Items);
    }

    [Fact]
    public async Task AddCriterionAsync_DuplicateCode_ThrowsConflictException()
    {
        var standardSetId = Guid.NewGuid();
        var standardId = Guid.NewGuid();

        var standardSet = new StandardSet
        {
            Id = standardSetId,
            AcademicYear = "2026-2027",
            Level = AwardLevel.School,
            AwardType = AwardType.Individual,
            Status = StandardSetStatus.Draft
        };

        var standard = new Standard
        {
            Id = standardId,
            StandardSetId = standardSetId,
            Code = "TC_DAODUC",
            Title = "Đạo đức tốt"
        };

        _standardSetRepo.Items.Add(standardSet);
        _standardRepo.Items.Add(standard);
        _criterionRepo.Items.Add(new Criterion
        {
            StandardId = standardId,
            Code = "TC01",
            Title = "Tiêu chí 1",
            Type = CriterionType.Requirement,
            DefinitionJson = "{}"
        });

        var service = CreateService();
        var request = new CreateCriterionRequest(
            null,
            CriterionType.Requirement,
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

    [Fact]
    public async Task DeleteCriterionAsync_DeletesCriterionAndDescendantsRecursively()
    {
        var standardSetId = Guid.NewGuid();
        var standardId = Guid.NewGuid();
        var parentId = Guid.NewGuid();
        var childId = Guid.NewGuid();

        var standardSet = new StandardSet
        {
            Id = standardSetId,
            AcademicYear = "2026-2027",
            Level = AwardLevel.School,
            AwardType = AwardType.Individual,
            Status = StandardSetStatus.Draft
        };

        var standard = new Standard
        {
            Id = standardId,
            StandardSetId = standardSetId,
            Code = "TC_DAODUC",
            Title = "Đạo đức tốt"
        };

        var parent = new Criterion
        {
            Id = parentId,
            StandardId = standardId,
            Code = "PARENT",
            Title = "Parent",
            Type = CriterionType.Group,
            DefinitionJson = "{}"
        };

        var child = new Criterion
        {
            Id = childId,
            StandardId = standardId,
            ParentCriterionId = parentId,
            Code = "CHILD",
            Title = "Child",
            Type = CriterionType.Requirement,
            DefinitionJson = "{}"
        };

        _standardSetRepo.Items.Add(standardSet);
        _standardRepo.Items.Add(standard);
        _criterionRepo.Items.Add(parent);
        _criterionRepo.Items.Add(child);

        var service = CreateService();
        await service.DeleteCriterionAsync(standardId, parentId);

        Assert.Empty(_criterionRepo.Items);
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

    private sealed class FakeCriterionRepository : ICriterionRepository
    {
        public List<Criterion> Items { get; } = [];

        public Task<Criterion?> GetByIdAsync(Guid id, bool tracking = false, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.FirstOrDefault(x => x.Id == id));

        public Task<IReadOnlyList<Criterion>> GetByStandardIdAsync(Guid standardId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Criterion>>(Items.Where(x => x.StandardId == standardId).ToList());

        public Task<IReadOnlyList<Criterion>> GetByStandardSetIdAsync(Guid standardSetId, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Criterion>>(Items);

        public Task<bool> ExistsCodeInStandardAsync(Guid standardId, string code, Guid? excludeId = null, CancellationToken cancellationToken = default) =>
            Task.FromResult(Items.Any(x => x.StandardId == standardId && x.Code == code && x.Id != excludeId));

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

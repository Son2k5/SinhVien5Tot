using System.Text.Json;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Criteria;
using SV5T.Domain.Standards;
using SV5T.Domain.Standards.Enums;
using SV5T.Infrastructure.Options;

namespace SV5T.Infrastructure.Persistence.Repositories.Admin;

public sealed class CachedStandardSetRepository(
    StandardSetRepository innerRepository,
    IConnectionMultiplexer redis,
    IOptions<RedisOptions> redisOptions)
    : IStandardSetRepository
{
    private readonly IDatabase _db = redis.GetDatabase();
    private readonly RedisOptions _redisOptions = redisOptions.Value;
    private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(12);

    private string GetCacheKey(Guid id) => $"{_redisOptions.KeyPrefix}cache:standard-sets:{id}:criteria";

    public async Task<StandardSet?> GetByIdAsync(
        Guid id,
        bool includeStandards = false,
        bool includeCriteria = false,
        bool tracking = false,
        CancellationToken cancellationToken = default)
    {
        // Khi cần tracking, luôn đọc trực tiếp từ Database
        if (tracking)
        {
            return await innerRepository.GetByIdAsync(id, includeStandards, includeCriteria, tracking: true, cancellationToken);
        }

        // Cache chỉ áp dụng cho trường hợp load kèm tiêu chí/tiêu chuẩn (đọc cây tiêu chuẩn đã công bố)
        if (includeCriteria || includeStandards)
        {
            var cacheKey = GetCacheKey(id);
            try
            {
                var cached = await _db.StringGetAsync(cacheKey);
                if (cached.HasValue)
                {
                    var cachedModel = JsonSerializer.Deserialize<CachedStandardSetModel>(cached.ToString()!);
                    if (cachedModel is not null)
                    {
                        return ToEntity(cachedModel);
                    }
                }
            }
            catch
            {
                // Bỏ qua lỗi kết nối Redis để fallback xuống Database
            }

            // Cache miss: Đọc từ Database
            var result = await innerRepository.GetByIdAsync(id, includeStandards: true, includeCriteria: true, tracking: false, cancellationToken);

            // Nếu là bộ tiêu chuẩn đã công bố, lưu vào Redis
            if (result is not null && result.Status == StandardSetStatus.Published)
            {
                try
                {
                    var cacheModel = ToCacheModel(result);
                    await _db.StringSetAsync(
                        cacheKey,
                        JsonSerializer.Serialize(cacheModel),
                        CacheTtl,
                        When.NotExists);
                }
                catch
                {
                    // Bỏ qua lỗi cache để không làm gián đoạn luồng nghiệp vụ chính
                }
            }

            return result;
        }

        return await innerRepository.GetByIdAsync(id, includeStandards: false, includeCriteria: false, tracking: false, cancellationToken);
    }

    public Task<IReadOnlyList<StandardSet>> GetAllAsync(CancellationToken cancellationToken = default) =>
        innerRepository.GetAllAsync(cancellationToken);

    public Task<bool> ExistsByAcademicYearAndLevelAsync(
        string academicYear,
        AwardLevel level,
        AwardType awardType,
        int version,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default) =>
        innerRepository.ExistsByAcademicYearAndLevelAsync(academicYear, level, awardType, version, excludeId, cancellationToken);

    public Task AddAsync(StandardSet standardSet, CancellationToken cancellationToken = default) =>
        innerRepository.AddAsync(standardSet, cancellationToken);

    public async Task UpdateAsync(StandardSet standardSet, CancellationToken cancellationToken = default)
    {
        await innerRepository.UpdateAsync(standardSet, cancellationToken);
        // Invalidate cache ngay lập tức khi cập nhật hoặc publish
        try
        {
            await _db.KeyDeleteAsync(GetCacheKey(standardSet.Id));
        }
        catch
        {
            // Bỏ qua lỗi kết nối redis khi invalidate
        }
    }

    public async Task RemoveAsync(StandardSet standardSet, CancellationToken cancellationToken = default)
    {
        await innerRepository.RemoveAsync(standardSet, cancellationToken);
        try
        {
            await _db.KeyDeleteAsync(GetCacheKey(standardSet.Id));
        }
        catch
        {
            // Bỏ qua lỗi kết nối redis
        }
    }

    private static CachedStandardSetModel ToCacheModel(StandardSet set) =>
        new(
            set.Id,
            set.Name,
            set.AcademicYear,
            set.Level,
            set.AwardType,
            set.Status,
            set.Version,
            set.PreviousVersionId,
            set.CreatedAt,
            set.CreatedBy,
            set.UpdatedAt,
            set.UpdatedBy,
            set.PublishedAt,
            set.Standards.Select(s => new CachedStandardModel(
                s.Id,
                s.StandardSetId,
                s.GroupCode,
                s.Code,
                s.Title,
                s.Description,
                s.DisplayOrder,
                s.Operator,
                s.MinimumSatisfied,
                s.CreatedAt,
                s.CreatedBy,
                s.UpdatedAt,
                s.UpdatedBy,
                s.Criteria.Select(c => new CachedCriterionModel(
                    c.Id,
                    c.StandardId,
                    c.ParentCriterionId,
                    c.Type,
                    c.Code,
                    c.Title,
                    c.Description,
                    c.DisplayOrder,
                    c.Operator,
                    c.MinimumSatisfied,
                    c.EvaluationType,
                    c.DefinitionJson,
                    c.ReviewGuidance,
                    c.CreatedAt,
                    c.CreatedBy,
                    c.UpdatedAt,
                    c.UpdatedBy)).ToList())).ToList());

    private static StandardSet ToEntity(CachedStandardSetModel model)
    {
        var set = new StandardSet
        {
            Id = model.Id,
            Name = model.Name,
            AcademicYear = model.AcademicYear,
            Level = model.Level,
            AwardType = model.AwardType,
            Status = model.Status,
            Version = model.Version,
            PreviousVersionId = model.PreviousVersionId,
            CreatedAt = model.CreatedAt,
            CreatedBy = model.CreatedBy,
            UpdatedAt = model.UpdatedAt,
            UpdatedBy = model.UpdatedBy,
            PublishedAt = model.PublishedAt
        };

        var standardsList = model.Standards.Select(s =>
        {
            var standard = new Standard
            {
                Id = s.Id,
                StandardSetId = s.StandardSetId,
                GroupCode = s.GroupCode,
                Code = s.Code,
                Title = s.Title,
                Description = s.Description,
                DisplayOrder = s.DisplayOrder,
                Operator = s.Operator,
                MinimumSatisfied = s.MinimumSatisfied,
                CreatedAt = s.CreatedAt,
                CreatedBy = s.CreatedBy,
                UpdatedAt = s.UpdatedAt,
                UpdatedBy = s.UpdatedBy
            };

            standard.Criteria = s.Criteria.Select(c => new Criterion
            {
                Id = c.Id,
                StandardId = c.StandardId,
                ParentCriterionId = c.ParentCriterionId,
                Type = c.Type,
                Code = c.Code,
                Title = c.Title,
                Description = c.Description,
                DisplayOrder = c.DisplayOrder,
                Operator = c.Operator,
                MinimumSatisfied = c.MinimumSatisfied,
                EvaluationType = c.EvaluationType,
                DefinitionJson = c.DefinitionJson,
                ReviewGuidance = c.ReviewGuidance,
                CreatedAt = c.CreatedAt,
                CreatedBy = c.CreatedBy,
                UpdatedAt = c.UpdatedAt,
                UpdatedBy = c.UpdatedBy
            }).ToList();

            return standard;
        }).ToList();

        set.Standards = standardsList;
        return set;
    }

    private sealed record CachedStandardSetModel(
        Guid Id,
        string Name,
        string AcademicYear,
        AwardLevel Level,
        AwardType AwardType,
        StandardSetStatus Status,
        int Version,
        Guid? PreviousVersionId,
        DateTime CreatedAt,
        string? CreatedBy,
        DateTime? UpdatedAt,
        string? UpdatedBy,
        DateTime? PublishedAt,
        List<CachedStandardModel> Standards);

    private sealed record CachedStandardModel(
        Guid Id,
        Guid StandardSetId,
        StandardGroupCode? GroupCode,
        string Code,
        string Title,
        string? Description,
        int DisplayOrder,
        CriterionOperator Operator,
        int? MinimumSatisfied,
        DateTime CreatedAt,
        string? CreatedBy,
        DateTime? UpdatedAt,
        string? UpdatedBy,
        List<CachedCriterionModel> Criteria);

    private sealed record CachedCriterionModel(
        Guid Id,
        Guid StandardId,
        Guid? ParentCriterionId,
        CriterionType Type,
        string Code,
        string Title,
        string? Description,
        int DisplayOrder,
        CriterionOperator Operator,
        int? MinimumSatisfied,
        CriterionEvaluationType EvaluationType,
        string DefinitionJson,
        string? ReviewGuidance,
        DateTime CreatedAt,
        string? CreatedBy,
        DateTime? UpdatedAt,
        string? UpdatedBy);
}

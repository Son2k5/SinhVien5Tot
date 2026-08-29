using System.Text.Json;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Services;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Awards.Enums;
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
        bool includeCriteria = false,
        bool tracking = false,
        CancellationToken cancellationToken = default)
    {
        // Khi cần tracking, luôn đọc trực tiếp từ Database
        if (tracking)
        {
            return await innerRepository.GetByIdAsync(id, includeCriteria, tracking: true, cancellationToken);
        }

        // Đọc từ Database
        var result = await innerRepository.GetByIdAsync(id, includeCriteria, tracking: false, cancellationToken);

        // Nếu là bộ tiêu chuẩn đã công bố và có lấy kèm tiêu chí, cache DTO phẳng vào Redis
        if (result is not null && result.Status == StandardSetStatus.Published && includeCriteria)
        {
            var cacheKey = GetCacheKey(id);
            try
            {
                var responseDto = AdminStandardService.MapToResponse(result, includeCriteria: true);
                await _db.StringSetAsync(
                    cacheKey,
                    JsonSerializer.Serialize(responseDto),
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
}

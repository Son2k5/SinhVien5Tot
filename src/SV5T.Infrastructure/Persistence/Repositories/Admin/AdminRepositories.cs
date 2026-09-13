using Microsoft.EntityFrameworkCore;
using SV5T.Application.Campaigns.Abstractions;
using SV5T.Application.Common.Models;
using SV5T.Application.Criteria.Abstractions;
using SV5T.Application.Evidences.Abstractions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Campaigns.Enums;
using SV5T.Domain.Criteria;
using SV5T.Domain.Evidences;
using SV5T.Domain.Standards;
using SV5T.Domain.Submissions;
using SV5T.Domain.Submissions.Enums;
using SV5T.Infrastructure.Persistence.Context;

namespace SV5T.Infrastructure.Persistence.Repositories.Admin;

public sealed class StandardSetRepository(ApplicationDbContext dbContext)
    : IStandardSetRepository
{
    public Task<StandardSet?> GetByIdAsync(
        Guid id,
        bool includeStandards = false,
        bool includeCriteria = false,
        bool tracking = false,
        CancellationToken cancellationToken = default)
    {
        IQueryable<StandardSet> query = dbContext.StandardSets;

        if (includeCriteria)
        {
            query = query.Include(x => x.Standards).ThenInclude(x => x.Criteria);
        }
        else if (includeStandards)
        {
            query = query.Include(x => x.Standards);
        }

        if (!tracking)
        {
            query = query.AsNoTracking();
        }

        return query.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<StandardSet>> GetAllAsync(
        CancellationToken cancellationToken = default) =>
        await dbContext.StandardSets
            .AsNoTracking()
            .OrderByDescending(x => x.AcademicYear)
            .ThenBy(x => x.Level)
            .ThenBy(x => x.AwardType)
            .ThenByDescending(x => x.Version)
            .ToListAsync(cancellationToken);

    public Task<bool> ExistsByAcademicYearAndLevelAsync(
        string academicYear,
        AwardLevel level,
        AwardType awardType,
        int version,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.StandardSets
            .AsNoTracking()
            .Where(x => x.AcademicYear == academicYear && x.Level == level && x.AwardType == awardType && x.Version == version);

        if (excludeId.HasValue)
        {
            query = query.Where(x => x.Id != excludeId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }

    public Task AddAsync(
        StandardSet standardSet,
        CancellationToken cancellationToken = default) =>
        dbContext.StandardSets.AddAsync(standardSet, cancellationToken).AsTask();

    public Task UpdateAsync(
        StandardSet standardSet,
        CancellationToken cancellationToken = default)
    {
        dbContext.StandardSets.Update(standardSet);
        return Task.CompletedTask;
    }

    public Task RemoveAsync(
        StandardSet standardSet,
        CancellationToken cancellationToken = default)
    {
        dbContext.StandardSets.Remove(standardSet);
        return Task.CompletedTask;
    }
}

public sealed class StandardRepository(ApplicationDbContext dbContext)
    : IStandardRepository
{
    public Task<Standard?> GetByIdAsync(
        Guid id,
        bool includeCriteria = false,
        bool tracking = false,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Standards.AsQueryable();

        if (includeCriteria)
        {
            query = query.Include(x => x.Criteria);
        }

        if (!tracking)
        {
            query = query.AsNoTracking();
        }

        return query.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Standard>> GetByStandardSetIdAsync(
        Guid standardSetId,
        bool includeCriteria = false,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Standards.AsQueryable();

        if (includeCriteria)
        {
            query = query.Include(x => x.Criteria);
        }

        return await query
            .AsNoTracking()
            .Where(x => x.StandardSetId == standardSetId)
            .OrderBy(x => x.DisplayOrder)
            .ToListAsync(cancellationToken);
    }

    public Task<bool> ExistsCodeInStandardSetAsync(
        Guid standardSetId,
        string code,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Standards
            .AsNoTracking()
            .Where(x => x.StandardSetId == standardSetId && x.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(x => x.Id != excludeId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }

    public Task AddAsync(Standard standard, CancellationToken cancellationToken = default) =>
        dbContext.Standards.AddAsync(standard, cancellationToken).AsTask();

    public Task UpdateAsync(Standard standard, CancellationToken cancellationToken = default)
    {
        dbContext.Standards.Update(standard);
        return Task.CompletedTask;
    }

    public Task RemoveAsync(Standard standard, CancellationToken cancellationToken = default)
    {
        dbContext.Standards.Remove(standard);
        return Task.CompletedTask;
    }

    public Task RemoveRangeAsync(IEnumerable<Standard> standards, CancellationToken cancellationToken = default)
    {
        dbContext.Standards.RemoveRange(standards);
        return Task.CompletedTask;
    }
}

public sealed class CriterionRepository(ApplicationDbContext dbContext)
    : ICriterionRepository
{
    public Task<Criterion?> GetByIdAsync(
        Guid id,
        bool tracking = false,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Criteria.AsQueryable();

        if (!tracking)
        {
            query = query.AsNoTracking();
        }

        return query.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Criterion>> GetByStandardIdAsync(
        Guid standardId,
        CancellationToken cancellationToken = default) =>
        await dbContext.Criteria
            .AsNoTracking()
            .Where(x => x.StandardId == standardId)
            .OrderBy(x => x.DisplayOrder)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Criterion>> GetByStandardSetIdAsync(
        Guid standardSetId,
        CancellationToken cancellationToken = default) =>
        await dbContext.Criteria
            .AsNoTracking()
            .Where(x => x.Standard.StandardSetId == standardSetId)
            .OrderBy(x => x.DisplayOrder)
            .ToListAsync(cancellationToken);

    public Task<bool> ExistsCodeInStandardAsync(
        Guid standardId,
        string code,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Criteria
            .AsNoTracking()
            .Where(x => x.StandardId == standardId && x.Code == code);

        if (excludeId.HasValue)
        {
            query = query.Where(x => x.Id != excludeId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }

    public Task AddAsync(Criterion criterion, CancellationToken cancellationToken = default) =>
        dbContext.Criteria.AddAsync(criterion, cancellationToken).AsTask();

    public Task UpdateAsync(Criterion criterion, CancellationToken cancellationToken = default)
    {
        dbContext.Criteria.Update(criterion);
        return Task.CompletedTask;
    }

    public Task RemoveAsync(Criterion criterion, CancellationToken cancellationToken = default)
    {
        dbContext.Criteria.Remove(criterion);
        return Task.CompletedTask;
    }

    public Task RemoveRangeAsync(IEnumerable<Criterion> criteria, CancellationToken cancellationToken = default)
    {
        dbContext.Criteria.RemoveRange(criteria);
        return Task.CompletedTask;
    }
}

public sealed class CampaignRepository(ApplicationDbContext dbContext)
    : ICampaignRepository
{
    public Task<Campaign?> GetByIdAsync(
        Guid id,
        bool includeDetails = false,
        bool tracking = false,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Campaign> query = dbContext.Campaigns;

        if (includeDetails)
        {
            query = query
                .Include(x => x.StandardSet)
                .Include(x => x.PrerequisiteCampaign)
                .Include(x => x.Applications);
        }

        if (!tracking)
        {
            query = query.AsNoTracking();
        }

        return query.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Campaign>> GetAllAsync(
        AwardLevel? level = null,
        CampaignStatus? status = null,
        string? schoolYear = null,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Campaign> query = dbContext.Campaigns
            .AsNoTracking()
            .Include(x => x.StandardSet)
            .Include(x => x.PrerequisiteCampaign);

        if (level.HasValue)
        {
            query = query.Where(x => x.Level == level.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(x => x.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(schoolYear))
        {
            query = query.Where(x => x.SchoolYear == schoolYear);
        }

        return await query
            .OrderByDescending(x => x.SchoolYear)
            .ThenByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<PagedResult<Campaign>> GetPagedAsync(
        AwardLevel? level,
        CampaignStatus? status,
        string? schoolYear,
        int pageIndex,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Campaign> filtered = dbContext.Campaigns.AsNoTracking();

        if (level.HasValue)
        {
            filtered = filtered.Where(x => x.Level == level.Value);
        }

        if (status.HasValue)
        {
            filtered = filtered.Where(x => x.Status == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(schoolYear))
        {
            filtered = filtered.Where(x => x.SchoolYear == schoolYear);
        }

        var totalCount = await filtered.CountAsync(cancellationToken);

        var items = await filtered
            .Include(x => x.StandardSet)
            .Include(x => x.PrerequisiteCampaign)
            .OrderByDescending(x => x.SchoolYear)
            .ThenByDescending(x => x.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Campaign>(items, totalCount, pageIndex, pageSize);
    }

    public Task<bool> ExistsByNameAndSchoolYearAsync(
        string name,
        string schoolYear,
        Guid? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Campaigns
            .AsNoTracking()
            .Where(x => x.Name == name && x.SchoolYear == schoolYear);

        if (excludeId.HasValue)
        {
            query = query.Where(x => x.Id != excludeId.Value);
        }

        return query.AnyAsync(cancellationToken);
    }

    public Task AddAsync(Campaign campaign, CancellationToken cancellationToken = default) =>
        dbContext.Campaigns.AddAsync(campaign, cancellationToken).AsTask();

    public Task UpdateAsync(Campaign campaign, CancellationToken cancellationToken = default)
    {
        dbContext.Campaigns.Update(campaign);
        return Task.CompletedTask;
    }

    public Task RemoveAsync(Campaign campaign, CancellationToken cancellationToken = default)
    {
        dbContext.Campaigns.Remove(campaign);
        return Task.CompletedTask;
    }
}

public sealed class EvidenceRepository(ApplicationDbContext dbContext)
    : IEvidenceRepository
{
    public Task<Evidence?> GetByIdAsync(
        Guid id,
        bool tracking = false,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Evidence> query = dbContext.Evidences
            .Include(x => x.Application)
                .ThenInclude(x => x.Campaign)
            .Include(x => x.Criterion)
            .Include(x => x.EvidenceTypeTemplate);

        if (!tracking)
        {
            query = query.AsNoTracking();
        }

        return query.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<PagedResult<Evidence>> GetPagedAsync(
        Guid? campaignId,
        EvidenceStatus? status,
        Guid? applicationId,
        int pageIndex,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        IQueryable<Evidence> filtered = dbContext.Evidences.AsNoTracking();

        if (campaignId.HasValue)
        {
            filtered = filtered.Where(x => x.Application.CampaignId == campaignId.Value);
        }

        if (status.HasValue)
        {
            filtered = filtered.Where(x => x.Status == status.Value);
        }

        if (applicationId.HasValue)
        {
            filtered = filtered.Where(x => x.ApplicationId == applicationId.Value);
        }

        var totalCount = await filtered.CountAsync(cancellationToken);

        var items = await filtered
            .Include(x => x.Application)
                .ThenInclude(x => x.Campaign)
            .Include(x => x.Criterion)
            .Include(x => x.EvidenceTypeTemplate)
            .OrderByDescending(x => x.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<Evidence>(items, totalCount, pageIndex, pageSize);
    }

    public Task UpdateAsync(Evidence evidence, CancellationToken cancellationToken = default)
    {
        dbContext.Evidences.Update(evidence);
        return Task.CompletedTask;
    }

    public Task AddReviewLogAsync(
        ReviewLog reviewLog,
        CancellationToken cancellationToken = default) =>
        dbContext.ReviewLogs.AddAsync(reviewLog, cancellationToken).AsTask();
}

using Microsoft.EntityFrameworkCore;
using SV5T.Application.Common.Models;
using SV5T.Application.Student.Abstractions;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Campaigns.Enums;
using SV5T.Infrastructure.Persistence.Context;

namespace SV5T.Infrastructure.Persistence.Repositories.Student;

public sealed class StudentCampaignRepository(ApplicationDbContext db) : IStudentCampaignRepository
{
    public Task<Campaign?> GetByIdAsync(
        Guid id, bool includeDetails = false, CancellationToken cancellationToken = default)
    {
        IQueryable<Campaign> q = db.Campaigns.AsNoTracking();
        q = includeDetails
            ? q.Include(c => c.StandardSet).Include(c => c.PrerequisiteCampaign)
            : q.Include(c => c.StandardSet);
        return q.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<IReadOnlyList<Campaign>> GetOpenAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        return await db.Campaigns.AsNoTracking()
            .Include(c => c.StandardSet)
            .Where(c => c.Status == CampaignStatus.Open && now >= c.RegOpenAt && now <= c.RegCloseAt)
            .OrderBy(c => c.RegCloseAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<PagedResult<Campaign>> GetOpenPagedAsync(
        int pageIndex, int pageSize, CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var filtered = db.Campaigns.AsNoTracking()
            .Where(c => c.Status == CampaignStatus.Open && now >= c.RegOpenAt && now <= c.RegCloseAt);
        var total = await filtered.CountAsync(cancellationToken);
        var items = await filtered
            .Include(c => c.StandardSet)
            .OrderBy(c => c.RegCloseAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return new PagedResult<Campaign>(items, total, pageIndex, pageSize);
    }
}

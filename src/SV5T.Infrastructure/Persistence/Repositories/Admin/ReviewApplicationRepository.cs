using Microsoft.EntityFrameworkCore;
using SV5T.Application.Admin.Applications;
using SV5T.Application.Common.Models;
using SV5T.Domain.Submissions;
using SV5T.Domain.Submissions.Enums;
using SV5T.Infrastructure.Persistence.Context;
using SubmissionApplication = SV5T.Domain.Submissions.Application;

namespace SV5T.Infrastructure.Persistence.Repositories.Admin;

public sealed class ReviewApplicationRepository(ApplicationDbContext db) : IReviewApplicationRepository
{
    public async Task<PagedResult<SubmissionApplication>> GetSubmittedPagedAsync(Guid? campaignId,
        SubmissionStatus? status, int pageIndex, int pageSize, CancellationToken ct)
    {
        var query = db.Applications.AsNoTracking().Where(a => a.SubmittedAt != null);
        if (campaignId.HasValue) query = query.Where(a => a.CampaignId == campaignId.Value);
        if (status.HasValue) query = query.Where(a => a.Status == status.Value);
        var total = await query.CountAsync(ct);
        var items = await query.Include(a => a.Campaign)
            .Include(a => a.Evidences).ThenInclude(e => e.Criterion).ThenInclude(c => c.Standard)
            .OrderByDescending(a => a.SubmittedAt).ThenBy(a => a.Id)
            .Skip((pageIndex - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<SubmissionApplication>(items, total, pageIndex, pageSize);
    }

    public Task<SubmissionApplication?> GetByIdAsync(Guid id, bool tracking, CancellationToken ct)
    {
        IQueryable<SubmissionApplication> query = db.Applications.Include(a => a.Campaign)
            .Include(a => a.Evidences).ThenInclude(e => e.Criterion).ThenInclude(c => c.Standard);
        if (!tracking) query = query.AsNoTracking();
        return query.FirstOrDefaultAsync(a => a.Id == id, ct);
    }

    public Task AddReviewLogAsync(ReviewLog log, CancellationToken ct) =>
        db.ReviewLogs.AddAsync(log, ct).AsTask();
}

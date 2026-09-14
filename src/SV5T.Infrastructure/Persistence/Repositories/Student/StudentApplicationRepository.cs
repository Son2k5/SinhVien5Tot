using Microsoft.EntityFrameworkCore;
using SV5T.Application.Common.Models;
using SV5T.Application.Student.Abstractions;
using SV5T.Domain.Submissions;
using SV5T.Infrastructure.Persistence.Context;
using SubmissionApplication = SV5T.Domain.Submissions.Application;

namespace SV5T.Infrastructure.Persistence.Repositories.Student;

public sealed class StudentApplicationRepository(ApplicationDbContext db) : IStudentApplicationRepository
{
    public Task<SubmissionApplication?> GetByIdAsync(
        Guid id, bool tracking = false, CancellationToken cancellationToken = default)
    {
        IQueryable<SubmissionApplication> q = db.Applications
            .Include(a => a.Campaign)
            .Include(a => a.Evidences);
        if (!tracking)
        {
            q = q.AsNoTracking();
        }

        return q.FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public Task<SubmissionApplication?> GetByIdForUserAsync(
        Guid id, Guid userId, bool tracking = false, CancellationToken cancellationToken = default)
    {
        IQueryable<SubmissionApplication> q = db.Applications
            .Include(a => a.Campaign)
            .Include(a => a.Evidences);
        if (!tracking)
        {
            q = q.AsNoTracking();
        }

        return q.FirstOrDefaultAsync(a => a.Id == id && a.ApplicantUserId == userId, cancellationToken);
    }

    public Task<SubmissionApplication?> GetByCampaignAndUserAsync(
        Guid campaignId, Guid userId, bool tracking = false, CancellationToken cancellationToken = default)
    {
        IQueryable<SubmissionApplication> q = db.Applications.Include(a => a.Campaign);
        if (!tracking)
        {
            q = q.AsNoTracking();
        }

        return q.FirstOrDefaultAsync(
            a => a.CampaignId == campaignId && a.ApplicantUserId == userId, cancellationToken);
    }

    public async Task<IReadOnlyList<SubmissionApplication>> GetByUserAsync(
        Guid userId, CancellationToken cancellationToken = default) =>
        await db.Applications.AsNoTracking()
            .Include(a => a.Campaign)
            .Include(a => a.Evidences)
            .Where(a => a.ApplicantUserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<PagedResult<SubmissionApplication>> GetPagedByUserAsync(
        Guid userId, int pageIndex, int pageSize, CancellationToken cancellationToken = default)
    {
        var filtered = db.Applications.AsNoTracking().Where(a => a.ApplicantUserId == userId);
        var total = await filtered.CountAsync(cancellationToken);
        var items = await filtered
            .Include(a => a.Campaign)
            .Include(a => a.Evidences)
            .OrderByDescending(a => a.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        return new PagedResult<SubmissionApplication>(items, total, pageIndex, pageSize);
    }

    public Task AddAsync(SubmissionApplication application, CancellationToken cancellationToken = default) =>
        db.Applications.AddAsync(application, cancellationToken).AsTask();

    public Task AddReviewLogAsync(ReviewLog reviewLog, CancellationToken cancellationToken = default) =>
        db.ReviewLogs.AddAsync(reviewLog, cancellationToken).AsTask();
}

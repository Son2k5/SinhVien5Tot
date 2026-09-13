using Microsoft.EntityFrameworkCore;
using SV5T.Application.Admin.Students.Abstractions;
using SV5T.Application.Common.Models;
using SV5T.Domain.Evidences;
using SV5T.Domain.Submissions;
using SV5T.Domain.Users;
using SV5T.Domain.Users.Enums;
using SV5T.Infrastructure.Persistence.Context;
using SubmissionApplication = SV5T.Domain.Submissions.Application;

namespace SV5T.Infrastructure.Persistence.Repositories.Admin;

public sealed class AdminStudentRepository(ApplicationDbContext db) : IAdminStudentRepository
{
    public async Task<PagedResult<User>> GetPagedAsync(AdminStudentFilter f, CancellationToken ct = default)
    {
        IQueryable<User> q = db.Users.AsNoTracking().Include(u => u.Profile).Where(u => u.Role == Role.User);

        if (!f.IncludeDeleted)
        {
            q = q.Where(u => !u.IsDeleted);
        }

        if (!string.IsNullOrWhiteSpace(f.Search))
        {
            var s = f.Search.Trim();
            q = q.Where(u =>
                u.Email.Contains(s)
                || (u.Profile != null && (u.Profile.FullName.Contains(s) || u.Profile.StudentCode.Contains(s)))
            );
        }

        if (!string.IsNullOrWhiteSpace(f.Faculty))
        {
            q = q.Where(u => u.Profile != null && u.Profile.Faculty == f.Faculty);
        }

        if (!string.IsNullOrWhiteSpace(f.Major))
        {
            q = q.Where(u => u.Profile != null && u.Profile.Major == f.Major);
        }

        if (!string.IsNullOrWhiteSpace(f.AdministrativeClass))
        {
            q = q.Where(u => u.Profile != null && u.Profile.AdministrativeClass == f.AdministrativeClass);
        }

        if (f.AcademicYear.HasValue)
        {
            q = q.Where(u => u.Profile != null && u.Profile.AcademicYear == f.AcademicYear.Value);
        }

        if (!string.IsNullOrWhiteSpace(f.School))
        {
            q = q.Where(u => u.Profile != null && u.Profile.School == f.School);
        }

        if (!string.IsNullOrWhiteSpace(f.SchoolYear))
        {
            var y = f.SchoolYear;
            q = q.Where(u => db.Applications.Any(a => a.ApplicantUserId == u.Id && a.Campaign.SchoolYear == y));
        }

        if (f.IsActive.HasValue)
        {
            q = q.Where(u => u.IsActive == f.IsActive.Value);
        }

        if (f.IsVerified.HasValue)
        {
            q = q.Where(u => u.IsVerified == f.IsVerified.Value);
        }

        var desc = string.Equals(f.SortDir, "desc", StringComparison.OrdinalIgnoreCase);
        var sort = (f.SortBy ?? "createdAt").Trim().ToLowerInvariant();

        q = sort switch
        {
            "fullname" => desc ? q.OrderByDescending(u => u.Profile!.FullName) : q.OrderBy(u => u.Profile!.FullName),
            "studentcode" => desc
                ? q.OrderByDescending(u => u.Profile!.StudentCode)
                : q.OrderBy(u => u.Profile!.StudentCode),
            "email" => desc ? q.OrderByDescending(u => u.Email) : q.OrderBy(u => u.Email),
            _ => desc ? q.OrderByDescending(u => u.CreatedAt) : q.OrderBy(u => u.CreatedAt),
        };

        var total = await q.CountAsync(ct);
        var items = await q.Skip((f.PageIndex - 1) * f.PageSize).Take(f.PageSize).ToListAsync(ct);

        return new PagedResult<User>(items, total, f.PageIndex, f.PageSize);
    }

    public Task<User?> GetByIdAsync(
        Guid id,
        bool tracking = false,
        bool includeDeleted = false,
        CancellationToken ct = default
    )
    {
        IQueryable<User> q = db.Users.Include(u => u.Profile).Include(u => u.Addresses);

        if (!tracking)
        {
            q = q.AsNoTracking();
        }

        if (!includeDeleted)
        {
            q = q.Where(u => !u.IsDeleted);
        }

        return q.FirstOrDefaultAsync(u => u.Id == id, ct);
    }

    public async Task<IReadOnlyList<User>> GetByIdsAsync(
        IEnumerable<Guid> ids,
        bool tracking = false,
        bool includeDeleted = false,
        CancellationToken ct = default
    )
    {
        IQueryable<User> q = db.Users.Include(u => u.Profile).Include(u => u.Addresses);

        if (!tracking)
        {
            q = q.AsNoTracking();
        }

        if (!includeDeleted)
        {
            q = q.Where(u => !u.IsDeleted);
        }

        var idList = ids.ToList();
        return await q.Where(u => idList.Contains(u.Id)).ToListAsync(ct);
    }

    public async Task<IReadOnlyList<SubmissionApplication>> GetApplicationsAsync(
        Guid sid,
        CancellationToken ct = default
    )
    {
        return await db
            .Applications.AsNoTracking()
            .Include(a => a.Campaign)
            .Include(a => a.Evidences)
            .Where(a => a.ApplicantUserId == sid)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Evidence>> GetEvidencesAsync(Guid sid, CancellationToken ct = default)
    {
        return await db
            .Evidences.AsNoTracking()
            .Include(e => e.Application)
                .ThenInclude(a => a!.Campaign)
            .Include(e => e.Criterion)
                .ThenInclude(c => c!.Standard)
            .Where(e => e.Application.ApplicantUserId == sid)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<ReviewLog>> GetReviewLogsAsync(Guid sid, CancellationToken ct = default)
    {
        return await db
            .ReviewLogs.AsNoTracking()
            .Where(l => l.Application.ApplicantUserId == sid)
            .OrderByDescending(l => l.CreatedAt)
            .ToListAsync(ct);
    }

    public Task<Evidence?> GetEvidenceForStudentAsync(
        Guid sid,
        Guid eid,
        bool tracking = false,
        CancellationToken ct = default
    )
    {
        IQueryable<Evidence> q = db
            .Evidences.Include(e => e.Application)
                .ThenInclude(a => a!.Campaign)
            .Include(e => e.Criterion)
                .ThenInclude(c => c!.Standard);

        if (!tracking)
        {
            q = q.AsNoTracking();
        }

        return q.FirstOrDefaultAsync(e => e.Id == eid && e.Application.ApplicantUserId == sid, ct);
    }

    public Task AddReviewLogAsync(ReviewLog l, CancellationToken ct = default)
    {
        return db.ReviewLogs.AddAsync(l, ct).AsTask();
    }
}

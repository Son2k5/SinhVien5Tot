using Microsoft.EntityFrameworkCore;
using SV5T.Application.Student.Abstractions;
using SV5T.Domain.Criteria;
using SV5T.Domain.Evidences;
using SV5T.Domain.Standards;
using SV5T.Infrastructure.Persistence.Context;

namespace SV5T.Infrastructure.Persistence.Repositories.Student;

public sealed class StudentCriterionRepository(ApplicationDbContext db) : IStudentCriterionRepository
{
    public Task<Criterion?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.Criteria.AsNoTracking()
            .Include(c => c.Standard)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Criterion>> GetRequirementsByStandardSetIdAsync(
        Guid standardSetId, CancellationToken cancellationToken = default) =>
        await db.Criteria.AsNoTracking()
            .Include(c => c.Standard)
            .Where(c => c.Standard.StandardSetId == standardSetId)
            .OrderBy(c => c.DisplayOrder)
            .ToListAsync(cancellationToken);
}

public sealed class StudentEvidenceRepository(ApplicationDbContext db) : IStudentEvidenceRepository
{
    public Task<Evidence?> GetByIdAsync(
        Guid id, bool tracking = false, CancellationToken cancellationToken = default)
    {
        IQueryable<Evidence> q = db.Evidences
            .Include(e => e.Application).ThenInclude(a => a!.Campaign)
            .Include(e => e.Criterion).ThenInclude(c => c!.Standard);
        if (!tracking)
        {
            q = q.AsNoTracking();
        }

        return q.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public Task<Evidence?> GetByIdForUserAsync(
        Guid id, Guid userId, bool tracking = false, CancellationToken cancellationToken = default)
    {
        IQueryable<Evidence> q = db.Evidences
            .Include(e => e.Application).ThenInclude(a => a!.Campaign)
            .Include(e => e.Criterion).ThenInclude(c => c!.Standard);
        if (!tracking)
        {
            q = q.AsNoTracking();
        }

        return q.FirstOrDefaultAsync(e => e.Id == id && e.Application.ApplicantUserId == userId, cancellationToken);
    }

    public Task<Evidence?> GetByApplicationAndCriterionAsync(
        Guid applicationId, Guid criterionId, bool tracking = false, CancellationToken cancellationToken = default)
    {
        IQueryable<Evidence> q = db.Evidences.Include(e => e.Criterion).ThenInclude(c => c!.Standard);
        if (!tracking)
        {
            q = q.AsNoTracking();
        }

        return q.FirstOrDefaultAsync(
            e => e.ApplicationId == applicationId && e.CriterionId == criterionId, cancellationToken);
    }

    public async Task<IReadOnlyList<Evidence>> GetByApplicationAsync(
        Guid applicationId, CancellationToken cancellationToken = default) =>
        await db.Evidences.AsNoTracking()
            .Include(e => e.Criterion).ThenInclude(c => c!.Standard)
            .Where(e => e.ApplicationId == applicationId)
            .OrderBy(e => e.CreatedAt)
            .ToListAsync(cancellationToken);

    public async Task<IReadOnlyList<Evidence>> GetByApplicationForUserAsync(
        Guid applicationId, Guid userId, CancellationToken cancellationToken = default) =>
        await db.Evidences.AsNoTracking()
            .Include(e => e.Criterion).ThenInclude(c => c!.Standard)
            .Where(e => e.ApplicationId == applicationId && e.Application.ApplicantUserId == userId)
            .OrderBy(e => e.CreatedAt)
            .ToListAsync(cancellationToken);

    public Task AddAsync(Evidence evidence, CancellationToken cancellationToken = default) =>
        db.Evidences.AddAsync(evidence, cancellationToken).AsTask();
}

public sealed class StudentStandardSetRepository(ApplicationDbContext db) : IStudentStandardSetRepository
{
    public Task<StandardSet?> GetByIdWithCriteriaAsync(Guid id, CancellationToken cancellationToken = default) =>
        db.StandardSets.AsNoTracking()
            .Include(s => s.Standards).ThenInclude(s => s.Criteria)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
}

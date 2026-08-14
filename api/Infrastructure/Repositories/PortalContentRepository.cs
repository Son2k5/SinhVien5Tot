using Microsoft.EntityFrameworkCore;
using SV5T.Application.Interfaces.Repositories;
using SV5T.Domain.Entities;
using SV5T.Infrastructure.Persistence;

namespace SV5T.Infrastructure.Repositories;

public sealed class PortalContentRepository(ApplicationDbContext dbContext)
    : IPortalContentRepository
{
    public async Task<IReadOnlyList<PortalContent>> GetPublishedAsync(
        DateTime nowUtc,
        int limit,
        CancellationToken cancellationToken = default)
    {
        var safeLimit = Math.Clamp(limit, 1, 50);
        return await dbContext.PortalContents
            .AsNoTracking()
            .Where(content =>
                content.IsPublished &&
                content.PublishedAtUtc <= nowUtc &&
                (!content.ExpiresAtUtc.HasValue || content.ExpiresAtUtc > nowUtc))
            .OrderByDescending(content => content.IsFeatured)
            .ThenByDescending(content => content.PublishedAtUtc)
            .Take(safeLimit)
            .ToListAsync(cancellationToken);
    }
}

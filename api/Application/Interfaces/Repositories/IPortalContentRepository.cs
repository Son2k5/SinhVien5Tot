using SV5T.Domain.Entities;

namespace SV5T.Application.Interfaces.Repositories;

public interface IPortalContentRepository
{
    Task<IReadOnlyList<PortalContent>> GetPublishedAsync(
        DateTime nowUtc,
        int limit,
        CancellationToken cancellationToken = default);
}

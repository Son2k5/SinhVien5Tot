using SV5T.Domain.Welcome;

namespace SV5T.Application.Welcome.Abstractions;

public interface IPortalContentRepository
{
    Task<IReadOnlyList<PortalContent>> GetPublishedAsync(
        DateTime nowUtc,
        int limit,
        CancellationToken cancellationToken = default);
}

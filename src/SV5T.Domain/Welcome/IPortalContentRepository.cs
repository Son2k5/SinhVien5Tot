namespace SV5T.Domain.Welcome;

public interface IPortalContentRepository
{
    Task<IReadOnlyList<PortalContent>> GetPublishedAsync(
        DateTime nowUtc,
        int limit,
        CancellationToken cancellationToken = default);
}

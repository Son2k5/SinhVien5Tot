namespace SV5T.Domain.Welcome;

public enum PortalContentType
{
    Notification = 1,
    News = 2
}

public enum PortalContentSource
{
    System = 1,
    University = 2,
    Faculty = 3,
    YouthUnion = 4
}

public sealed class PortalContent : Entity<Guid>
{
    public PortalContent()
    {
        Id = Guid.NewGuid();
    }

    public PortalContentType Type { get; set; }

    public PortalContentSource Source { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Summary { get; set; } = string.Empty;

    public string Route { get; set; } = string.Empty;

    public string Icon { get; set; } = string.Empty;

    public bool IsFeatured { get; set; }

    public bool IsPublished { get; set; } = true;

    public DateTime PublishedAtUtc { get; set; }

    public DateTime? ExpiresAtUtc { get; set; }
}

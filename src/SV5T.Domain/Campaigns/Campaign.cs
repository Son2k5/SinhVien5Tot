using SV5T.Domain.Campaigns.Enums;

namespace SV5T.Domain.Campaigns;

public sealed class Campaign : AggregateRoot<Guid>, IAuditableEntity
{
    public Campaign()
    {
        Id = Guid.NewGuid();
    }

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public int AcademicYear { get; set; }

    public CampaignStatus Status { get; set; } = CampaignStatus.Draft;

    public DateTime StartDate { get; set; }

    public DateTime EndDate { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }
}

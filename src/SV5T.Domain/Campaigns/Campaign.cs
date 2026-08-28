using SV5T.Domain.Campaigns.Enums;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Standards;
using SV5T.Domain.Submissions;

namespace SV5T.Domain.Campaigns;

public sealed class Campaign : AggregateRoot<Guid>, IAuditableEntity
{
    public Campaign()
    {
        Id = Guid.NewGuid();
    }

    public string Name { get; set; } = string.Empty;
    public string SchoolYear { get; set; } = string.Empty;
    public AwardLevel Level { get; set; }
    public AwardType AwardType { get; set; }
    public CampaignStatus Status { get; set; } = CampaignStatus.Draft;

    // Admin gắn một StandardSet đã Published vào đợt xét.
    public Guid StandardSetId { get; set; }
    public StandardSet StandardSet { get; set; } = null!;

    // City phải trỏ đến School; Central phải trỏ đến City.
    public Guid? PrerequisiteCampaignId { get; set; }
    public Campaign? PrerequisiteCampaign { get; set; }
    public ICollection<Campaign> DependentCampaigns { get; set; } = [];

    // Chỉ dùng cho AwardType.Collective.
    public string CollectiveEligibilityRuleJson { get; set; } = "[]";

    public DateTime RegOpenAt { get; set; }
    public DateTime RegCloseAt { get; set; }
    public DateTime SubmitDeadline { get; set; }
    public DateTime ReviewDeadline { get; set; }
    public string? Description { get; set; }

    public ICollection<Application> Applications { get; set; } = [];

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    public bool IsRegistrationOpen() =>
        Status == CampaignStatus.Open &&
        DateTime.UtcNow >= RegOpenAt &&
        DateTime.UtcNow <= RegCloseAt;
}

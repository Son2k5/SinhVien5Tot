using SV5T.Domain.Campaigns;
using SV5T.Domain.Evidences;
using SV5T.Domain.Standards;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Domain.Submissions;

public sealed class Application : AggregateRoot<Guid>, IAuditableEntity
{
    public Application()
    {
        Id = Guid.NewGuid();
    }

    public string ApplicationCode { get; set; } = string.Empty;

    public Guid CampaignId { get; set; }
    public Campaign Campaign { get; set; } = null!;

    // Được copy từ Campaign khi tạo hồ sơ, không đổi sau đó.
    public Guid StandardSetId { get; set; }
    public StandardSet StandardSet { get; set; } = null!;

    // Bắt buộc cho hồ sơ City/Central.
    public Guid? SourceApplicationId { get; set; }
    public Application? SourceApplication { get; set; }
    public ICollection<Application> NextLevelApplications { get; set; } = [];

    public ApplicationKind Kind { get; set; } = ApplicationKind.Individual;

    // Individual: ApplicantUserId có giá trị.
    // Collective: OrganizationUnitId có giá trị.
    public Guid? ApplicantUserId { get; set; }
    public Guid? OrganizationUnitId { get; set; }

    // Snapshot để lịch sử không bị đổi khi profile/đơn vị đổi.
    public string ApplicantSnapshotJson { get; set; } = "{}";

    // Collective: totalMembers, qualifiedMembers, violations...
    public string SubmissionDataJson { get; set; } = "{}";

    // Mentor xử lý hồ sơ.
    public Guid? AssignedReviewerId { get; set; }
    public DateTime? AssignedAt { get; set; }
    public DateTime? ReviewDueAt { get; set; }

    public SubmissionStatus Status { get; set; } = SubmissionStatus.Draft;
    public DateTime? SubmittedAt { get; set; }
    public bool RecommendedForNextLevel { get; set; }
    public string? RejectionReason { get; set; }
    public string? ReviewerGeneralNote { get; set; }

    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public ICollection<Evidence> Evidences { get; set; } = [];
    public ICollection<ReviewLog> ReviewLogs { get; set; } = [];

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

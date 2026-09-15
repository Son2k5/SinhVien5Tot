using SV5T.Domain.Criteria;
using SV5T.Domain.Submissions;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Domain.Evidences;

public sealed class Evidence : Entity<Guid>, IAuditableEntity
{
    public Evidence()
    {
        Id = Guid.NewGuid();
    }

    public Guid ApplicationId { get; set; }
    public Application Application { get; set; } = null!;

    // Chỉ được trỏ đến Criterion.Type = Requirement.
    public Guid CriterionId { get; set; }
    public Criterion Criterion { get; set; } = null!;

    public string DataJson { get; set; } = "{}";
    public string AttachmentsJson { get; set; } = "[]";
    public decimal? NumericValue { get; set; }

    public EvidenceStatus Status { get; set; } = EvidenceStatus.Draft;
    public string? ReviewerNote { get; set; }
    public Guid? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

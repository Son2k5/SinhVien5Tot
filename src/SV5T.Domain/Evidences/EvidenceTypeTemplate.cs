namespace SV5T.Domain.Evidences;

public sealed class EvidenceTypeTemplate : Entity<Guid>, IAuditableEntity
{
    public EvidenceTypeTemplate()
    {
        Id = Guid.NewGuid();
    }

    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int Version { get; set; } = 1;

    // Schema field động cho form minh chứng.
    public string FieldSchemaJson { get; set; } = "[]";

    // maxFiles, extensions, maxFileSizeBytes...
    public string AttachmentPolicyJson { get; set; } = "{}";

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}
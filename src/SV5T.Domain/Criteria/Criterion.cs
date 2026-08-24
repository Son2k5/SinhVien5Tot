using SV5T.Domain.Criteria.Enums;
using SV5T.Domain.Standards;

namespace SV5T.Domain.Criteria;

public sealed class Criterion : Entity<Guid>, IAuditableEntity
{
    public Criterion()
    {
        Id = Guid.NewGuid();
    }

    public Guid RequirementBlockId { get; set; }

    public RequirementBlock RequirementBlock { get; set; } = null!;

    public string Code { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public string ReviewGuidance { get; set; } = string.Empty;

    public int DisplayOrder { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }
}

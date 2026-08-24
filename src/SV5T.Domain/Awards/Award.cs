using SV5T.Domain.Awards.Enums;

namespace SV5T.Domain.Awards;

public sealed class Award : Entity<Guid>, IAuditableEntity
{
    public Award()
    {
        Id = Guid.NewGuid();
    }

    public string Title { get; set; } = string.Empty;

    public string? Description { get; set; }

    public AwardLevel Level { get; set; }

    public AwardType Type { get; set; }

    public int AcademicYear { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }
}

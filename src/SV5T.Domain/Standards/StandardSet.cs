using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Criteria;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Domain.Standards;

public sealed class StandardSet : Entity<Guid>, IAuditableEntity
{
    public StandardSet()
    {
        Id = Guid.NewGuid();
    }

    public string AcademicYear { get; set; } = string.Empty; // 2025-2026
    public AwardLevel Level { get; set; }
    public AwardType AwardType { get; set; }
    public StandardSetStatus Status { get; set; } = StandardSetStatus.Draft;

    // Mỗi sửa đổi nghiệp vụ quan trọng tạo một version mới.
    public int Version { get; set; } = 1;
    public Guid? PreviousVersionId { get; set; }
    public StandardSet? PreviousVersion { get; set; }
    public ICollection<StandardSet> LaterVersions { get; set; } = [];

    public DateTime? PublishedAt { get; set; }
    public ICollection<Standard> Standards { get; set; } = [];

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

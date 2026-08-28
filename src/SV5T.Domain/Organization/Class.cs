using SV5T.Domain.Common;

namespace SV5T.Domain.Organization;

public sealed class Class : Entity<Guid>, IAuditableEntity
{
    public Class()
    {
        Id = Guid.NewGuid();
    }

    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;

    public Guid FacultyId { get; set; }
    public Faculty Faculty { get; set; } = null!;

    public int? EnrollmentYear { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

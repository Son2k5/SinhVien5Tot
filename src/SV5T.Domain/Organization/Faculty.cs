using SV5T.Domain.Common;

namespace SV5T.Domain.Organization;

public sealed class Faculty : Entity<Guid>, IAuditableEntity
{
    public Faculty()
    {
        Id = Guid.NewGuid();
    }

    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }

    public ICollection<Class> Classes { get; set; } = new List<Class>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

using SV5T.Domain.Common;
using SV5T.Domain.Organization.Enums;

namespace SV5T.Domain.Organization;

public sealed class StudentAssociationUnit : Entity<Guid>, IAuditableEntity
{
    public StudentAssociationUnit()
    {
        Id = Guid.NewGuid();
    }

    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    
    public StudentAssociationUnitType UnitType { get; set; }

    public Guid? ParentUnitId { get; set; }
    public StudentAssociationUnit? ParentUnit { get; set; }
    public ICollection<StudentAssociationUnit> Children { get; set; } = new List<StudentAssociationUnit>();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

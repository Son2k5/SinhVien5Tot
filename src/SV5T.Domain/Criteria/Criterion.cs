using SV5T.Domain.Standards;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Domain.Criteria;

public sealed class Criterion : Entity<Guid>, IAuditableEntity
{
    public Criterion()
    {
        Id = Guid.NewGuid();
    }

    public Guid StandardId { get; set; }
    public Standard Standard { get; set; } = null!;

    // null: tiêu chí cấp 1 thuộc Standard; có giá trị: tiêu chí hoặc nhóm con.
    public Guid? ParentCriterionId { get; set; }
    public Criterion? ParentCriterion { get; set; }
    public ICollection<Criterion> Children { get; set; } = [];

    public CriterionType Type { get; set; }

    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }

    // Chỉ áp dụng khi Type = Group.
    public CriterionOperator Operator { get; set; } = CriterionOperator.All;
    public int? MinimumSatisfied { get; set; }

    // Chỉ áp dụng khi Type = Requirement.
    public CriterionEvaluationType EvaluationType { get; set; }
    public string DefinitionJson { get; set; } = "{}";
    public string? ReviewGuidance { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

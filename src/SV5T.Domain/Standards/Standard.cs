using SV5T.Domain.Criteria;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Domain.Standards;

public sealed class Standard : Entity<Guid>, IAuditableEntity
{
    public Standard()
    {
        Id = Guid.NewGuid();
    }

    public Guid StandardSetId { get; set; }
    public StandardSet StandardSet { get; set; } = null!;

    public StandardGroupCode? GroupCode { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }

    public CriterionOperator Operator { get; set; } = CriterionOperator.All;
    public int? MinimumSatisfied { get; set; }

    public ICollection<Criterion> Criteria { get; set; } = [];

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

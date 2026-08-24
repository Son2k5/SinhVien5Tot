using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SV5T.Domain.Criteria;
using SV5T.Domain.Criteria.Enums;

namespace SV5T.Domain.Standards
{
    public class RequirementBlock
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid StandardGroupId { get; set; }

        public StandardGroup StandardGroup { get; set; } = null!;

        public string Name { get; set; } = string.Empty;

        public RequirementOperator Operator { get; set; }

        public RequirementPurpose Purpose { get; set; }

        public int MinimumRequired { get; set; }

        public int DisplayOrder { get; set; }

        public ICollection<Criterion> Criteria { get; set; } = [];
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string? CreatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public string? UpdatedBy { get; set; }
    }
}
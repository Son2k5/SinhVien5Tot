using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Domain.Standards
{
    public class StandardGroup
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public Guid StandardSetId { get; set; }

        public StandardSet StandardSet { get; set; } = null!;

        public StandardGroupCode Code { get; set; }

        public string Name { get; set; } = string.Empty;

        public string? Description { get; set; }

        public int DisplayOrder { get; set; }

        public ICollection<RequirementBlock> RequirementBlocks { get; set; } = [];
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string? CreatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public string? UpdatedBy { get; set; }
    }
}
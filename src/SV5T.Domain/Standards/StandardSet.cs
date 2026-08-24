
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Domain.Standards
{
    public class StandardSet
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        public string AcademicYear { get; set; } = string.Empty;

        public AwardLevel Level { get; set; }

        public AwardType AwardType { get; set; }

        public StandardSetStatus Status { get; set; } =
            StandardSetStatus.Draft;

        public StandardSetScope Scope { get; set; } =
            StandardSetScope.Template;

        public int Version { get; set; } = 1;

        public Guid? ClonedFromId { get; set; }

        public Guid? CampaignId { get; set; }

        public int Revision { get; set; } = 1;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public string? CreatedBy { get; set; }

        public DateTime? UpdatedAt { get; set; }

        public string? UpdatedBy { get; set; }

        public ICollection<StandardGroup> Groups { get; set; } = [];
    }
}
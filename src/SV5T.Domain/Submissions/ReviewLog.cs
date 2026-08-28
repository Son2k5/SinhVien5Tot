using SV5T.Domain.Submissions.Enums;

namespace SV5T.Domain.Submissions;

public sealed class ReviewLog : Entity<Guid>
{
    public ReviewLog()
    {
        Id = Guid.NewGuid();
    }

    public Guid ApplicationId { get; set; }
    public Application Application { get; set; } = null!;

    public Guid? EvidenceId { get; set; }
    public Guid ActorId { get; set; } // User, Mentor hoặc Admin.

    public ReviewAction Action { get; set; }
    public string? Note { get; set; }
    public string MetadataJson { get; set; } = "{}";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

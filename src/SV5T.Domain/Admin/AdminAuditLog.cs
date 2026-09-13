using SV5T.Domain.Common;

namespace SV5T.Domain.Admin;

public sealed class AdminAuditLog : Entity<Guid>
{
    public AdminAuditLog()
    {
        Id = Guid.NewGuid();
    }

    public string Action { get; set; } = string.Empty;

    public Guid TargetUserId { get; set; }

    public Guid ActorId { get; set; }

    public string? Reason { get; set; }

    public string MetadataJson { get; set; } = "{}";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

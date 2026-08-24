using SV5T.Domain.Users;

namespace SV5T.Domain.Auth;

public sealed class RefreshToken : Entity<Guid>
{
    public RefreshToken()
    {
        Id = Guid.NewGuid();
    }

    // Only the SHA-256 hash is persisted. The raw token is returned to the client once.
    public string Token { get; set; } = string.Empty;

    public Guid UserId { get; set; }

    public Guid FamilyId { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime LastUsedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime ExpiresAtUtc { get; set; }

    public DateTime AbsoluteExpiresAtUtc { get; set; }

    public bool IsPersistent { get; set; }

    public bool IsRevoked { get; set; }

    public DateTime? RevokedAtUtc { get; set; }

    public Guid? ReplacedByTokenId { get; set; }

    public User User { get; set; } = null!;
}

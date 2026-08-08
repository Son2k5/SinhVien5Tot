using SV5T.Domain.Enums;

namespace SV5T.Domain.Entities;

public sealed class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string Email { get; set; } = string.Empty;

    public string NormalizedEmail { get; set; } = string.Empty;

    public string PasswordHash { get; set; } = string.Empty;

    public Role Role { get; set; } = Role.User;

    public string? AvatarUrl { get; set; }

    public string? AvatarPublicId { get; set; }

    public string? AvatarResourceType { get; set; }

    public bool IsVerified { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public UserProfile? Profile { get; set; }

    public ICollection<UserAddress> Addresses { get; set; } = [];

    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];

}

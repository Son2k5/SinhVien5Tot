using SV5T.Domain.Auth;
using SV5T.Domain.Users.Enums;

namespace SV5T.Domain.Users;

public sealed class User : AggregateRoot<Guid>, IAuditableEntity
{
    public User()
    {
        Id = Guid.NewGuid();
    }

    public string Email { get; set; } = string.Empty;

    public string NormalizedEmail { get; set; } = string.Empty;

    public string? DisplayName { get; set; }

    public string PasswordHash { get; set; } = string.Empty;

    public Role Role { get; set; } = Role.User;

    public string? AvatarUrl { get; set; }

    public string? AvatarPublicId { get; set; }

    public string? AvatarResourceType { get; set; }

    public bool IsVerified { get; set; }

    public bool IsActive { get; set; } = true;

    public int SecurityVersion { get; set; } = 1;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public string? CreatedBy { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? UpdatedBy { get; set; }

    public UserProfile? Profile { get; set; }

    public ICollection<UserAddress> Addresses { get; set; } = [];

    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
}

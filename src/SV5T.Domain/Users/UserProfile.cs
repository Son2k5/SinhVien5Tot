using SV5T.Domain.Users.Enums;

namespace SV5T.Domain.Users;

public sealed class UserProfile : Entity<Guid>
{
    public UserProfile()
    {
        Id = Guid.NewGuid();
    }

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public string FullName { get; set; } = string.Empty;

    public DateOnly BirthDate { get; set; }

    public Gender Gender { get; set; }

    public string IdentityCardNumber { get; set; } = string.Empty;

    public string Ethnicity { get; set; } = string.Empty;

    public string School { get; set; } = string.Empty;

    public string? Major { get; set; }

    public int AcademicYear { get; set; }

    public string StudentCode { get; set; } = string.Empty;

    public string AdministrativeClass { get; set; } = string.Empty;

    public string Faculty { get; set; } = string.Empty;

    public string CurrentPosition { get; set; } = string.Empty;

    public string ContactEmail { get; set; } = string.Empty;

    public string PhoneNumber { get; set; } = string.Empty;

    public string? UnionPosition { get; set; }

    public PoliticalStatus PoliticalStatus { get; set; }
}

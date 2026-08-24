using SV5T.Domain.Users.Enums;

namespace SV5T.Domain.Users;

public sealed class UserAddress : Entity<Guid>
{
    public UserAddress()
    {
        Id = Guid.NewGuid();
    }

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public AddressType AddressType { get; set; }

    public string ProvinceOrCity { get; set; } = string.Empty;

    public string District { get; set; } = string.Empty;

    public string StreetAddress { get; set; } = string.Empty;
}

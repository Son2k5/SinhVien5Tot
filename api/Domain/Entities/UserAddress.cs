using SV5T.Domain.Enums;

namespace SV5T.Domain.Entities;

public sealed class UserAddress
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }

    public User User { get; set; } = null!;

    public AddressType AddressType { get; set; }

    public string ProvinceOrCity { get; set; } = string.Empty;

    public string District { get; set; } = string.Empty;

    public string StreetAddress { get; set; } = string.Empty;
}

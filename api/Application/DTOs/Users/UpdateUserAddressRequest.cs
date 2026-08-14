using SV5T.Domain.Enums;

namespace SV5T.Application.DTOs.Users;

public sealed record UpdateUserAddressRequest(
    AddressType AddressType,
    string ProvinceOrCity,
    string District,
    string StreetAddress);

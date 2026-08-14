using SV5T.Domain.Enums;

namespace SV5T.Application.DTOs.Users;

public sealed record UserAddressDto(
    AddressType AddressType,
    string ProvinceOrCity,
    string District,
    string StreetAddress);

public sealed record UserProfileDto(
    string FullName,
    DateOnly BirthDate,
    Gender Gender,
    string IdentityCardNumber,
    string Ethnicity,
    string School,
    string? Major,
    int AcademicYear,
    string StudentCode,
    string AdministrativeClass,
    string Faculty,
    string CurrentPosition,
    string ContactEmail,
    string PhoneNumber,
    string? UnionPosition,
    PoliticalStatus PoliticalStatus,
    IReadOnlyList<UserAddressDto> Addresses);

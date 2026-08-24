using SV5T.Domain.Users.Enums;

namespace SV5T.Application.Users.Dtos;

public sealed record UserDto(
    Guid Id,
    string Email,
    string? DisplayName,
    Role Role,
    string? AvatarUrl,
    bool IsVerified,
    DateTime CreatedAt,
    UserProfileDto? Profile);

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

public sealed record UpdateUserAddressRequest(
    AddressType AddressType,
    string ProvinceOrCity,
    string District,
    string StreetAddress);

public sealed record UpdateUserProfileRequest(
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
    IReadOnlyList<UpdateUserAddressRequest> Addresses);

public sealed record UpdateUserAvatarRequest(
    Stream Content,
    string FileName,
    long Length);

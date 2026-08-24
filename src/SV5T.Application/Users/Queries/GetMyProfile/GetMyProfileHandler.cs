using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Interfaces;
using SV5T.Application.Users.Dtos;
using SV5T.Domain.Users;

namespace SV5T.Application.Users.Queries.GetMyProfile;

public sealed record GetMyProfileQuery(Guid UserId);

public sealed class GetMyProfileHandler(
    ICurrentUser currentUser,
    IUserRepository userRepository) : IQueryHandler<GetMyProfileQuery, UserProfileDto?>
{
    public async Task<UserProfileDto?> HandleAsync(GetMyProfileQuery query, CancellationToken cancellationToken = default)
    {
        var userId = query.UserId;
        EnsureOwnUser(userId);
        var user = await userRepository.GetByIdWithProfileAsync(
            userId, false, cancellationToken);
        return user is null || !user.IsActive || !user.IsVerified || user.Profile is null
            ? null
            : ToProfileDto(user.Profile, user.Addresses);
    }

    private void EnsureOwnUser(Guid userId)
    {
        if (!currentUser.UserId.HasValue)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phiên đăng nhập không hợp lệ.",
                "invalid_session");
        }

        if (currentUser.UserId.Value != userId)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Forbidden,
                "Bạn không được truy cập người dùng khác.",
                "user_access_denied");
        }
    }

    private static UserProfileDto ToProfileDto(
        UserProfile profile,
        IEnumerable<UserAddress>? addresses) =>
        new(
            profile.FullName,
            profile.BirthDate,
            profile.Gender,
            profile.IdentityCardNumber,
            profile.Ethnicity,
            profile.School,
            profile.Major,
            profile.AcademicYear,
            profile.StudentCode,
            profile.AdministrativeClass,
            profile.Faculty,
            profile.CurrentPosition,
            profile.ContactEmail,
            profile.PhoneNumber,
            profile.UnionPosition,
            profile.PoliticalStatus,
            (addresses ?? [])
                .OrderBy(item => item.AddressType)
                .Select(item => new UserAddressDto(
                    item.AddressType,
                    item.ProvinceOrCity,
                    item.District,
                    item.StreetAddress))
                .ToArray());
}

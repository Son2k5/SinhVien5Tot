using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Users.Dtos;
using SV5T.Domain.Users;

namespace SV5T.Application.Users.Queries.GetUserById;

public sealed record GetUserByIdQuery(Guid Id) : IRequest<UserDto?>;

public sealed class GetUserByIdHandler(
    ICurrentUser currentUser,
    IUserRepository userRepository) : IRequestHandler<GetUserByIdQuery, UserDto?>
{
    public async Task<UserDto?> Handle(GetUserByIdQuery query, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (currentUser.UserId != query.Id && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("Mentor"))
        {
            return null;
        }

        var user = await userRepository.GetByIdWithProfileAsync(query.Id, tracking: false, cancellationToken: cancellationToken);
        return user is null || !user.IsActive || !user.IsVerified
            ? null
            : ToUserDto(user);
    }

    private static UserDto ToUserDto(User user) =>
        new(
            user.Id,
            user.Email,
            user.DisplayName,
            user.Role,
            user.AvatarUrl,
            user.IsVerified,
            user.CreatedAt,
            user.Profile is null
                ? null
                : new UserProfileDto(
                    user.Profile.FullName,
                    user.Profile.BirthDate,
                    user.Profile.Gender,
                    user.Profile.IdentityCardNumber,
                    user.Profile.Ethnicity,
                    user.Profile.School,
                    user.Profile.Major,
                    user.Profile.AcademicYear,
                    user.Profile.StudentCode,
                    user.Profile.AdministrativeClass,
                    user.Profile.Faculty,
                    user.Profile.CurrentPosition,
                    user.Profile.ContactEmail,
                    user.Profile.PhoneNumber,
                    user.Profile.UnionPosition,
                    user.Profile.PoliticalStatus,
                    user.Addresses.OrderBy(item => item.AddressType)
                        .Select(item => new UserAddressDto(
                            item.AddressType,
                            item.ProvinceOrCity,
                            item.District,
                            item.StreetAddress))
                        .ToArray()));
}

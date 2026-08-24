using FluentValidation;
using SV5T.Application.Auth.Support;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Interfaces;
using SV5T.Application.Users.Dtos;
using SV5T.Domain.Users;

namespace SV5T.Application.Users.Commands.UpdateProfile;

public sealed record UpdateProfileCommand(Guid UserId, UpdateUserProfileRequest Request);

public sealed class UpdateProfileHandler(
    ICurrentUser currentUser,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IValidator<UpdateUserProfileRequest> profileValidator) : ICommandHandler<UpdateProfileCommand, UserProfileDto>
{
    public async Task<UserProfileDto> HandleAsync(UpdateProfileCommand command, CancellationToken cancellationToken = default)
    {
        var userId = command.UserId;
        var request = command.Request;

        EnsureOwnUser(userId);
        await AuthServiceSupport.ValidateAsync(profileValidator, request, cancellationToken);

        UserProfileDto? result = null;
        await unitOfWork.ExecuteInTransactionAsync(
            async transactionToken =>
            {
                var user = await userRepository.GetByIdWithProfileAsync(
                    userId, true, transactionToken);
                if (user is null || !user.IsActive || !user.IsVerified)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.NotFound,
                        "Không tìm thấy người dùng.",
                        "user_not_found");
                }

                var normalizedStudentCode = request.StudentCode.Trim().ToUpperInvariant();
                if (await userRepository.ExistsStudentCodeAsync(
                        normalizedStudentCode, userId, transactionToken))
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Conflict,
                        "Mã sinh viên đã được sử dụng.",
                        "student_code_taken");
                }

                if (user.Profile is null)
                {
                    user.Profile = new UserProfile
                    {
                        UserId = user.Id,
                        User = user
                    };
                    ApplyProfile(user.Profile, request, normalizedStudentCode);
                    await userRepository.AddProfileAsync(user.Profile, transactionToken);
                }
                else
                {
                    ApplyProfile(user.Profile, request, normalizedStudentCode);
                }

                user.DisplayName = request.FullName.Trim();
                await SynchronizeAddressesAsync(user, request.Addresses, transactionToken);
                user.UpdatedAt = DateTime.UtcNow;
                user.UpdatedBy = currentUser.UserId?.ToString();

                await unitOfWork.SaveChangesAsync(transactionToken);
                result = ToProfileDto(user.Profile, user.Addresses);
            },
            cancellationToken);

        return result!;
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
                "Bạn không được cập nhật người dùng khác.",
                "user_access_denied");
        }
    }

    private static void ApplyProfile(
        UserProfile profile,
        UpdateUserProfileRequest request,
        string studentCode)
    {
        profile.FullName = request.FullName.Trim();
        profile.BirthDate = request.BirthDate;
        profile.Gender = request.Gender;
        profile.IdentityCardNumber = request.IdentityCardNumber.Trim();
        profile.Ethnicity = request.Ethnicity.Trim();
        profile.School = request.School.Trim();
        profile.Major = NullIfWhiteSpace(request.Major);
        profile.AcademicYear = request.AcademicYear;
        profile.StudentCode = studentCode;
        profile.AdministrativeClass = request.AdministrativeClass.Trim();
        profile.Faculty = request.Faculty.Trim();
        profile.CurrentPosition = request.CurrentPosition.Trim();
        profile.ContactEmail = request.ContactEmail.Trim().ToLowerInvariant();
        profile.PhoneNumber = request.PhoneNumber.Trim();
        profile.UnionPosition = NullIfWhiteSpace(request.UnionPosition);
        profile.PoliticalStatus = request.PoliticalStatus;
    }

    private static string? NullIfWhiteSpace(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private async Task SynchronizeAddressesAsync(
        User user,
        IReadOnlyList<UpdateUserAddressRequest> requests,
        CancellationToken cancellationToken)
    {
        var requestedTypes = requests
            .Select(request => request.AddressType)
            .ToHashSet();
        foreach (var staleAddress in user.Addresses
                     .Where(address => !requestedTypes.Contains(address.AddressType))
                     .ToArray())
        {
            user.Addresses.Remove(staleAddress);
        }

        foreach (var request in requests)
        {
            var address = user.Addresses.SingleOrDefault(
                item => item.AddressType == request.AddressType);
            if (address is null)
            {
                address = new UserAddress
                {
                    UserId = user.Id,
                    User = user,
                    AddressType = request.AddressType
                };
                user.Addresses.Add(address);
                await userRepository.AddAddressAsync(address, cancellationToken);
            }

            address.ProvinceOrCity = request.ProvinceOrCity.Trim();
            address.District = request.District.Trim();
            address.StreetAddress = request.StreetAddress.Trim();
        }
    }

    private static UserProfileDto ToProfileDto(
        UserProfile profile,
        IEnumerable<UserAddress> addresses) =>
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
            addresses.OrderBy(item => item.AddressType)
                .Select(item => new UserAddressDto(
                    item.AddressType,
                    item.ProvinceOrCity,
                    item.District,
                    item.StreetAddress))
                .ToArray());
}

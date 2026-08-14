using FluentValidation;
using Microsoft.Extensions.Logging;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.DTOs.Users;
using SV5T.Application.Interfaces.Persistence;
using SV5T.Application.Interfaces.Repositories;
using SV5T.Application.Interfaces.Services.Commons;
using SV5T.Application.Interfaces.Services.Media;
using SV5T.Application.Interfaces.Services.Users;
using SV5T.Domain.Entities;

namespace SV5T.Application.Services;

public sealed class UserService(
    ICurrentUser currentUser,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IAvatarStorage avatarStorage,
    IValidator<UpdateUserProfileRequest> profileValidator,
    ILogger<UserService> logger) : IUserService
{
    private const long MaxAvatarBytes = 5 * 1024 * 1024;
    public async Task<UserDto?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (currentUser.UserId != id)
        {
            return null;
        }

        var user = await userRepository.GetByIdAsync(id, cancellationToken);
        return user is null || !user.IsActive || !user.IsVerified
            ? null
            : ToUserDto(user);
    }

    public async Task<UserProfileDto?> GetMyProfileAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        EnsureOwnUser(userId);
        var user = await userRepository.GetByIdWithProfileAsync(
            userId, false, cancellationToken);
        return user is null || !user.IsActive || !user.IsVerified || user.Profile is null
            ? null
            : ToProfileDto(user.Profile, user.Addresses);
    }

    public async Task<UserProfileDto> UpdateMyProfileAsync(
        Guid userId,
        UpdateUserProfileRequest request,
        CancellationToken cancellationToken = default)
    {
        EnsureOwnUser(userId);
        await AuthServiceSupport.ValidateAsync(
            profileValidator, request, cancellationToken);

        UserProfileDto? result = null;
        await unitOfWork.ExecuteInTransactionAsync(
            async transactionToken =>
            {
                result = await UpdateProfileInTransactionAsync(
                    userId, request, transactionToken);
            },
            cancellationToken);

        return result!;
    }

    public async Task<UserDto> UpdateMyAvatarAsync(
        Guid userId,
        UpdateUserAvatarRequest request,
        CancellationToken cancellationToken = default)
    {
        EnsureOwnUser(userId);
        await ValidateAvatarAsync(request, cancellationToken);
        var user = await GetActiveTrackedUserAsync(userId, cancellationToken);
        var oldPublicId = user.AvatarPublicId;
        var oldResourceType = user.AvatarResourceType;
        StoredAvatar? uploaded = null;

        try
        {
            uploaded = await avatarStorage.UploadAsync(
                userId, request.Content, request.FileName, cancellationToken);
            user.AvatarUrl = uploaded.Url;
            user.AvatarPublicId = uploaded.PublicId;
            user.AvatarResourceType = uploaded.ResourceType;
            user.UpdatedAt = DateTime.UtcNow;
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            if (uploaded is not null)
            {
                await TryDeleteAvatarAsync(uploaded.PublicId, uploaded.ResourceType);
            }
            throw;
        }

        if (!string.IsNullOrWhiteSpace(oldPublicId) && oldPublicId != uploaded.PublicId)
        {
            await TryDeleteAvatarAsync(oldPublicId, oldResourceType ?? "image");
        }

        return ToUserDto(user);
    }

    private static UserDto ToUserDto(User user) =>
        new(
            user.Id,
            user.Email,
            string.IsNullOrWhiteSpace(user.DisplayName)
                ? user.Email.Split('@', 2)[0]
                : user.DisplayName.Trim(),
            user.Role,
            user.AvatarUrl);

    private async Task<UserProfileDto> UpdateProfileInTransactionAsync(
        Guid userId,
        UpdateUserProfileRequest request,
        CancellationToken cancellationToken)
    {
        var user = await GetActiveTrackedUserAsync(userId, cancellationToken);
        var studentCode = request.StudentCode.Trim().ToUpperInvariant();
        await EnsureStudentCodeAvailableAsync(studentCode, userId, cancellationToken);
        user.Profile ??= new UserProfile { UserId = user.Id, User = user };
        ApplyProfile(user.Profile, request, studentCode);
        SynchronizeAddresses(user, request.Addresses);
        user.UpdatedAt = DateTime.UtcNow;
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return ToProfileDto(user.Profile, user.Addresses);
    }

    private async Task EnsureStudentCodeAvailableAsync(
        string code, Guid userId, CancellationToken cancellationToken)
    {
        if (await userRepository.ExistsStudentCodeAsync(code, userId, cancellationToken))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Mã sinh viên đã được sử dụng.",
                "student_code_taken");
        }
    }

    private static async Task ValidateAvatarAsync(
        UpdateUserAvatarRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Length is <= 0 or > MaxAvatarBytes ||
            !request.Content.CanRead || !request.Content.CanSeek)
        {
            throw InvalidAvatar("Ảnh đại diện không hợp lệ.", "invalid_avatar");
        }

        var header = new byte[12];
        var read = await request.Content.ReadAsync(header, cancellationToken);
        request.Content.Position = 0;
        var jpeg = read >= 3 && header[0] == 0xff && header[1] == 0xd8 && header[2] == 0xff;
        var png = read >= 8 && header.AsSpan(0, 8).SequenceEqual(
            new byte[] { 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a });
        var webp = read >= 12 && header.AsSpan(0, 4).SequenceEqual("RIFF"u8) &&
                   header.AsSpan(8, 4).SequenceEqual("WEBP"u8);
        if (!jpeg && !png && !webp)
        {
            throw InvalidAvatar(
                "Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.",
                "unsupported_avatar_format");
        }
    }

    private static UseCaseException InvalidAvatar(string message, string code) =>
        new(ApplicationErrorKind.Validation, message, code);

    private async Task TryDeleteAvatarAsync(string publicId, string resourceType)
    {
        try
        {
            await avatarStorage.DeleteAsync(
                publicId, resourceType, CancellationToken.None);
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "Could not delete Cloudinary avatar {PublicId}.",
                publicId);
        }
    }

    private async Task<User> GetActiveTrackedUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdWithProfileAsync(
            userId, true, cancellationToken);
        if (user is null || !user.IsActive || !user.IsVerified)
        {
            throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy người dùng.",
                "user_not_found");
        }

        return user;
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

    private static void SynchronizeAddresses(
        User user,
        IReadOnlyList<UpdateUserAddressRequest> requests)
    {
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

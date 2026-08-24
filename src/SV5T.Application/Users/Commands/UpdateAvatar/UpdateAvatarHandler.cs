using Microsoft.Extensions.Logging;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Interfaces;
using SV5T.Application.Users.Dtos;
using SV5T.Domain.Users;

namespace SV5T.Application.Users.Commands.UpdateAvatar;

public sealed record UpdateAvatarCommand(Guid UserId, UpdateUserAvatarRequest Request);

public sealed class UpdateAvatarHandler(
    ICurrentUser currentUser,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IAvatarStorage avatarStorage,
    ILogger<UpdateAvatarHandler> logger) : ICommandHandler<UpdateAvatarCommand, UserDto>
{
    private const long MaxAvatarBytes = 5 * 1024 * 1024;

    public async Task<UserDto> HandleAsync(UpdateAvatarCommand command, CancellationToken cancellationToken = default)
    {
        var userId = command.UserId;
        var request = command.Request;

        EnsureOwnUser(userId);
        if (request.Length <= 0 || request.Length > MaxAvatarBytes)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Kích thước ảnh đại diện không hợp lệ.",
                "invalid_avatar_size");
        }

        var (stream, fileName) = await ValidateAndPrepareAvatarAsync(request, cancellationToken);
        var user = await GetActiveTrackedUserAsync(userId, cancellationToken);
        var oldPublicId = user.AvatarPublicId;
        var oldResourceType = user.AvatarResourceType;

        var stored = await avatarStorage.UploadAsync(
            userId, stream, fileName, cancellationToken);
        user.AvatarUrl = stored.Url;
        user.AvatarPublicId = stored.PublicId;
        user.AvatarResourceType = stored.ResourceType;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = currentUser.UserId?.ToString();

        await unitOfWork.SaveChangesAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(oldPublicId) &&
            !string.IsNullOrWhiteSpace(oldResourceType))
        {
            await TryDeleteAvatarAsync(oldPublicId, oldResourceType);
        }

        return ToUserDto(user);
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

    private async Task<(Stream Stream, string FileName)> ValidateAndPrepareAvatarAsync(
        UpdateUserAvatarRequest request,
        CancellationToken cancellationToken)
    {
        var memory = new MemoryStream();
        await request.Content.CopyToAsync(memory, cancellationToken);
        if (memory.Length == 0 || memory.Length > MaxAvatarBytes)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Kích thước ảnh đại diện không hợp lệ.",
                "invalid_avatar_size");
        }

        memory.Position = 0;
        var header = new byte[12];
        var read = await memory.ReadAsync(header.AsMemory(0, header.Length), cancellationToken);
        memory.Position = 0;

        ValidateImageSignature(header, read);
        var extension = Path.GetExtension(request.FileName);
        if (string.IsNullOrWhiteSpace(extension))
        {
            extension = ".jpg";
        }

        return (memory, $"{Guid.NewGuid():N}{extension}");
    }

    private static void ValidateImageSignature(byte[] header, int read)
    {
        var jpeg = read >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF;
        var png = read >= 8 && header.AsSpan(0, 8).SequenceEqual(
            new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A });
        var webp = read >= 12 && header.AsSpan(0, 4).SequenceEqual("RIFF"u8) &&
                   header.AsSpan(8, 4).SequenceEqual("WEBP"u8);
        if (!jpeg && !png && !webp)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Chỉ chấp nhận ảnh JPEG, PNG hoặc WebP.",
                "unsupported_avatar_format");
        }
    }

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

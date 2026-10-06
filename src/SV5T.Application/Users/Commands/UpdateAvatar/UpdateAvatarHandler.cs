using MediatR;
using Microsoft.Extensions.Logging;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Security;
using SV5T.Application.Users.Dtos;
using SV5T.Domain.Users;

namespace SV5T.Application.Users.Commands.UpdateAvatar;

public sealed record UpdateAvatarCommand(
    Guid UserId,
    UpdateUserAvatarRequest Request) : IRequest<UserDto>;

public sealed record RemoveAvatarCommand(Guid UserId) : IRequest<UserDto>;

public sealed class UpdateAvatarHandler(
    ICurrentUser currentUser,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IAvatarStorage avatarStorage,
    ILogger<UpdateAvatarHandler> logger) : IRequestHandler<UpdateAvatarCommand, UserDto>
{
    public async Task<UserDto> Handle(
        UpdateAvatarCommand command,
        CancellationToken cancellationToken)
    {
        AvatarCommandSupport.EnsureOwnUser(currentUser, command.UserId);
        var user = await AvatarCommandSupport.GetActiveTrackedUserAsync(
            userRepository,
            command.UserId,
            cancellationToken);
        var oldPublicId = user.AvatarPublicId;
        var oldResourceType = user.AvatarResourceType;

        await using var content = await AvatarCommandSupport.PrepareAsync(
            command.Request,
            cancellationToken);
        var fileName = $"{Guid.NewGuid():N}{AvatarCommandSupport.GetTrustedExtension(content)}";
        content.Position = 0;

        StoredAvatar? uploaded = null;
        try
        {
            uploaded = await avatarStorage.UploadAsync(
                command.UserId,
                content,
                fileName,
                cancellationToken);
            user.AvatarUrl = uploaded.Url;
            user.AvatarPublicId = uploaded.PublicId;
            user.AvatarResourceType = uploaded.ResourceType;
            user.UpdatedAt = DateTime.UtcNow;
            user.UpdatedBy = command.UserId.ToString("D");
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            if (uploaded is not null)
            {
                await AvatarCommandSupport.TryDeleteAsync(
                    avatarStorage,
                    uploaded.PublicId,
                    uploaded.ResourceType,
                    command.UserId,
                    logger);
            }

            throw;
        }

        await AvatarCommandSupport.TryDeleteAsync(
            avatarStorage,
            oldPublicId,
            oldResourceType,
            command.UserId,
            logger);
        return AvatarCommandSupport.ToUserDto(user);
    }
}

public sealed class RemoveAvatarHandler(
    ICurrentUser currentUser,
    IUserRepository userRepository,
    IUnitOfWork unitOfWork,
    IAvatarStorage avatarStorage,
    ILogger<RemoveAvatarHandler> logger) : IRequestHandler<RemoveAvatarCommand, UserDto>
{
    public async Task<UserDto> Handle(
        RemoveAvatarCommand command,
        CancellationToken cancellationToken)
    {
        AvatarCommandSupport.EnsureOwnUser(currentUser, command.UserId);
        var user = await AvatarCommandSupport.GetActiveTrackedUserAsync(
            userRepository,
            command.UserId,
            cancellationToken);
        var oldPublicId = user.AvatarPublicId;
        var oldResourceType = user.AvatarResourceType;

        if (string.IsNullOrWhiteSpace(user.AvatarUrl) &&
            string.IsNullOrWhiteSpace(oldPublicId))
        {
            return AvatarCommandSupport.ToUserDto(user);
        }

        user.AvatarUrl = null;
        user.AvatarPublicId = null;
        user.AvatarResourceType = null;
        user.UpdatedAt = DateTime.UtcNow;
        user.UpdatedBy = command.UserId.ToString("D");
        await unitOfWork.SaveChangesAsync(cancellationToken);

        await AvatarCommandSupport.TryDeleteAsync(
            avatarStorage,
            oldPublicId,
            oldResourceType,
            command.UserId,
            logger);
        return AvatarCommandSupport.ToUserDto(user);
    }
}

internal static class AvatarCommandSupport
{
    private const long MaxAvatarBytes = 5 * 1024 * 1024;

    internal static void EnsureOwnUser(ICurrentUser currentUser, Guid userId)
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

    internal static async Task<User> GetActiveTrackedUserAsync(
        IUserRepository userRepository,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdWithProfileAsync(
            userId,
            tracking: true,
            cancellationToken);
        if (user is null || !user.IsActive || !user.IsVerified || user.IsDeleted)
        {
            throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy người dùng.",
                "user_not_found");
        }

        return user;
    }

    internal static async Task<MemoryStream> PrepareAsync(
        UpdateUserAvatarRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Length <= 0 || request.Length > MaxAvatarBytes)
        {
            throw InvalidSize();
        }

        var content = new MemoryStream((int)request.Length);
        var buffer = new byte[81920];
        long total = 0;
        try
        {
            while (true)
            {
                var read = await request.Content.ReadAsync(buffer.AsMemory(), cancellationToken);
                if (read == 0)
                {
                    break;
                }

                total += read;
                if (total > MaxAvatarBytes)
                {
                    throw InvalidSize();
                }

                await content.WriteAsync(buffer.AsMemory(0, read), cancellationToken);
            }

            if (total == 0 || total != request.Length)
            {
                throw InvalidSize();
            }

            content.Position = 0;
            var header = new byte[12];
            var bytesRead = await content.ReadAsync(header.AsMemory(), cancellationToken);
            FileSignatureValidator.EnsureValidImageSignature(header, bytesRead);
            content.Position = 0;
            return content;
        }
        catch
        {
            await content.DisposeAsync();
            throw;
        }
    }

    internal static string GetTrustedExtension(MemoryStream content)
    {
        var header = content.GetBuffer();
        if (header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
        {
            return ".jpg";
        }

        if (header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E)
        {
            return ".png";
        }

        return ".webp";
    }

    internal static async Task TryDeleteAsync(
        IAvatarStorage avatarStorage,
        string? publicId,
        string? resourceType,
        Guid userId,
        ILogger logger)
    {
        if (string.IsNullOrWhiteSpace(publicId) ||
            string.IsNullOrWhiteSpace(resourceType))
        {
            return;
        }

        try
        {
            await avatarStorage.DeleteAsync(
                publicId,
                resourceType,
                CancellationToken.None);
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "Could not delete an avatar for user {UserId}.",
                userId);
        }
    }

    internal static UserDto ToUserDto(User user) =>
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

    private static UseCaseException InvalidSize() =>
        new(
            ApplicationErrorKind.Validation,
            "Ảnh đại diện phải có dung lượng từ 1 byte đến 5 MB.",
            "invalid_avatar_size");
}

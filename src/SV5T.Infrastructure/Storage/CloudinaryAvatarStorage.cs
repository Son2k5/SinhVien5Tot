using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Abstractions;

namespace SV5T.Infrastructure.Storage;

public sealed class CloudinaryAvatarStorage(Cloudinary cloudinary) : IAvatarStorage
{
    public async Task<StoredAvatar> UploadAsync(
        Guid userId,
        Stream content,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var parameters = new ImageUploadParams
            {
                File = new FileDescription(Path.GetFileName(fileName), content),
                Folder = $"sv5t/users/{userId:N}/avatars",
                PublicId = Guid.NewGuid().ToString("N"),
                UniqueFilename = false,
                Overwrite = false,
                Transformation = new Transformation()
                    .Width(512).Height(512).Crop("fill").Gravity("auto")
            };
            var result = await cloudinary.UploadAsync(parameters, cancellationToken);
            if (result.Error is not null || result.SecureUrl is null ||
                string.IsNullOrWhiteSpace(result.PublicId))
            {
                throw StorageUnavailable();
            }

            return new StoredAvatar(
                result.SecureUrl.AbsoluteUri,
                result.PublicId,
                result.ResourceType ?? "image");
        }
        catch (OperationCanceledException)
        {
            throw;
        }
        catch (UseCaseException)
        {
            throw;
        }
        catch (Exception exception)
        {
            throw StorageUnavailable(exception);
        }
    }

    public async Task DeleteAsync(
        string publicId,
        string resourceType,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await cloudinary.DestroyAsync(new DeletionParams(publicId)
        {
            ResourceType = resourceType.Equals("video", StringComparison.OrdinalIgnoreCase)
                ? ResourceType.Video
                : ResourceType.Image,
            Invalidate = true
        });
    }

    private static UseCaseException StorageUnavailable(Exception? inner = null) =>
        new(
            ApplicationErrorKind.Internal,
            "Dịch vụ lưu trữ ảnh tạm thời không khả dụng.",
            "avatar_storage_unavailable");
}


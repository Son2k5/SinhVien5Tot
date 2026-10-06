using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using SV5T.Application.Articles;
using SV5T.Application.Common.Exceptions;

namespace SV5T.Infrastructure.Articles;

public sealed class CloudinaryArticleImageStorage(Cloudinary cloudinary)
    : IArticleImageStorage
{
    public async Task<StoredImage> UploadAsync(
        Stream content,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var parameters = new ImageUploadParams
            {
                File = new FileDescription(Path.GetFileName(fileName), content),
                Folder = "articles",
                PublicId = Guid.NewGuid().ToString("N"),
                UniqueFilename = false,
                Overwrite = false
            };
            var result = await cloudinary.UploadAsync(parameters, cancellationToken);
            if (result.Error is not null || result.SecureUrl is null ||
                string.IsNullOrWhiteSpace(result.PublicId))
            {
                throw StorageUnavailable();
            }

            return new StoredImage(
                result.PublicId,
                result.SecureUrl.AbsoluteUri,
                result.Width,
                result.Height,
                result.Bytes);
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
        string storageKey,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        try
        {
            var result = await cloudinary.DestroyAsync(new DeletionParams(storageKey)
            {
                ResourceType = ResourceType.Image,
                Invalidate = true
            });
            if (result.Error is not null)
                throw StorageUnavailable();
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

    private static UseCaseException StorageUnavailable(Exception? inner = null) => new(
        ApplicationErrorKind.Unavailable,
        "Dịch vụ lưu trữ ảnh tạm thời không khả dụng.",
        "article_image_storage_unavailable",
        inner);
}

using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Student.Abstractions;

namespace SV5T.Infrastructure.Storage;

public sealed class CloudinaryEvidenceFileStorage(Cloudinary cloudinary) : IEvidenceFileStorage
{
    public async Task<StoredEvidenceFile> UploadAsync(
        Guid userId,
        Guid applicationId,
        Stream content,
        string fileName,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var parameters = new RawUploadParams
            {
                File = new FileDescription(Path.GetFileName(fileName), content),
                Folder = $"sv5t/users/{userId:N}/applications/{applicationId:N}/evidences",
                PublicId = Guid.NewGuid().ToString("N"),
                UniqueFilename = false,
                Overwrite = false,
                UseFilename = true,
                UseFilenameAsDisplayName = true
            };
            // "auto": Cloudinary tự nhận diện image/video/raw nên nhận
            // pdf/docx/xlsx/pptx/zip + ảnh trong cùng một pipeline.
            // ImageUploadParams chỉ nhận ảnh -> pdf/zip sẽ lỗi 400.
            var result = await cloudinary.UploadAsync(parameters, "auto", cancellationToken);
            if (result.Error is not null || result.SecureUrl is null ||
                string.IsNullOrWhiteSpace(result.PublicId))
            {
                throw StorageUnavailable();
            }

            content.TryGetLength(out var bytes);
            return new StoredEvidenceFile(
                result.SecureUrl.AbsoluteUri,
                result.PublicId,
                result.ResourceType ?? "raw",
                bytes,
                Path.GetFileName(fileName));
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
        string publicId, string resourceType, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await cloudinary.DestroyAsync(new DeletionParams(publicId)
        {
            ResourceType = MapResourceType(resourceType),
            Invalidate = true
        });
    }

    private static ResourceType MapResourceType(string resourceType) =>
        resourceType.ToLowerInvariant() switch
        {
            "video" => ResourceType.Video,
            "image" => ResourceType.Image,
            _ => ResourceType.Raw
        };

    private static UseCaseException StorageUnavailable(Exception? inner = null) =>
        new(
            ApplicationErrorKind.Internal,
            "Dich vu luu tru minh chung tam thoi khong kha dung.",
            "evidence_storage_unavailable");
}

internal static class StreamLengthExtensions
{
    public static bool TryGetLength(this Stream stream, out long length)
    {
        try
        {
            length = stream.CanSeek ? stream.Length : 0;
            return true;
        }
        catch
        {
            length = 0;
            return false;
        }
    }
}

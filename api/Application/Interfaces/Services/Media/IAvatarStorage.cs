namespace SV5T.Application.Interfaces.Services.Media;

public sealed record StoredAvatar(
    string Url,
    string PublicId,
    string ResourceType);

public interface IAvatarStorage
{
    Task<StoredAvatar> UploadAsync(
        Guid userId,
        Stream content,
        string fileName,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        string publicId,
        string resourceType,
        CancellationToken cancellationToken = default);
}

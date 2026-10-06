namespace SV5T.Application.Articles;

public sealed record StoredImage(
    string StorageKey,
    string Url,
    int Width,
    int Height,
    long SizeBytes);

public interface IArticleImageStorage
{
    Task<StoredImage> UploadAsync(
        Stream content,
        string fileName,
        string contentType,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(string storageKey, CancellationToken cancellationToken = default);
}

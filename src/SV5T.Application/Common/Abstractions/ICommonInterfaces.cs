namespace SV5T.Application.Common.Abstractions;

public interface ICurrentUser
{
    bool IsAuthenticated { get; }

    Guid? UserId { get; }

    bool IsInRole(string role);
}

public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);

    Task ExecuteInTransactionAsync(
        Func<CancellationToken, Task> operation,
        CancellationToken cancellationToken = default);
}

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

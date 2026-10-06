namespace SV5T.Application.Common.Abstractions;

using SV5T.Domain.Articles;

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

    IQueryable<Article> QueryArticles(bool tracking = false) =>
        throw new NotSupportedException();

    IQueryable<ArticleImage> QueryArticleImages(bool tracking = false) =>
        throw new NotSupportedException();

    IQueryable<Article> FilterArticleTitle(IQueryable<Article> query, string search) =>
        throw new NotSupportedException();

    void AddArticle(Article article) => throw new NotSupportedException();

    void AddArticleImage(ArticleImage image) => throw new NotSupportedException();

    void RemoveArticle(Article article) => throw new NotSupportedException();

    void RemoveArticleImage(ArticleImage image) => throw new NotSupportedException();

    void SetArticleOriginalRowVersion(Article article, byte[] rowVersion) =>
        throw new NotSupportedException();
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

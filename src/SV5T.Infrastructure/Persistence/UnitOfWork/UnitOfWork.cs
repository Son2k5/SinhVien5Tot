using Microsoft.EntityFrameworkCore;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Infrastructure.Persistence.Context;
using SV5T.Domain.Articles;

namespace SV5T.Infrastructure.Persistence.UnitOfWork;

public sealed class UnitOfWork(ApplicationDbContext dbContext) : IUnitOfWork
{
    public IQueryable<Article> QueryArticles(bool tracking = false) =>
        tracking ? dbContext.Articles : dbContext.Articles.AsNoTracking();

    public IQueryable<ArticleImage> QueryArticleImages(bool tracking = false) =>
        tracking ? dbContext.ArticleImages : dbContext.ArticleImages.AsNoTracking();

    public IQueryable<Article> FilterArticleTitle(IQueryable<Article> query, string search)
    {
        var escaped = search
            .Replace("\\", "\\\\", StringComparison.Ordinal)
            .Replace("%", "\\%", StringComparison.Ordinal)
            .Replace("_", "\\_", StringComparison.Ordinal);
        var pattern = $"%{escaped}%";
        return query.Where(x => EF.Functions.Like(x.Title, pattern, "\\"));
    }

    public void AddArticle(Article article) => dbContext.Articles.Add(article);

    public void AddArticleImage(ArticleImage image) => dbContext.ArticleImages.Add(image);

    public void RemoveArticle(Article article) => dbContext.Articles.Remove(article);

    public void RemoveArticleImage(ArticleImage image) => dbContext.ArticleImages.Remove(image);

    public void SetArticleOriginalRowVersion(Article article, byte[] rowVersion) =>
        dbContext.Entry(article).Property(x => x.RowVersion).OriginalValue = rowVersion;

    public async Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        try
        {
            return await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Dữ liệu đã bị thay đổi bởi thao tác khác trong lúc bạn đang thực hiện. Vui lòng tải lại trang và thử lại.",
                "concurrency_conflict");
        }
        catch (DbUpdateException exception) when (DbUniqueConstraintMapper.TryMapConflict(exception, out var conflictException))
        {
            throw conflictException!;
        }
    }

    public async Task ExecuteInTransactionAsync(
        Func<CancellationToken, Task> operation,
        CancellationToken cancellationToken = default)
    {
        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            await operation(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}

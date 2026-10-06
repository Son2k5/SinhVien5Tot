using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SV5T.Application.Articles;
using SV5T.Infrastructure.Persistence.Context;

namespace SV5T.Infrastructure.Articles;

public sealed class ArticleImageCleanupWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<ArticleImageCleanupWorker> logger) : BackgroundService
{
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromHours(6);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Article image cleanup cycle failed.");
            }

            try
            {
                await Task.Delay(CleanupInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
        }
    }

    private async Task CleanupAsync(CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var storage = scope.ServiceProvider.GetRequiredService<IArticleImageStorage>();
        var cutoff = DateTime.UtcNow.AddHours(-24);
        var images = await db.ArticleImages
            .AsNoTracking()
            .Where(x => x.ArticleId == null && x.CreatedAt < cutoff)
            .OrderBy(x => x.CreatedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        foreach (var image in images)
        {
            try
            {
                await storage.DeleteAsync(image.StorageKey, cancellationToken);
                db.ArticleImages.Remove(image);
                await db.SaveChangesAsync(cancellationToken);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception exception)
            {
                db.ChangeTracker.Clear();
                logger.LogWarning(
                    exception,
                    "Could not clean up orphan article image {ArticleImageId}.",
                    image.Id);
            }
        }
    }
}

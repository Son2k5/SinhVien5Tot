using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using MySqlConnector;
using SV5T.Application.Notifications;
using SV5T.Domain.Notifications;
using SV5T.Domain.Users.Enums;
using SV5T.Infrastructure.Persistence.Context;

namespace SV5T.Infrastructure.Notifications;

internal sealed class NotificationDispatchWorker(
    NotificationQueue queue,
    IServiceScopeFactory scopeFactory,
    ILogger<NotificationDispatchWorker> logger) : BackgroundService
{
    private const int InsertBatchSize = 500;
    private static readonly TimeSpan RetentionInterval = TimeSpan.FromHours(24);

    protected override Task ExecuteAsync(CancellationToken stoppingToken) =>
        Task.WhenAll(DispatchLoopAsync(stoppingToken), RetentionLoopAsync(stoppingToken));

    private async Task DispatchLoopAsync(CancellationToken stoppingToken)
    {
        await foreach (var job in queue.ReadAllAsync(stoppingToken))
        {
            try
            {
                await DispatchAsync(job, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception exception)
            {
                logger.LogError(
                    exception,
                    "Notification job {NotificationType} for target {TargetId} failed.",
                    job.Type,
                    job.TargetId);
            }
        }
    }

    private async Task DispatchAsync(NotificationJob job, CancellationToken cancellationToken)
    {
        await using var scope = scopeFactory.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var recipientIds = await ResolveRecipientsAsync(db, job, cancellationToken);
        var createdAt = DateTime.UtcNow;

        foreach (var batch in recipientIds.Distinct().Chunk(InsertBatchSize))
        {
            var notifications = batch.Select(recipientId => Notification.Create(
                recipientId,
                job.Type,
                job.Title,
                job.Body,
                job.TargetType,
                job.TargetId,
                job.ApplicationId,
                createdAt,
                job.DedupKey));
            await db.Notifications.AddRangeAsync(notifications, cancellationToken);
            try
            {
                await db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException exception)
                when (exception.InnerException is MySqlException { Number: 1062 })
            {
                db.ChangeTracker.Clear();
                logger.LogDebug(
                    "Skipped duplicate notification job {DedupKey} for one recipient batch.",
                    job.DedupKey);
            }
        }
    }

    private static async Task<IReadOnlyList<Guid>> ResolveRecipientsAsync(
        ApplicationDbContext db,
        NotificationJob job,
        CancellationToken cancellationToken)
    {
        if (job.Audience == NotificationAudience.AllStudents)
        {
            return await db.Users
                .AsNoTracking()
                .Where(x => x.Role == Role.User && x.IsActive && !x.IsDeleted)
                .Select(x => x.Id)
                .ToListAsync(cancellationToken);
        }

        if (job.Audience == NotificationAudience.SingleUser)
        {
            if (!job.RecipientUserId.HasValue)
                return [];
            return await db.Users
                .AsNoTracking()
                .Where(x =>
                    x.Id == job.RecipientUserId.Value &&
                    x.IsActive &&
                    !x.IsDeleted)
                .Select(x => x.Id)
                .ToListAsync(cancellationToken);
        }

        if (job.ApplicationId.HasValue)
        {
            var assignedMentor = await db.Applications
                .AsNoTracking()
                .Where(x => x.Id == job.ApplicationId.Value && x.AssignedReviewerId != null)
                .Select(x => x.AssignedReviewerId!.Value)
                .Join(
                    db.Users.AsNoTracking().Where(x =>
                        x.Role == Role.Mentor && x.IsActive && !x.IsDeleted),
                    assignedReviewerId => assignedReviewerId,
                    user => user.Id,
                    (_, user) => (Guid?)user.Id)
                .FirstOrDefaultAsync(cancellationToken);
            if (assignedMentor.HasValue)
                return [assignedMentor.Value];
        }

        return await db.Users
            .AsNoTracking()
            .Where(x => x.Role == Role.Admin && x.IsActive && !x.IsDeleted)
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);
    }

    private async Task RetentionLoopAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(RetentionInterval);
        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    await using var scope = scopeFactory.CreateAsyncScope();
                    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                    var now = DateTime.UtcNow;
                    var readCutoff = now.AddDays(-90);
                    var unreadCutoff = now.AddDays(-180);
                    var deleted = await db.Notifications
                        .Where(x =>
                            (x.IsRead && x.CreatedAt < readCutoff) ||
                            (!x.IsRead && x.CreatedAt < unreadCutoff))
                        .ExecuteDeleteAsync(stoppingToken);
                    logger.LogInformation("Deleted {Count} expired notifications.", deleted);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    return;
                }
                catch (Exception exception)
                {
                    logger.LogError(exception, "Notification retention cleanup failed.");
                }
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
    }
}

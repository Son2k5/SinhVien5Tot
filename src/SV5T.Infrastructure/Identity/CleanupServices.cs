using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SV5T.Domain.Auth;
using SV5T.Domain.Users;

namespace SV5T.Infrastructure.Identity;

internal sealed class RefreshTokenCleanupService(
    IServiceScopeFactory scopeFactory,
    ILogger<RefreshTokenCleanupService> logger) : BackgroundService
{
    private static readonly TimeSpan Retention = TimeSpan.FromDays(2);
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromHours(6);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var repository = scope.ServiceProvider
                    .GetRequiredService<IRefreshTokenRepository>();
                var deleted = await repository.DeleteStaleAsync(
                    DateTime.UtcNow.Subtract(Retention),
                    stoppingToken);
                if (deleted > 0)
                {
                    logger.LogInformation(
                        "Deleted {RefreshTokenCount} stale refresh tokens.",
                        deleted);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to clean stale refresh tokens.");
            }

            try
            {
                await Task.Delay(CleanupInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}

internal sealed class UnverifiedUserCleanupService(
    IServiceScopeFactory scopeFactory,
    ILogger<UnverifiedUserCleanupService> logger) : BackgroundService
{
    private static readonly TimeSpan Retention = TimeSpan.FromHours(24);
    private static readonly TimeSpan CleanupInterval = TimeSpan.FromHours(12);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await using var scope = scopeFactory.CreateAsyncScope();
                var repository = scope.ServiceProvider
                    .GetRequiredService<IUserRepository>();
                var deleted = await repository.DeleteUnverifiedBeforeAsync(
                    DateTime.UtcNow.Subtract(Retention),
                    stoppingToken);
                if (deleted > 0)
                {
                    logger.LogInformation(
                        "Deleted {UserCount} unverified user accounts older than {RetentionHours} hours.",
                        deleted,
                        Retention.TotalHours);
                }
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Failed to clean unverified user accounts.");
            }

            try
            {
                await Task.Delay(CleanupInterval, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
        }
    }
}


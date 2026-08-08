using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SV5T.Application.Interfaces.Repositories;

namespace SV5T.Infrastructure.Auth;

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

using MailKit.Net.Smtp;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Polly;
using Polly.Retry;
using StackExchange.Redis;

namespace SV5T.Infrastructure.Email;

internal sealed class EmailBackgroundWorker(
    RedisEmailQueue emailQueue,
    IEmailQuotaStore quotaStore,
    IEmailSender emailSender,
    ILogger<EmailBackgroundWorker> logger) : BackgroundService
{
    private static readonly TimeSpan EmptyQueueDelay =
        TimeSpan.FromMilliseconds(250);
    private static readonly TimeSpan StaleScanInterval =
        TimeSpan.FromSeconds(10);
    private static readonly TimeSpan RedisReconnectDelay =
        TimeSpan.FromSeconds(5);
    private readonly string consumerName =
        $"{Environment.MachineName}-{Environment.ProcessId}-{Guid.NewGuid():N}";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var retryPipeline = CreateRetryPipeline();
        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await quotaStore.InitializeAsync(stoppingToken);
                    await emailQueue.InitializeAsync(stoppingToken);
                    await ConsumeAsync(retryPipeline, stoppingToken);
                }
                catch (OperationCanceledException)
                    when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (RedisException exception)
                {
                    logger.LogError(
                        exception,
                        "Redis is unavailable; email worker will reconnect in {DelaySeconds} seconds.",
                        RedisReconnectDelay.TotalSeconds);
                    await Task.Delay(RedisReconnectDelay, stoppingToken);
                }
            }
        }
        finally
        {
            await emailSender.DisconnectAsync(CancellationToken.None);
        }
    }

    private async Task ConsumeAsync(
        ResiliencePipeline retryPipeline,
        CancellationToken stoppingToken)
    {
        var nextStaleScan = DateTime.UtcNow;
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTime.UtcNow;
            var scanStale = now >= nextStaleScan;
            if (scanStale)
            {
                nextStaleScan = now.Add(StaleScanInterval);
            }

            var queued = await emailQueue.ReadNextAsync(
                consumerName,
                scanStale,
                stoppingToken);
            if (queued is null)
            {
                await Task.Delay(EmptyQueueDelay, stoppingToken);
                continue;
            }

            if (!await WaitForDailyQuotaAsync(queued, stoppingToken))
            {
                continue;
            }

            try
            {
                await retryPipeline.ExecuteAsync(
                    async cancellationToken =>
                        await emailSender.SendAsync(
                            queued.Message,
                            cancellationToken),
                    stoppingToken);
            }
            catch (OperationCanceledException)
                when (stoppingToken.IsCancellationRequested)
            {
                return;
            }
            catch (Exception exception)
            {
                await TryReleaseQuotaAsync(queued.Id);
                await TryRecordFailureAsync(queued, exception);
                continue;
            }

            try
            {
                await emailQueue.CompleteAsync(
                    queued,
                    CancellationToken.None);
                logger.LogInformation(
                    "Email {EmailQueueId} sent successfully.",
                    queued.Id);
            }
            catch (Exception exception)
            {
                logger.LogCritical(
                    exception,
                    "SMTP accepted email {EmailQueueId}, but Redis acknowledgement failed; it may be delivered again.",
                    queued.Id);
            }
        }
    }

    private ResiliencePipeline CreateRetryPipeline() =>
        new ResiliencePipelineBuilder()
            .AddRetry(
                new RetryStrategyOptions
                {
                    MaxRetryAttempts = 2,
                    Delay = TimeSpan.FromSeconds(2),
                    BackoffType = DelayBackoffType.Exponential,
                    UseJitter = true,
                    ShouldHandle = new PredicateBuilder()
                        .Handle<SmtpCommandException>()
                        .Handle<SmtpProtocolException>(),
                    OnRetry = arguments =>
                    {
                        logger.LogWarning(
                            arguments.Outcome.Exception,
                            "Transient SMTP failure; retrying after {Delay}.",
                            arguments.RetryDelay);
                        return default;
                    }
                })
            .Build();

    private async Task<bool> WaitForDailyQuotaAsync(
        QueuedEmail queued,
        CancellationToken cancellationToken)
    {
        var isPasswordReset = string.Equals(
            queued.Message.TemplateKey,
            OtpEmailTemplate.ResetPasswordTemplateKey,
            StringComparison.Ordinal);
        var reservation = await quotaStore.TryReserveAsync(
            queued.Id,
            isPasswordReset,
            cancellationToken);
        if (reservation.Allowed)
        {
            return true;
        }

        var retryAt = reservation.RetryAtUtc ?? DateTime.UtcNow.AddMinutes(1);
        var delay = retryAt - DateTime.UtcNow;
        if (delay < TimeSpan.FromSeconds(1))
        {
            delay = TimeSpan.FromSeconds(1);
        }
        await Task.Delay(
            delay < TimeSpan.FromSeconds(30)
                ? delay
                : TimeSpan.FromSeconds(30),
            cancellationToken);
        return false;
    }

    private async Task TryRecordFailureAsync(
        QueuedEmail queued,
        Exception exception)
    {
        try
        {
            await emailQueue.RecordFailureAsync(
                queued,
                exception,
                CancellationToken.None);
        }
        catch (Exception redisException)
        {
            logger.LogCritical(
                redisException,
                "Could not persist failed delivery state for email {EmailQueueId}.",
                queued.Id);
        }
    }

    private async Task TryReleaseQuotaAsync(Guid emailQueueId)
    {
        try
        {
            await quotaStore.ReleaseAsync(
                emailQueueId,
                CancellationToken.None);
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Could not release distributed quota reservation for email {EmailQueueId}.",
                emailQueueId);
        }
    }
}



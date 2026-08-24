using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Models;
using SV5T.Infrastructure.Options;

namespace SV5T.Infrastructure.Email;

internal sealed record QueuedEmail(
    RedisKey Stream,
    RedisValue StreamId,
    Guid Id,
    EmailMessage Message,
    string ProtectedPayload);

internal sealed class RedisEmailQueue : IEmailQueue
{
    private const string ConsumerGroup = "email-workers";
    private static readonly RedisValue Beginning = "0-0";
    private readonly IDatabase database;
    private readonly IEmailPayloadProtector payloadProtector;
    private readonly ILogger<RedisEmailQueue> logger;
    private readonly EmailSettings settings;
    private readonly RedisKey priorityStream;
    private readonly RedisKey standardStream;
    private readonly RedisKey deadLetterStream;
    private readonly string retryKeyPrefix;

    public RedisEmailQueue(
        IConnectionMultiplexer connection,
        IEmailPayloadProtector payloadProtector,
        IOptions<EmailSettings> emailOptions,
        IOptions<RedisOptions> redisOptions,
        ILogger<RedisEmailQueue> logger)
    {
        database = connection.GetDatabase();
        this.payloadProtector = payloadProtector;
        this.logger = logger;
        settings = emailOptions.Value;
        var prefix = redisOptions.Value.KeyPrefix;
        priorityStream = $"{prefix}email:stream:priority";
        standardStream = $"{prefix}email:stream:standard";
        deadLetterStream = $"{prefix}email:stream:dead-letter";
        retryKeyPrefix = $"{prefix}email:retry:";
    }

    public async Task<Guid> EnqueueAsync(
        EmailMessage message,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(message);
        ArgumentException.ThrowIfNullOrWhiteSpace(message.To);
        ArgumentException.ThrowIfNullOrWhiteSpace(message.Subject);
        ArgumentException.ThrowIfNullOrWhiteSpace(message.Body);
        cancellationToken.ThrowIfCancellationRequested();

        try
        {
            var lengths = await Task.WhenAll(
                database.StreamLengthAsync(priorityStream),
                database.StreamLengthAsync(standardStream));
            if (lengths.Sum() >= settings.MaxPendingMessages)
            {
                throw new UseCaseException(
                    ApplicationErrorKind.Unavailable,
                    "Dịch vụ gửi email đang quá tải. Vui lòng thử lại sau.",
                    "email_queue_full");
            }

            var id = Guid.NewGuid();
            var normalized = message with { To = message.To.Trim() };
            var protectedPayload = payloadProtector.Protect(
                JsonSerializer.Serialize(normalized));
            var stream = IsPasswordReset(normalized)
                ? priorityStream
                : standardStream;
            await database.StreamAddAsync(
                stream,
                [
                    new NameValueEntry("id", id.ToString("N")),
                    new NameValueEntry("payload", protectedPayload)
                ]);
            logger.LogInformation(
                "Email {EmailQueueId} added to Redis Stream.",
                id);
            return id;
        }
        catch (RedisException exception)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Unavailable,
                "Dịch vụ gửi email đang tạm thời gián đoạn. Vui lòng thử lại sau.",
                "email_queue_unavailable",
                exception);
        }
    }

    internal async Task InitializeAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await EnsureConsumerGroupAsync(priorityStream);
        await EnsureConsumerGroupAsync(standardStream);
    }

    internal async Task<QueuedEmail?> ReadNextAsync(
        string consumerName,
        bool claimStale,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (claimStale)
        {
            var claimed = await ClaimOneAsync(priorityStream, consumerName) ??
                          await ClaimOneAsync(standardStream, consumerName);
            if (claimed is not null)
            {
                return claimed;
            }
        }

        return await ReadOneAsync(priorityStream, consumerName) ??
               await ReadOneAsync(standardStream, consumerName);
    }

    internal async Task CompleteAsync(
        QueuedEmail queued,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var batch = database.CreateBatch();
        var acknowledge = batch.StreamAcknowledgeAsync(
            queued.Stream,
            ConsumerGroup,
            queued.StreamId);
        var delete = batch.StreamDeleteAsync(queued.Stream, [queued.StreamId]);
        var clearRetry = batch.KeyDeleteAsync(RetryKey(queued.Id));
        batch.Execute();
        await Task.WhenAll(acknowledge, delete, clearRetry);
    }

    internal async Task RecordFailureAsync(
        QueuedEmail queued,
        Exception exception,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var retryKey = RetryKey(queued.Id);
        var attempts = await database.StringIncrementAsync(retryKey);
        await database.KeyExpireAsync(retryKey, TimeSpan.FromDays(1));
        if (attempts < settings.MaxDeliveryAttempts)
        {
            logger.LogWarning(
                exception,
                "Email {EmailQueueId} failed delivery cycle {Attempt}/{Maximum}; it remains pending for retry.",
                queued.Id,
                attempts,
                settings.MaxDeliveryAttempts);
            return;
        }

        var error = TruncateError(exception.Message);
        await database.StreamAddAsync(
            deadLetterStream,
            [
                new NameValueEntry("id", queued.Id.ToString("N")),
                new NameValueEntry("payload", queued.ProtectedPayload),
                new NameValueEntry("error", error),
                new NameValueEntry(
                    "failedAt",
                    DateTimeOffset.UtcNow.ToUnixTimeMilliseconds())
            ],
            maxLength: settings.DeadLetterMaxLength,
            useApproximateMaxLength: true);
        await database.KeyExpireAsync(
            deadLetterStream,
            TimeSpan.FromDays(settings.DeadLetterRetentionDays));
        await CompleteAsync(queued, cancellationToken);
        logger.LogError(
            exception,
            "Email {EmailQueueId} moved to the Redis dead-letter stream after {AttemptCount} failed cycles.",
            queued.Id,
            attempts);
    }

    private async Task EnsureConsumerGroupAsync(RedisKey stream)
    {
        try
        {
            await database.StreamCreateConsumerGroupAsync(
                stream,
                ConsumerGroup,
                StreamPosition.Beginning,
                createStream: true);
        }
        catch (RedisServerException exception)
            when (exception.Message.Contains("BUSYGROUP", StringComparison.Ordinal))
        {
            // A consumer group is shared by all API instances.
        }
    }

    private async Task<QueuedEmail?> ReadOneAsync(
        RedisKey stream,
        string consumerName)
    {
        var entries = await database.StreamReadGroupAsync(
            stream,
            ConsumerGroup,
            consumerName,
            StreamPosition.NewMessages,
            count: 1);
        return entries.Length == 0
            ? null
            : await ParseOrRejectAsync(stream, entries[0]);
    }

    private async Task<QueuedEmail?> ClaimOneAsync(
        RedisKey stream,
        string consumerName)
    {
        var result = await database.StreamAutoClaimAsync(
            stream,
            ConsumerGroup,
            consumerName,
            settings.RetryDelaySeconds * 1_000L,
            Beginning,
            count: 1);
        return result.ClaimedEntries.Length == 0
            ? null
            : await ParseOrRejectAsync(stream, result.ClaimedEntries[0]);
    }

    private async Task<QueuedEmail?> ParseOrRejectAsync(
        RedisKey stream,
        StreamEntry entry)
    {
        var idValue = entry.Values
            .FirstOrDefault(value => value.Name == "id")
            .Value;
        var payloadValue = entry.Values
            .FirstOrDefault(value => value.Name == "payload")
            .Value;
        try
        {
            if (!Guid.TryParseExact(idValue.ToString(), "N", out var id) ||
                payloadValue.IsNullOrEmpty)
            {
                throw new InvalidOperationException(
                    "Redis email entry is malformed.");
            }

            var protectedPayload = payloadValue.ToString();
            var message = JsonSerializer.Deserialize<EmailMessage>(
                payloadProtector.Unprotect(protectedPayload)) ??
                throw new InvalidOperationException(
                    "Redis email payload is empty.");
            return new QueuedEmail(
                stream,
                entry.Id,
                id,
                message,
                protectedPayload);
        }
        catch (Exception exception) when (exception is not RedisException)
        {
            var fallbackId = Guid.TryParseExact(
                idValue.ToString(),
                "N",
                out var id)
                ? id
                : Guid.NewGuid();
            await MoveMalformedToDeadLetterAsync(
                new QueuedEmail(
                    stream,
                    entry.Id,
                    fallbackId,
                    new EmailMessage("invalid", "invalid", "invalid"),
                    payloadValue.ToString()),
                exception);
            return null;
        }
    }

    private async Task MoveMalformedToDeadLetterAsync(
        QueuedEmail queued,
        Exception exception)
    {
        await database.StreamAddAsync(
            deadLetterStream,
            [
                new NameValueEntry("id", queued.Id.ToString("N")),
                new NameValueEntry("payload", queued.ProtectedPayload),
                new NameValueEntry("error", TruncateError(exception.Message)),
                new NameValueEntry(
                    "failedAt",
                    DateTimeOffset.UtcNow.ToUnixTimeMilliseconds())
            ],
            maxLength: settings.DeadLetterMaxLength,
            useApproximateMaxLength: true);
        await database.KeyExpireAsync(
            deadLetterStream,
            TimeSpan.FromDays(settings.DeadLetterRetentionDays));
        await database.StreamAcknowledgeAsync(
            queued.Stream,
            ConsumerGroup,
            queued.StreamId);
        await database.StreamDeleteAsync(queued.Stream, [queued.StreamId]);
        logger.LogError(
            exception,
            "Malformed Redis email {EmailQueueId} moved to dead-letter stream.",
            queued.Id);
    }

    private RedisKey RetryKey(Guid id) =>
        $"{retryKeyPrefix}{id:N}";

    private static string TruncateError(string error) =>
        error.Length <= 4_000 ? error : error[..4_000];

    private static bool IsPasswordReset(EmailMessage message) =>
        string.Equals(
            message.TemplateKey,
            OtpEmailTemplate.ResetPasswordTemplateKey,
            StringComparison.Ordinal);
}



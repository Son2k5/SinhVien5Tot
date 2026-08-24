using Microsoft.Extensions.Options;
using StackExchange.Redis;
using SV5T.Infrastructure.Options;

namespace SV5T.Infrastructure.Email;

internal sealed class RedisEmailQuotaStore(
    IConnectionMultiplexer connection,
    IOptions<EmailSettings> emailOptions,
    IOptions<RedisOptions> redisOptions) : IEmailQuotaStore
{
    private static readonly TimeSpan Window = TimeSpan.FromHours(24);
    private readonly IDatabase database = connection.GetDatabase();
    private readonly EmailSettings email = emailOptions.Value;
    private readonly RedisKey quotaKey =
        $"{redisOptions.Value.KeyPrefix}email:recipient-quota";

    public Task InitializeAsync(CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        return Task.CompletedTask;
    }

    public async Task<EmailQuotaReservation> TryReserveAsync(
        Guid emailQueueId,
        bool isPasswordReset,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (email.DailyRecipientLimit == 0)
        {
            return new EmailQuotaReservation(true);
        }

        const string script = """
            local existing = redis.call('ZSCORE', KEYS[1], ARGV[3])
            if existing then return {1, 0} end
            redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', ARGV[1])
            local count = redis.call('ZCARD', KEYS[1])
            if count >= tonumber(ARGV[4]) then
                local oldest = redis.call('ZRANGE', KEYS[1], 0, 0, 'WITHSCORES')
                return {0, oldest[2]}
            end
            redis.call('ZADD', KEYS[1], ARGV[2], ARGV[3])
            redis.call('EXPIRE', KEYS[1], 90000)
            return {1, 0}
            """;

        var now = DateTimeOffset.UtcNow;
        var effectiveLimit = isPasswordReset
            ? email.DailyRecipientLimit
            : email.DailyRecipientLimit - email.PasswordResetReserve;
        var rawResult = await database.ScriptEvaluateAsync(
            script,
            [quotaKey],
            [
                now.Subtract(Window).ToUnixTimeMilliseconds(),
                now.ToUnixTimeMilliseconds(),
                emailQueueId.ToString("N"),
                effectiveLimit
            ]);
        var result = (RedisResult[]?)rawResult;
        if (result is null || result.Length < 2)
        {
            throw new InvalidOperationException(
                "Redis returned an invalid email quota result.");
        }

        if ((long)result[0] == 1)
        {
            return new EmailQuotaReservation(true);
        }

        var retryAt = long.TryParse(result[1].ToString(), out var oldestUnixMs)
            ? DateTimeOffset.FromUnixTimeMilliseconds(oldestUnixMs)
                .Add(Window)
                .UtcDateTime
            : DateTime.UtcNow.AddMinutes(1);
        return new EmailQuotaReservation(false, retryAt);
    }

    public async Task ReleaseAsync(
        Guid emailQueueId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        if (email.DailyRecipientLimit > 0)
        {
            await database.SortedSetRemoveAsync(
                quotaKey,
                emailQueueId.ToString("N"));
        }
    }
}



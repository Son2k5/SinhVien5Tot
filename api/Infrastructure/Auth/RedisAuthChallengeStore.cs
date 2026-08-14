using System.Globalization;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Interfaces.Services.Auth;
using SV5T.Application.Models.Auth;
using SV5T.Domain.Enums;
using SV5T.Infrastructure.Options.Integrations;

namespace SV5T.Infrastructure.Auth;

internal sealed class RedisAuthChallengeStore(
    IConnectionMultiplexer connection,
    IAuthChallengePayloadProtector payloadProtector,
    IOptions<RedisOptions> options,
    ILogger<RedisAuthChallengeStore> logger) : IAuthChallengeStore
{
    private sealed record SensitivePayload(
        string Email,
        string NormalizedEmail,
        string? DisplayName,
        string? PasswordHash);

    private readonly IDatabase database = connection.GetDatabase();
    private readonly string keyPrefix = options.Value.KeyPrefix;

    public async Task<AuthChallengeData?> GetAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        HashEntry[] entries;
        try
        {
            entries = await database.HashGetAllAsync(Key(id));
        }
        catch (RedisException exception)
        {
            throw RedisUnavailable(exception);
        }
        if (entries.Length == 0)
        {
            return null;
        }

        var values = entries.ToDictionary(
            entry => entry.Name.ToString(),
            entry => entry.Value.ToString(),
            StringComparer.Ordinal);
        try
        {
            if (!TryParse(values, id, out var challenge))
            {
                throw new InvalidOperationException(
                    "Redis authentication challenge is malformed.");
            }

            return challenge;
        }
        catch (Exception exception) when (exception is not RedisException)
        {
            await database.KeyDeleteAsync(Key(id));
            logger.LogError(
                exception,
                "Removed malformed authentication challenge {ChallengeId} from Redis.",
                id);
            return null;
        }
    }

    public async Task StoreAsync(
        AuthChallengeData challenge,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var sensitivePayload = new SensitivePayload(
            challenge.Email,
            challenge.NormalizedEmail,
            challenge.DisplayName,
            challenge.PasswordHash);
        var protectedPayload = payloadProtector.Protect(
            JsonSerializer.Serialize(sensitivePayload));

        const string script = """
            if redis.call('EXISTS', KEYS[1]) == 1 then return 0 end
            redis.call('HSET', KEYS[1],
                'purpose', ARGV[1],
                'payload', ARGV[2],
                'otpHash', ARGV[3],
                'failedAttempts', ARGV[4],
                'maxAttempts', ARGV[5],
                'expiresAt', ARGV[6],
                'createdAt', ARGV[7])
            redis.call('EXPIRE', KEYS[1], ARGV[8])
            return 1
            """;
        long stored;
        try
        {
            stored = (long)await database.ScriptEvaluateAsync(
                script,
                [Key(challenge.Id)],
                [
                    (int)challenge.Purpose,
                    protectedPayload,
                    challenge.OtpHash,
                    challenge.FailedAttempts,
                    challenge.MaxAttempts,
                    ToUnixMilliseconds(challenge.ExpiresAtUtc),
                    ToUnixMilliseconds(challenge.CreatedAtUtc),
                    TtlSeconds(challenge.ExpiresAtUtc)
                ]);
        }
        catch (RedisException exception)
        {
            throw RedisUnavailable(exception);
        }
        if (stored != 1)
        {
            throw new InvalidOperationException(
                "Authentication challenge id already exists.");
        }
    }

    public async Task DeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        try
        {
            await database.KeyDeleteAsync(Key(id));
        }
        catch (RedisException exception)
        {
            throw RedisUnavailable(exception);
        }
    }

    public async Task<int> IncrementFailureAsync(
        Guid id,
        AuthChallengePurpose purpose,
        DateTime nowUtc,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        const string script = """
            if redis.call('EXISTS', KEYS[1]) == 0 then return -1 end
            if redis.call('HGET', KEYS[1], 'purpose') ~= ARGV[1] then return -1 end
            local expiresAt = tonumber(redis.call('HGET', KEYS[1], 'expiresAt'))
            local attempts = tonumber(redis.call('HGET', KEYS[1], 'failedAttempts'))
            local maximum = tonumber(redis.call('HGET', KEYS[1], 'maxAttempts'))
            if not expiresAt or expiresAt <= tonumber(ARGV[2]) or
               not attempts or not maximum or attempts >= maximum then return -1 end
            return redis.call('HINCRBY', KEYS[1], 'failedAttempts', 1)
            """;
        try
        {
            return (int)(long)await database.ScriptEvaluateAsync(
                script,
                [Key(id)],
                [(int)purpose, ToUnixMilliseconds(nowUtc)]);
        }
        catch (RedisException exception)
        {
            throw RedisUnavailable(exception);
        }
    }

    public async Task<bool> TryConsumeAsync(
        Guid id,
        AuthChallengePurpose purpose,
        string expectedOtpHash,
        DateTime consumedAtUtc,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        const string script = """
            if redis.call('EXISTS', KEYS[1]) == 0 then return 0 end
            if redis.call('HGET', KEYS[1], 'purpose') ~= ARGV[1] or
               redis.call('HGET', KEYS[1], 'otpHash') ~= ARGV[2] then return 0 end
            local expiresAt = tonumber(redis.call('HGET', KEYS[1], 'expiresAt'))
            local attempts = tonumber(redis.call('HGET', KEYS[1], 'failedAttempts'))
            local maximum = tonumber(redis.call('HGET', KEYS[1], 'maxAttempts'))
            if not expiresAt or expiresAt <= tonumber(ARGV[3]) or
               not attempts or not maximum or attempts >= maximum then return 0 end
            return redis.call('DEL', KEYS[1])
            """;
        try
        {
            var consumed = (long)await database.ScriptEvaluateAsync(
                script,
                [Key(id)],
                [(int)purpose, expectedOtpHash, ToUnixMilliseconds(consumedAtUtc)]);
            return consumed == 1;
        }
        catch (RedisException exception)
        {
            throw RedisUnavailable(exception);
        }
    }

    public async Task<bool> TryReplaceOtpAsync(
        Guid id,
        AuthChallengePurpose purpose,
        string otpHash,
        DateTime expiresAtUtc,
        DateTime updatedAtUtc,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        const string script = """
            if redis.call('EXISTS', KEYS[1]) == 0 or
               redis.call('HGET', KEYS[1], 'purpose') ~= ARGV[1] then return 0 end
            redis.call('HSET', KEYS[1],
                'otpHash', ARGV[2],
                'failedAttempts', 0,
                'expiresAt', ARGV[3],
                'updatedAt', ARGV[4])
            redis.call('EXPIRE', KEYS[1], ARGV[5])
            return 1
            """;
        try
        {
            var replaced = (long)await database.ScriptEvaluateAsync(
                script,
                [Key(id)],
                [
                    (int)purpose,
                    otpHash,
                    ToUnixMilliseconds(expiresAtUtc),
                    ToUnixMilliseconds(updatedAtUtc),
                    TtlSeconds(expiresAtUtc)
                ]);
            return replaced == 1;
        }
        catch (RedisException exception)
        {
            throw RedisUnavailable(exception);
        }
    }

    private bool TryParse(
        IReadOnlyDictionary<string, string> values,
        Guid id,
        out AuthChallengeData? challenge)
    {
        challenge = null;
        if (!TryGetInt(values, "purpose", out var purpose) ||
            !Enum.IsDefined(typeof(AuthChallengePurpose), purpose) ||
            !values.TryGetValue("payload", out var protectedPayload) ||
            !values.TryGetValue("otpHash", out var otpHash) ||
            !TryGetInt(values, "failedAttempts", out var failedAttempts) ||
            !TryGetInt(values, "maxAttempts", out var maxAttempts) ||
            !TryGetDateTime(values, "expiresAt", out var expiresAtUtc) ||
            !TryGetDateTime(values, "createdAt", out var createdAtUtc))
        {
            return false;
        }

        var payload = JsonSerializer.Deserialize<SensitivePayload>(
            payloadProtector.Unprotect(protectedPayload));
        if (payload is null ||
            string.IsNullOrWhiteSpace(payload.Email) ||
            string.IsNullOrWhiteSpace(payload.NormalizedEmail))
        {
            return false;
        }

        challenge = new AuthChallengeData(
            id,
            (AuthChallengePurpose)purpose,
            payload.Email,
            payload.NormalizedEmail,
            payload.DisplayName,
            payload.PasswordHash,
            otpHash,
            failedAttempts,
            maxAttempts,
            expiresAtUtc,
            createdAtUtc);
        return true;
    }

    private RedisKey Key(Guid id) =>
        $"{keyPrefix}auth:challenge:{id:N}";

    private static bool TryGetInt(
        IReadOnlyDictionary<string, string> values,
        string name,
        out int value)
    {
        value = default;
        return values.TryGetValue(name, out var raw) &&
               int.TryParse(
                   raw,
                   NumberStyles.Integer,
                   CultureInfo.InvariantCulture,
                   out value);
    }

    private static bool TryGetDateTime(
        IReadOnlyDictionary<string, string> values,
        string name,
        out DateTime value)
    {
        value = default;
        return values.TryGetValue(name, out var raw) &&
               long.TryParse(
                   raw,
                   NumberStyles.Integer,
                   CultureInfo.InvariantCulture,
                   out var unixMilliseconds) &&
               TryFromUnixMilliseconds(unixMilliseconds, out value);
    }

    private static bool TryFromUnixMilliseconds(
        long unixMilliseconds,
        out DateTime value)
    {
        try
        {
            value = DateTimeOffset
                .FromUnixTimeMilliseconds(unixMilliseconds)
                .UtcDateTime;
            return true;
        }
        catch (ArgumentOutOfRangeException)
        {
            value = default;
            return false;
        }
    }

    private static long ToUnixMilliseconds(DateTime value) =>
        new DateTimeOffset(DateTime.SpecifyKind(value, DateTimeKind.Utc))
            .ToUnixTimeMilliseconds();

    private static long TtlSeconds(DateTime expiresAtUtc) =>
        Math.Max(
            1,
            (long)Math.Ceiling((expiresAtUtc - DateTime.UtcNow).TotalSeconds));

    private static UseCaseException RedisUnavailable(RedisException exception) =>
        new(
            ApplicationErrorKind.Unavailable,
            "Dịch vụ xác thực OTP đang tạm thời gián đoạn. Vui lòng thử lại sau.",
            "auth_challenge_store_unavailable",
            exception);
}

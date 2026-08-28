using System.Globalization;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Models;
using SV5T.Domain.Auth.Enums;
using SV5T.Infrastructure.Options;

namespace SV5T.Infrastructure.Identity;

public sealed class RedisAuthChallengeStore(
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
            logger.LogWarning(
                exception,
                "Authentication challenge {ChallengeId} is malformed in Redis.",
                id);
            return null;
        }
    }

    public async Task StoreAsync(
        AuthChallengeData challenge,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var ttl = TtlSeconds(challenge.ExpiresAtUtc);
        var entries = new HashEntry[]
        {
            new("p", (int)challenge.Purpose),
            new("d", payloadProtector.Protect(
                JsonSerializer.Serialize(new SensitivePayload(
                    challenge.Email,
                    challenge.NormalizedEmail,
                    challenge.DisplayName,
                    challenge.PasswordHash)))),
            new("h", challenge.OtpHash),
            new("f", challenge.FailedAttempts),
            new("m", challenge.MaxAttempts),
            new("e", ToUnixMilliseconds(challenge.ExpiresAtUtc)),
            new("c", ToUnixMilliseconds(challenge.CreatedAtUtc))
        };
        try
        {
            var key = Key(challenge.Id);
            var transaction = database.CreateTransaction();
            _ = transaction.HashSetAsync(key, entries);
            _ = transaction.KeyExpireAsync(key, TimeSpan.FromSeconds(ttl));
            if (!await transaction.ExecuteAsync())
            {
                throw new InvalidOperationException(
                    "Failed to persist authentication challenge in Redis.");
            }
        }
        catch (RedisException exception)
        {
            throw RedisUnavailable(exception);
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
            local purpose = tonumber(redis.call('HGET', KEYS[1], 'p'))
            if purpose ~= tonumber(ARGV[1]) then return -2 end
            local expiresAt = tonumber(redis.call('HGET', KEYS[1], 'e'))
            if not expiresAt or expiresAt <= tonumber(ARGV[2]) then return -3 end
            local failures = redis.call('HINCRBY', KEYS[1], 'f', 1)
            local maxAttempts = tonumber(redis.call('HGET', KEYS[1], 'm'))
            if maxAttempts and failures >= maxAttempts then
                redis.call('DEL', KEYS[1])
                return -4
            end
            return failures
            """;
        try
        {
            var result = (long)await database.ScriptEvaluateAsync(
                script,
                [Key(id)],
                [(int)purpose, ToUnixMilliseconds(nowUtc)]);
            return (int)result;
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
            local purpose = tonumber(redis.call('HGET', KEYS[1], 'p'))
            if purpose ~= tonumber(ARGV[1]) then return 0 end
            local expiresAt = tonumber(redis.call('HGET', KEYS[1], 'e'))
            if not expiresAt or expiresAt <= tonumber(ARGV[3]) then return 0 end
            local currentHash = redis.call('HGET', KEYS[1], 'h')
            if currentHash ~= ARGV[2] then return 0 end
            redis.call('DEL', KEYS[1])
            return 1
            """;
        try
        {
            var result = (long)await database.ScriptEvaluateAsync(
                script,
                [Key(id)],
                [(int)purpose, expectedOtpHash, ToUnixMilliseconds(consumedAtUtc)]);
            return result == 1;
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
            if redis.call('EXISTS', KEYS[1]) == 0 then return 0 end
            local purpose = tonumber(redis.call('HGET', KEYS[1], 'p'))
            if purpose ~= tonumber(ARGV[1]) then return 0 end
            redis.call('HSET', KEYS[1], 'h', ARGV[2], 'e', ARGV[3], 'f', 0)
            redis.call('EXPIRE', KEYS[1], ARGV[4])
            return 1
            """;
        try
        {
            var result = (long)await database.ScriptEvaluateAsync(
                script,
                [Key(id)],
                [
                    (int)purpose,
                    otpHash,
                    ToUnixMilliseconds(expiresAtUtc),
                    TtlSeconds(expiresAtUtc)
                ]);
            return result == 1;
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
        if (!TryGetInt(values, "p", out var purposeInt) ||
            !Enum.IsDefined(typeof(AuthChallengePurpose), purposeInt) ||
            !values.TryGetValue("d", out var payloadEnvelope) ||
            !values.TryGetValue("h", out var otpHash) ||
            !TryGetInt(values, "f", out var failedAttempts) ||
            !TryGetInt(values, "m", out var maxAttempts) ||
            !TryGetDateTime(values, "e", out var expiresAtUtc) ||
            !TryGetDateTime(values, "c", out var createdAtUtc))
        {
            return false;
        }

        var decrypted = payloadProtector.Unprotect(payloadEnvelope);
        var payload = JsonSerializer.Deserialize<SensitivePayload>(decrypted);
        if (payload is null ||
            string.IsNullOrWhiteSpace(payload.Email) ||
            string.IsNullOrWhiteSpace(payload.NormalizedEmail))
        {
            return false;
        }

        challenge = new AuthChallengeData(
            id,
            (AuthChallengePurpose)purposeInt,
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
            ApplicationErrorKind.Internal,
            "Dịch vụ xác thực OTP đang tạm thời gián đoạn. Vui lòng thử lại sau.",
            "auth_challenge_store_unavailable");
}


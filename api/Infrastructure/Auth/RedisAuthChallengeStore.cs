using System.Globalization;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using SV5T.Application.Interfaces.Services.Auth;
using SV5T.Application.Models.Auth;
using SV5T.Domain.Enums;
using SV5T.Infrastructure.Options.Integrations;

namespace SV5T.Infrastructure.Auth;

public sealed class RedisAuthChallengeStore(
    IConnectionMultiplexer connection,
    IOptions<RedisOptions> options) : IAuthChallengeStore
{
    private static readonly TimeSpan ExpiredChallengeRetention = TimeSpan.FromHours(1);
    private readonly IDatabase database = connection.GetDatabase();
    private readonly string keyPrefix = options.Value.KeyPrefix;

    private RedisKey Key(Guid id) => $"{keyPrefix}auth:challenge:{id:N}";

    public async Task<AuthChallengeData?> GetAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var entries = await database.HashGetAllAsync(Key(id));
        if (entries.Length == 0)
        {
            return null;
        }

        var values = entries.ToDictionary(
            entry => entry.Name.ToString(),
            entry => entry.Value.ToString(),
            StringComparer.Ordinal);
        if (!TryParse(values, id, out var challenge))
        {
            await database.KeyDeleteAsync(Key(id));
            return null;
        }

        return challenge;
    }

    public async Task StoreAsync(
        AuthChallengeData challenge,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var ttlSeconds = RetentionSeconds(challenge.ExpiresAtUtc);
        const string script = """
            if redis.call('EXISTS', KEYS[1]) == 1 then return 0 end
            redis.call('HSET', KEYS[1],
                'purpose', ARGV[1],
                'email', ARGV[2],
                'normalizedEmail', ARGV[3],
                'passwordHash', ARGV[4],
                'otpHash', ARGV[5],
                'failedAttempts', ARGV[6],
                'maxAttempts', ARGV[7],
                'expiresAt', ARGV[8],
                'createdAt', ARGV[9])
            redis.call('EXPIRE', KEYS[1], ARGV[10])
            return 1
            """;
        var stored = (long)await database.ScriptEvaluateAsync(
            script,
            [Key(challenge.Id)],
            [
                (int)challenge.Purpose,
                challenge.Email,
                challenge.NormalizedEmail,
                challenge.PasswordHash ?? string.Empty,
                challenge.OtpHash,
                challenge.FailedAttempts,
                challenge.MaxAttempts,
                ToUnixMilliseconds(challenge.ExpiresAtUtc),
                ToUnixMilliseconds(challenge.CreatedAtUtc),
                ttlSeconds
            ]);
        if (stored != 1)
        {
            throw new InvalidOperationException("Authentication challenge id already exists.");
        }
    }

    public async Task DeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        await database.KeyDeleteAsync(Key(id));
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
        return (int)(long)await database.ScriptEvaluateAsync(
            script,
            [Key(id)],
            [(int)purpose, ToUnixMilliseconds(nowUtc)]);
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
        var consumed = (long)await database.ScriptEvaluateAsync(
            script,
            [Key(id)],
            [(int)purpose, expectedOtpHash, ToUnixMilliseconds(consumedAtUtc)]);
        return consumed == 1;
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
        var replaced = (long)await database.ScriptEvaluateAsync(
            script,
            [Key(id)],
            [
                (int)purpose,
                otpHash,
                ToUnixMilliseconds(expiresAtUtc),
                ToUnixMilliseconds(updatedAtUtc),
                RetentionSeconds(expiresAtUtc)
            ]);
        return replaced == 1;
    }

    private static bool TryParse(
        IReadOnlyDictionary<string, string> values,
        Guid id,
        out AuthChallengeData? challenge)
    {
        challenge = null;
        if (!TryGetInt(values, "purpose", out var purpose) ||
            !Enum.IsDefined(typeof(AuthChallengePurpose), purpose) ||
            !values.TryGetValue("email", out var email) ||
            !values.TryGetValue("normalizedEmail", out var normalizedEmail) ||
            !values.TryGetValue("otpHash", out var otpHash) ||
            !TryGetInt(values, "failedAttempts", out var failedAttempts) ||
            !TryGetInt(values, "maxAttempts", out var maxAttempts) ||
            !TryGetDateTime(values, "expiresAt", out var expiresAtUtc) ||
            !TryGetDateTime(values, "createdAt", out var createdAtUtc))
        {
            return false;
        }

        values.TryGetValue("passwordHash", out var passwordHash);
        challenge = new AuthChallengeData(
            id,
            (AuthChallengePurpose)purpose,
            email,
            normalizedEmail,
            string.IsNullOrEmpty(passwordHash) ? null : passwordHash,
            otpHash,
            failedAttempts,
            maxAttempts,
            expiresAtUtc,
            createdAtUtc);
        return true;
    }

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
               long.TryParse(raw, NumberStyles.Integer, CultureInfo.InvariantCulture, out var unixMs) &&
               TryFromUnixMilliseconds(unixMs, out value);
    }

    private static bool TryFromUnixMilliseconds(long unixMs, out DateTime value)
    {
        try
        {
            value = DateTimeOffset.FromUnixTimeMilliseconds(unixMs).UtcDateTime;
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

    private static long RetentionSeconds(DateTime expiresAtUtc) =>
        Math.Max(
            1,
            (long)Math.Ceiling(
                (expiresAtUtc - DateTime.UtcNow + ExpiredChallengeRetention)
                .TotalSeconds));
}

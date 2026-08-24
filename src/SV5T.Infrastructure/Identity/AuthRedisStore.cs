using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;
using SV5T.Application.Common.Interfaces;
using SV5T.Infrastructure.Options;

namespace SV5T.Infrastructure.Identity;

public sealed class AuthRedisStore(
    IConnectionMultiplexer connection,
    ISha256Hasher hasher,
    IOptions<OtpOptions> otpOptions,
    IOptions<RedisOptions> redisOptions,
    ILogger<AuthRedisStore> logger) : IAuthRedisStore
{
    private sealed record CounterState(int Count, DateTime ExpiresAtUtc);
    private sealed record OtpState(int Count, DateTime WindowEndsUtc, DateTime CooldownEndsUtc);

    private readonly IDatabase db = connection.GetDatabase();
    private readonly OtpOptions otp = otpOptions.Value;
    private readonly RedisOptions redis = redisOptions.Value;
    private readonly ConcurrentDictionary<string, CounterState> fallbackCounters = new();
    private readonly ConcurrentDictionary<string, OtpState> fallbackOtp = new();

    private string Email(string value) => hasher.HashIdentifier(value);
    private string Key(string value) => $"{redis.KeyPrefix}{value}";
    private string CooldownKey(string email) => Key($"otp:cooldown:{Email(email)}");
    private string OtpRateKey(string email) => Key($"otp:ratelimit:{Email(email)}");
    private string LoginAccountKey(string email) => Key($"login:account:{Email(email)}");
    private string LoginIpKey(string ip) => Key($"login:ip:{hasher.HashIdentifier(ip)}");

    public async Task<OtpIssueResult> ReserveOtpRequestAsync(string email)
    {
        try
        {
            const string script = """
                if redis.call('EXISTS', KEYS[1]) == 1 then return -1 end
                local count = redis.call('INCR', KEYS[2])
                if count == 1 then redis.call('EXPIRE', KEYS[2], ARGV[2]) end
                if count > tonumber(ARGV[3]) then return -2 end
                redis.call('SET', KEYS[1], '1', 'EX', ARGV[1])
                return 1
                """;
            var result = (long)await db.ScriptEvaluateAsync(
                script,
                [CooldownKey(email), OtpRateKey(email)],
                [otp.ResendSeconds, 3600, otp.MaxRequestsPerHour]);
            return result switch
            {
                -1 => OtpIssueResult.Cooldown,
                -2 => OtpIssueResult.RateLimited,
                _ => OtpIssueResult.Allowed
            };
        }
        catch (RedisException exception)
        {
            LogFallback(exception, "OTP request throttling");
            return ReserveOtpFallback(Email(email));
        }
    }

    public async Task<bool> IsLoginBlockedAsync(string email, string ipAddress)
    {
        try
        {
            var values = await db.StringGetAsync(
                [LoginAccountKey(email), LoginIpKey(ipAddress)]);
            return IsBlocked(values[0], redis.LoginMaxAttempts) ||
                   IsBlocked(values[1], redis.LoginIpMaxAttempts);
        }
        catch (RedisException exception)
        {
            LogFallback(exception, "login throttling");
            return IsFallbackBlocked(LoginAccountKey(email), redis.LoginMaxAttempts) ||
                   IsFallbackBlocked(LoginIpKey(ipAddress), redis.LoginIpMaxAttempts);
        }
    }

    public async Task RecordLoginFailureAsync(string email, string ipAddress)
    {
        try
        {
            const string script = """
                local account = redis.call('INCR', KEYS[1])
                if account == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
                local ip = redis.call('INCR', KEYS[2])
                if ip == 1 then redis.call('EXPIRE', KEYS[2], ARGV[1]) end
                return 1
                """;
            await db.ScriptEvaluateAsync(
                script,
                [LoginAccountKey(email), LoginIpKey(ipAddress)],
                [(long)TimeSpan.FromMinutes(redis.LoginBlockMinutes).TotalSeconds]);
        }
        catch (RedisException exception)
        {
            LogFallback(exception, "login failure recording");
            IncrementFallback(LoginAccountKey(email));
            IncrementFallback(LoginIpKey(ipAddress));
        }
    }

    public async Task ClearAccountLoginFailuresAsync(string email)
    {
        var key = LoginAccountKey(email);
        fallbackCounters.TryRemove(key, out _);
        try
        {
            await db.KeyDeleteAsync(key);
        }
        catch (RedisException exception)
        {
            LogFallback(exception, "login failure clearing");
        }
    }

    private OtpIssueResult ReserveOtpFallback(string emailHash)
    {
        var now = DateTime.UtcNow;
        var result = OtpIssueResult.Allowed;
        fallbackOtp.AddOrUpdate(
            emailHash,
            _ => new OtpState(1, now.AddHours(1), now.AddSeconds(otp.ResendSeconds)),
            (_, current) =>
            {
                if (current.WindowEndsUtc <= now)
                {
                    result = OtpIssueResult.Allowed;
                    return new OtpState(1, now.AddHours(1), now.AddSeconds(otp.ResendSeconds));
                }
                if (current.CooldownEndsUtc > now)
                {
                    result = OtpIssueResult.Cooldown;
                    return current;
                }
                if (current.Count >= otp.MaxRequestsPerHour)
                {
                    result = OtpIssueResult.RateLimited;
                    return current;
                }
                result = OtpIssueResult.Allowed;
                return current with
                {
                    Count = current.Count + 1,
                    CooldownEndsUtc = now.AddSeconds(otp.ResendSeconds)
                };
            });
        return result;
    }

    private bool IsFallbackBlocked(string key, int maximum)
    {
        if (!fallbackCounters.TryGetValue(key, out var state))
        {
            return false;
        }
        if (state.ExpiresAtUtc <= DateTime.UtcNow)
        {
            fallbackCounters.TryRemove(key, out _);
            return false;
        }
        return state.Count >= maximum;
    }

    private void IncrementFallback(string key)
    {
        var now = DateTime.UtcNow;
        fallbackCounters.AddOrUpdate(
            key,
            _ => new CounterState(1, now.AddMinutes(redis.LoginBlockMinutes)),
            (_, current) => current.ExpiresAtUtc <= now
                ? new CounterState(1, now.AddMinutes(redis.LoginBlockMinutes))
                : current with { Count = current.Count + 1 });
    }

    private static bool IsBlocked(RedisValue value, int maximum) =>
        value.TryParse(out int attempts) && attempts >= maximum;

    private void LogFallback(Exception exception, string operation) =>
        logger.LogWarning(
            exception,
            "Redis unavailable during {Operation}; using process-local throttling fallback.",
            operation);
}


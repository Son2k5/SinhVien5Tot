using Microsoft.Extensions.Options;
using StackExchange.Redis;
using SV5T.Application.Interfaces.Services.Auth;
using SV5T.Infrastructure.Options.Authentication;
using SV5T.Infrastructure.Options.Integrations;

namespace SV5T.Infrastructure.Auth;

public sealed class AuthRedisStore(
    IConnectionMultiplexer connection,
    ISha256Hasher hasher,
    IOptions<OtpOptions> otpOptions,
    IOptions<RedisOptions> redisOptions) : IAuthRedisStore
{
    private readonly IDatabase db = connection.GetDatabase();
    private readonly OtpOptions otp = otpOptions.Value;
    private readonly RedisOptions redis = redisOptions.Value;

    private string Email(string value) => hasher.HashIdentifier(value);
    private string Key(string value) => $"{redis.KeyPrefix}{value}";
    private string CooldownKey(string email) => Key($"otp:cooldown:{Email(email)}");
    private string OtpRateKey(string email) => Key($"otp:ratelimit:{Email(email)}");
    private string LoginAccountKey(string email) =>
        Key($"login:account:{Email(email)}");
    private string LoginIpKey(string ip) =>
        Key($"login:ip:{hasher.HashIdentifier(ip)}");
    private string BlacklistKey(string jti) => Key($"auth:blacklist:{jti}");

    public async Task<OtpIssueResult> ReserveOtpRequestAsync(string email)
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

    public async Task<bool> IsLoginBlockedAsync(string email, string ipAddress)
    {
        var values = await db.StringGetAsync(
            [LoginAccountKey(email), LoginIpKey(ipAddress)]);
        var accountBlocked = values[0].TryParse(out int accountAttempts) &&
                             accountAttempts >= redis.LoginMaxAttempts;
        var ipBlocked = values[1].TryParse(out int ipAttempts) &&
                        ipAttempts >= redis.LoginIpMaxAttempts;
        return accountBlocked || ipBlocked;
    }

    public async Task RecordLoginFailureAsync(string email, string ipAddress)
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

    public async Task ClearLoginFailuresAsync(string email, string ipAddress) =>
        await db.KeyDeleteAsync(LoginAccountKey(email));

    public async Task BlacklistAccessTokenAsync(string jti, TimeSpan remainingLifetime)
    {
        if (remainingLifetime > TimeSpan.Zero)
        {
            await db.StringSetAsync(BlacklistKey(jti), "1", remainingLifetime);
        }
    }

    public async Task<bool> IsAccessTokenBlacklistedAsync(string jti) =>
        await db.KeyExistsAsync(BlacklistKey(jti));
}

namespace SV5T.Infrastructure.Options.Integrations;

public sealed class RedisOptions
{
    public const string SectionName = "Redis";

    public string KeyPrefix { get; set; } = "sv5t:";

    public int ConnectTimeoutMilliseconds { get; set; } = 5_000;

    public int OperationTimeoutMilliseconds { get; set; } = 5_000;

    public int KeepAliveSeconds { get; set; } = 60;

    public int LoginMaxAttempts { get; set; } = 5;

    public int LoginIpMaxAttempts { get; set; } = 20;

    public int LoginBlockMinutes { get; set; } = 15;

    public bool RequireAuthentication { get; set; } = true;

    public bool RequireTls { get; set; }
}

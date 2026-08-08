using Microsoft.Extensions.Diagnostics.HealthChecks;
using StackExchange.Redis;

namespace SV5T.Infrastructure.Health;

public sealed class RedisHealthCheck(
    IConnectionMultiplexer connection) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var latency = await connection.GetDatabase().PingAsync();
            return HealthCheckResult.Healthy(
                "Redis is available.",
                new Dictionary<string, object>
                {
                    ["latencyMilliseconds"] = latency.TotalMilliseconds
                });
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy(
                "Redis health check failed.",
                exception);
        }
    }
}

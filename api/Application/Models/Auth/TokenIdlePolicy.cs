namespace SV5T.Application.Models.Auth;

public static class TokenIdlePolicy
{
    public static bool IsIdleExpired(
        DateTime lastUsedAtUtc,
        DateTime nowUtc,
        TimeSpan idleTimeout) =>
        nowUtc - lastUsedAtUtc > idleTimeout;
}

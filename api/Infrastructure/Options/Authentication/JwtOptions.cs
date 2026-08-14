namespace SV5T.Infrastructure.Options.Authentication;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = string.Empty;

    public string Audience { get; set; } = string.Empty;

    public string Key { get; set; } = string.Empty;

    public int AccessTokenMinutes { get; set; } = 15;

    public int RefreshTokenIdleMinutes { get; set; } = 120;

    public int RefreshTokenDays { get; set; } = 7;

    public int MaxConcurrentSessions { get; set; } = 5;
}

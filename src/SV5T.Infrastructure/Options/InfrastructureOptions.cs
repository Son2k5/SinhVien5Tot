namespace SV5T.Infrastructure.Options;

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

public sealed class OtpOptions
{
    public const string SectionName = "Otp";

    public string Pepper { get; set; } = string.Empty;

    public int ExpirySeconds { get; set; } = 180;

    public int ResendSeconds { get; set; } = 60;

    public int MaxAttempts { get; set; } = 5;

    public int MaxRequestsPerHour { get; set; } = 5;
}

public sealed class SchoolEmailOptions
{
    public const string SectionName = "SchoolEmail";

    public string[] AllowedDomains { get; set; } = [];
}

public sealed class IdentifierHashOptions
{
    public const string SectionName = "IdentifierHash";

    public string Key { get; set; } = string.Empty;
}

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

public sealed class EmailSettings
{
    public const string SectionName = "EmailSettings";

    public string SmtpHost { get; set; } = "smtp-relay.brevo.com";

    public int SmtpPort { get; set; } = 587;

    public string Username { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string FromName { get; set; } = "SV5T";

    public string FromAddress { get; set; } = string.Empty;

    public bool StartTls { get; set; } = true;

    public int DailyRecipientLimit { get; set; } = 300;

    public int PasswordResetReserve { get; set; } = 50;

    public int RetryDelaySeconds { get; set; } = 60;

    public int MaxDeliveryAttempts { get; set; } = 3;

    public int MaxPendingMessages { get; set; } = 10_000;

    public int DeadLetterRetentionDays { get; set; } = 30;

    public int DeadLetterMaxLength { get; set; } = 1_000;
}

public sealed class PiiEncryptionOptions
{
    public const string SectionName = "PiiEncryption";

    public bool ReencryptOnStart { get; set; }

    public int BatchSize { get; set; } = 100;
}

public sealed class CloudinaryOptions
{
    public const string SectionName = "Cloudinary";

    public string CloudName { get; init; } = string.Empty;
    public string ApiKey { get; init; } = string.Empty;
    public string ApiSecret { get; init; } = string.Empty;
}


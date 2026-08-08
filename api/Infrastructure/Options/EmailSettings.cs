namespace SV5T.Infrastructure.Options;

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

    public int DeadLetterRetentionDays { get; set; } = 30;

    public int DeadLetterMaxLength { get; set; } = 1_000;
}

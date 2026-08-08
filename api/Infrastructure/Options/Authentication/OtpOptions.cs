namespace SV5T.Infrastructure.Options.Authentication;

public sealed class OtpOptions
{
    public const string SectionName = "Otp";

    public string Pepper { get; set; } = string.Empty;

    public int ExpirySeconds { get; set; } = 180;

    public int ResendSeconds { get; set; } = 60;

    public int MaxAttempts { get; set; } = 5;

    public int MaxRequestsPerHour { get; set; } = 5;
}

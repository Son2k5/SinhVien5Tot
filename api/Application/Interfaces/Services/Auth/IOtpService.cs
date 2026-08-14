namespace SV5T.Application.Interfaces.Services.Auth;

public interface IOtpService
{
    TimeSpan Expiry { get; }
    int MaxAttempts { get; }
    string Generate();
    string Hash(string otp);
    bool FixedTimeEquals(string leftHash, string rightHash);
}

using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using SV5T.Application.Interfaces.Services.Auth;
using SV5T.Infrastructure.Options.Authentication;

namespace SV5T.Infrastructure.Auth;

public sealed class OtpService(IOptions<OtpOptions> options) : IOtpService
{
    public int ExpiryMinutes => Math.Max(1, options.Value.ExpirySeconds / 60);

    public int MaxAttempts => options.Value.MaxAttempts;

    private readonly byte[] pepper =
        Encoding.UTF8.GetBytes(options.Value.Pepper);

    public string Generate()
    {
        return RandomNumberGenerator.GetInt32(0, 1_000_000)
            .ToString("D6");
    }

    public string Hash(string otp)
    {
        using var hmac = new HMACSHA256(pepper);
        return Convert.ToHexString(
            hmac.ComputeHash(Encoding.UTF8.GetBytes(otp)));
    }

    public bool FixedTimeEquals(string leftHash, string rightHash)
    {
        try
        {
            return CryptographicOperations.FixedTimeEquals(
                Convert.FromHexString(leftHash),
                Convert.FromHexString(rightHash));
        }
        catch
        {
            return false;
        }
    }
}

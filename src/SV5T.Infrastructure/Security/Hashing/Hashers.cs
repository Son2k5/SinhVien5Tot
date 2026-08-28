using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using SV5T.Application.Common.Abstractions;
using SV5T.Infrastructure.Options;

namespace SV5T.Infrastructure.Security.Hashing;

public sealed class PasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 12;
    private static readonly string DummyHash =
        BCrypt.Net.BCrypt.HashPassword("SV5T-login-timing-sentinel", WorkFactor);

    public string Hash(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    public bool Verify(string password, string? passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            _ = BCrypt.Net.BCrypt.Verify(password, DummyHash);
            return false;
        }

        try
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }
        catch (ArgumentException)
        {
            return false;
        }
    }
}

public sealed class Sha256Hasher(IOptions<IdentifierHashOptions> options)
    : ISha256Hasher
{
    private readonly byte[] identifierKey =
        Encoding.UTF8.GetBytes(options.Value.Key);

    public string HashToken(string token)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(token);
        return Hash(token);
    }

    public string HashIdentifier(string value)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);
        return HashIdentifierValue($"identifier:{value.Trim().ToLowerInvariant()}");
    }

    public bool VerifyToken(string token, string expectedHash)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return false;
        }

        return FixedTimeEquals(HashToken(token), expectedHash);
    }

    private static string Hash(string value)
    {
        var bytes = Encoding.UTF8.GetBytes(value);
        return Convert.ToHexString(SHA256.HashData(bytes));
    }

    private string HashIdentifierValue(string value)
    {
        using var hmac = new HMACSHA256(identifierKey);
        return Convert.ToHexString(
            hmac.ComputeHash(Encoding.UTF8.GetBytes(value)));
    }

    private static bool FixedTimeEquals(string actualHash, string expectedHash)
    {
        if (string.IsNullOrWhiteSpace(expectedHash))
        {
            return false;
        }

        try
        {
            return CryptographicOperations.FixedTimeEquals(
                Convert.FromHexString(actualHash),
                Convert.FromHexString(expectedHash));
        }
        catch (FormatException)
        {
            return false;
        }
    }
}


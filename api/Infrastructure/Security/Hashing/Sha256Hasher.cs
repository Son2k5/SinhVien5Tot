using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using SV5T.Application.Interfaces.Services.Auth;
using SV5T.Infrastructure.Options.Authentication;

namespace SV5T.Infrastructure.Security.Hashing;

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

        return HashIdentifierValue(
            $"identifier:{value.Trim().ToLowerInvariant()}");
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

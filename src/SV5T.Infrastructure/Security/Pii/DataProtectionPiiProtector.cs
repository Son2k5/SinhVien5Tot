using System.Security.Cryptography;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace SV5T.Infrastructure.Security.Pii;

public interface IPiiProtector
{
    string Protect(string plaintext);
    string Unprotect(string protectedValue);
}

public sealed class DataProtectionPiiProtector(
    IDataProtectionProvider provider,
    ILogger<DataProtectionPiiProtector>? logger = null)
    : IPiiProtector
{
    private const string Prefix = "pii:v1:";
    private readonly IDataProtector protector = provider.CreateProtector(
        "SV5T.Database.PII.v1");
    private readonly ILogger<DataProtectionPiiProtector> _logger =
        logger ?? NullLogger<DataProtectionPiiProtector>.Instance;

    public string Protect(string plaintext)
    {
        if (string.IsNullOrEmpty(plaintext))
        {
            return plaintext;
        }

        return Prefix + protector.Protect(plaintext);
    }

    public string Unprotect(string protectedValue)
    {
        if (string.IsNullOrEmpty(protectedValue) ||
            !protectedValue.StartsWith(Prefix, StringComparison.Ordinal))
        {
            return protectedValue;
        }

        try
        {
            return protector.Unprotect(protectedValue[Prefix.Length..]);
        }
        catch (CryptographicException exception)
        {
            _logger.LogWarning(exception, "Failed to unprotect PII value due to key rotation or invalid payload.");
            return string.Empty;
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "Unexpected error unprotecting PII value.");
            return string.Empty;
        }
    }
}


using Microsoft.AspNetCore.DataProtection;

namespace SV5T.Infrastructure.Security;

public sealed class DataProtectionPiiProtector(IDataProtectionProvider provider)
    : IPiiProtector
{
    private const string Prefix = "pii:v1:";
    private readonly IDataProtector protector = provider.CreateProtector(
        "SV5T.Database.PII.v1");

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
            // Legacy plaintext remains readable until the one-time re-encryption job runs.
            return protectedValue;
        }

        return protector.Unprotect(protectedValue[Prefix.Length..]);
    }
}

using Microsoft.AspNetCore.DataProtection;

namespace SV5T.Infrastructure.Email;

public sealed class DataProtectionEmailPayloadProtector(
    IDataProtectionProvider provider) : IEmailPayloadProtector
{
    private const string Prefix = "dp:v1:";
    private readonly IDataProtector protector = provider.CreateProtector(
        "SV5T.EmailOutbox.Payload.v1");

    public string Protect(string plaintext)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(plaintext);
        return Prefix + protector.Protect(plaintext);
    }

    public string Unprotect(string protectedPayload)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(protectedPayload);
        if (!protectedPayload.StartsWith(Prefix, StringComparison.Ordinal))
        {
            throw new InvalidOperationException(
                "Legacy plaintext email payload was rejected. Request a new OTP.");
        }

        return protector.Unprotect(protectedPayload[Prefix.Length..]);
    }
}



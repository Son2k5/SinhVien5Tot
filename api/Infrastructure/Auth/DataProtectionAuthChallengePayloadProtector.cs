using Microsoft.AspNetCore.DataProtection;

namespace SV5T.Infrastructure.Auth;

internal sealed class DataProtectionAuthChallengePayloadProtector(
    IDataProtectionProvider provider) : IAuthChallengePayloadProtector
{
    private const string Prefix = "dp:v1:";
    private readonly IDataProtector protector = provider.CreateProtector(
        "SV5T.AuthChallenge.Payload.v1");

    public string Protect(string plaintext) => Prefix + protector.Protect(plaintext);

    public string Unprotect(string protectedPayload)
    {
        if (!protectedPayload.StartsWith(Prefix, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("Authentication challenge payload is not protected.");
        }

        return protector.Unprotect(protectedPayload[Prefix.Length..]);
    }
}

namespace SV5T.Infrastructure.Auth;

internal interface IAuthChallengePayloadProtector
{
    string Protect(string plaintext);
    string Unprotect(string protectedPayload);
}

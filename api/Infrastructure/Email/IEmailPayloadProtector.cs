namespace SV5T.Infrastructure.Email;

public interface IEmailPayloadProtector
{
    string Protect(string plaintext);

    string Unprotect(string protectedPayload);
}

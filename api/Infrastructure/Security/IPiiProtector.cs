namespace SV5T.Infrastructure.Security;

public interface IPiiProtector
{
    string Protect(string plaintext);
    string Unprotect(string protectedValue);
}

namespace SV5T.Application.Interfaces.Services.Auth;

public interface ISha256Hasher
{
    string HashToken(string token);

    string HashIdentifier(string value);

    bool VerifyToken(string token, string expectedHash);
}

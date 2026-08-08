namespace SV5T.Application.Interfaces.Services.Commons;

public interface IPasswordHasher
{
    string Hash(string password);

    bool Verify(string password, string? passwordHash);
}

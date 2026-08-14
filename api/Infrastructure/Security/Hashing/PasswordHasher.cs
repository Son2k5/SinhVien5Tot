using SV5T.Application.Interfaces.Services.Commons;

namespace SV5T.Infrastructure.Security.Hashing;

public sealed class PasswordHasher : IPasswordHasher
{
    private const int WorkFactor = 12;
    private static readonly string DummyHash =
        BCrypt.Net.BCrypt.HashPassword("SV5T-login-timing-sentinel", WorkFactor);

    public string Hash(string password) =>
        BCrypt.Net.BCrypt.HashPassword(password, WorkFactor);

    public bool Verify(string password, string? passwordHash)
    {
        if (string.IsNullOrWhiteSpace(passwordHash))
        {
            _ = BCrypt.Net.BCrypt.Verify(password, DummyHash);
            return false;
        }

        try
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }
        catch (ArgumentException)
        {
            return false;
        }
    }
}

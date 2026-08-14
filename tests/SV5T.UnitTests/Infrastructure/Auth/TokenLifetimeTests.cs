using Microsoft.Extensions.Options;
using SV5T.Infrastructure.Auth;
using SV5T.Infrastructure.Security.Hashing;
using SV5T.Infrastructure.Options.Authentication;
using Xunit;

namespace SV5T.UnitTests.Infrastructure.Auth;

public sealed class TokenLifetimeTests
{
    [Fact]
    public void OtpExpiry_PreservesConfiguredSeconds()
    {
        var service = new OtpService(Options.Create(new OtpOptions
        {
            Pepper = new string('P', 32),
            ExpirySeconds = 90
        }));

        Assert.Equal(TimeSpan.FromSeconds(90), service.Expiry);
    }

    [Fact]
    public void RefreshToken_DoesNotExtendBeyondAbsoluteExpiry()
    {
        var factory = new RefreshTokenFactory(
            new Sha256Hasher(Options.Create(new IdentifierHashOptions
            {
                Key = new string('K', 32)
            })),
            Options.Create(new JwtOptions
            {
                RefreshTokenIdleMinutes = 120,
                RefreshTokenDays = 7
            }));
        var absoluteExpiry = DateTime.UtcNow.AddMinutes(10);

        var generated = factory.Generate(true, absoluteExpiry);

        Assert.Equal(absoluteExpiry, generated.AbsoluteExpiresAtUtc);
        Assert.True(generated.ExpiresAtUtc <= absoluteExpiry);
        Assert.True(generated.IsPersistent);
    }

    [Fact]
    public void RefreshToken_UsesConfiguredSevenDayLifetime()
    {
        var factory = new RefreshTokenFactory(
            new Sha256Hasher(Options.Create(new IdentifierHashOptions
            {
                Key = new string('K', 32)
            })),
            Options.Create(new JwtOptions
            {
                RefreshTokenIdleMinutes = 120,
                RefreshTokenDays = 7
            }));
        var before = DateTime.UtcNow;

        var generated = factory.Generate(true);

        Assert.InRange(
            generated.ExpiresAtUtc,
            before.AddDays(7).AddSeconds(-1),
            before.AddDays(7).AddSeconds(1));
        Assert.Equal(generated.ExpiresAtUtc, generated.AbsoluteExpiresAtUtc);
        Assert.Equal(TimeSpan.FromHours(2), factory.IdleTimeout);
    }
}

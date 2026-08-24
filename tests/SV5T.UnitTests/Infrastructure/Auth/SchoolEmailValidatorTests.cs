using Microsoft.Extensions.Options;
using SV5T.Infrastructure.Options;
using Xunit;

namespace SV5T.UnitTests.Infrastructure.Auth;

public sealed class SchoolEmailValidatorTests
{
    private readonly SchoolEmailValidator validator = new(
        Options.Create(
            new SchoolEmailOptions
            {
                AllowedDomains = ["ms.hanu.edu.vn"]
            }));

    [Theory]
    [InlineData("2301140067@ms.hanu.edu.vn")]
    [InlineData("student@MS.HANU.EDU.VN")]
    public void IsAllowed_AcceptsConfiguredSchoolDomain(string email)
    {
        Assert.True(validator.IsAllowed(email));
    }

    [Theory]
    [InlineData("")]
    [InlineData("student@gmail.com")]
    [InlineData("student@fake-ms.hanu.edu.vn")]
    [InlineData("student@sub.ms.hanu.edu.vn")]
    [InlineData("student@ms.hanu.edu.vn.attacker.com")]
    public void IsAllowed_RejectsNonSchoolDomain(string email)
    {
        Assert.False(validator.IsAllowed(email));
    }
}



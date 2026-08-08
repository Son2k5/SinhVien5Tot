using Microsoft.Extensions.Options;
using SV5T.Application.Interfaces.Services.Auth;
using SV5T.Infrastructure.Options.Integrations;

namespace SV5T.Infrastructure.Auth;

public sealed class SchoolEmailValidator(
    IOptions<SchoolEmailOptions> options) : ISchoolEmailValidator
{
    public bool IsAllowed(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        var at = email.LastIndexOf('@');
        if (at <= 0 || at == email.Length - 1)
        {
            return false;
        }

        var domain = email[(at + 1)..];
        return options.Value.AllowedDomains.Any(
            allowed => string.Equals(
                allowed, domain, StringComparison.OrdinalIgnoreCase));
    }
}

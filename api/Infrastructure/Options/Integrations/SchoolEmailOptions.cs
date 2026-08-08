namespace SV5T.Infrastructure.Options.Integrations;

public sealed class SchoolEmailOptions
{
    public const string SectionName = "SchoolEmail";

    public string[] AllowedDomains { get; set; } = [];
}

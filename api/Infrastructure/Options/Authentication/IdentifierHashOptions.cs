namespace SV5T.Infrastructure.Options.Authentication;

public sealed class IdentifierHashOptions
{
    public const string SectionName = "IdentifierHash";

    public string Key { get; set; } = string.Empty;
}

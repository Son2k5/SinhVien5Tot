namespace SV5T.Infrastructure.Options;

public sealed class PiiEncryptionOptions
{
    public const string SectionName = "PiiEncryption";

    public bool ReencryptOnStart { get; set; }

    public int BatchSize { get; set; } = 100;
}

namespace SV5T.Infrastructure.Configuration;

/// <summary>
/// Loads local API configuration from an untracked .env file before the
/// standard ASP.NET Core configuration pipeline is created.
/// </summary>
public static class DotEnvLoader
{
    public static void LoadBackendEnvironment(string? contentRoot = null)
    {
        var envPath = ResolveEnvPath(contentRoot ?? Directory.GetCurrentDirectory());
        if (envPath is null)
        {
            return;
        }

        foreach (var rawLine in File.ReadLines(envPath))
        {
            var line = rawLine.Trim();
            if (line.Length == 0 || line.StartsWith('#'))
            {
                continue;
            }

            if (line.StartsWith("export ", StringComparison.OrdinalIgnoreCase))
            {
                line = line[7..].TrimStart();
            }

            var separator = line.IndexOf('=');
            if (separator <= 0)
            {
                continue;
            }

            var key = line[..separator].Trim();
            var value = Unquote(line[(separator + 1)..].Trim());

            // Process-level variables (for example, values injected by a
            // production secret manager) always have higher priority. Empty
            // local values fall through to User Secrets or other providers.
            if (key.Length == 0 || value.Length == 0 ||
                Environment.GetEnvironmentVariable(key) is not null)
            {
                continue;
            }

            Environment.SetEnvironmentVariable(key, value);
        }
    }

    private static string? ResolveEnvPath(string contentRoot)
    {
        if (File.Exists(Path.Combine(contentRoot, "SV5T.Api.csproj")))
        {
            return ExistingPath(Path.Combine(contentRoot, ".env"));
        }

        var repositoryApiDirectory = Path.Combine(contentRoot, "api");
        if (File.Exists(Path.Combine(repositoryApiDirectory, "SV5T.Api.csproj")))
        {
            return ExistingPath(Path.Combine(repositoryApiDirectory, ".env"));
        }

        return ExistingPath(Path.Combine(AppContext.BaseDirectory, ".env"));
    }

    private static string? ExistingPath(string path) => File.Exists(path) ? path : null;

    private static string Unquote(string value)
    {
        if (value.Length >= 2 &&
            ((value[0] == '"' && value[^1] == '"') ||
             (value[0] == '\'' && value[^1] == '\'')))
        {
            return value[1..^1];
        }

        return value;
    }
}

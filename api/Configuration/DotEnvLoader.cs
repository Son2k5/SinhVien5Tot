namespace SV5T.Configuration;

internal static class DotEnvLoader
{
    public static void LoadBackendEnvironment()
    {
        var workingDirectory = Directory.GetCurrentDirectory();
        var envPath = ResolveEnvPath(workingDirectory);
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

            // Empty template values deliberately fall back to appsettings or
            // User Secrets. Real process environment variables keep priority.
            if (key.Length == 0 || value.Length == 0 ||
                Environment.GetEnvironmentVariable(key) is not null)
            {
                continue;
            }

            Environment.SetEnvironmentVariable(key, value);
        }
    }

    private static string? ResolveEnvPath(string workingDirectory)
    {
        var repositoryApiDirectory = Path.Combine(workingDirectory, "api");
        if (File.Exists(Path.Combine(repositoryApiDirectory, "SV5T.Api.csproj")))
        {
            var repositoryEnv = Path.Combine(repositoryApiDirectory, ".env");
            return File.Exists(repositoryEnv) ? repositoryEnv : null;
        }

        if (File.Exists(Path.Combine(workingDirectory, "SV5T.Api.csproj")))
        {
            var projectEnv = Path.Combine(workingDirectory, ".env");
            return File.Exists(projectEnv) ? projectEnv : null;
        }

        var publishedEnv = Path.Combine(AppContext.BaseDirectory, ".env");
        return File.Exists(publishedEnv) ? publishedEnv : null;
    }

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

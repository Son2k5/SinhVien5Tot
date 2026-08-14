using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using SV5T.Infrastructure.Configuration;
using SV5T.Infrastructure.Security;

namespace SV5T.Infrastructure.Persistence;

public sealed class ApplicationDbContextFactory
    : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var contentRoot = ResolveContentRoot();
        DotEnvLoader.LoadBackendEnvironment(contentRoot);
        var environmentName =
            Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ??
            Environment.GetEnvironmentVariable("DOTNET_ENVIRONMENT") ??
            "Development";

        var configuration = new ConfigurationBuilder()
            .SetBasePath(contentRoot)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile(
                $"appsettings.{environmentName}.json",
                optional: true)
            .AddUserSecrets("sv5t-api-local-development", reloadOnChange: false)
            .AddEnvironmentVariables()
            .Build();
        var connectionString = configuration.GetConnectionString(
            "DefaultConnection");

        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                "ConnectionStrings:DefaultConnection must be configured.");
        }

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseMySql(
                connectionString,
                new MySqlServerVersion(new Version(8, 4, 0)))
            .Options;

        return new ApplicationDbContext(options, new DesignTimePiiProtector());
    }

    private static string ResolveContentRoot()
    {
        var currentDirectory = Directory.GetCurrentDirectory();
        if (File.Exists(Path.Combine(currentDirectory, "appsettings.json")))
        {
            return currentDirectory;
        }

        var apiDirectory = Path.Combine(currentDirectory, "api");
        if (File.Exists(Path.Combine(apiDirectory, "appsettings.json")))
        {
            return apiDirectory;
        }

        throw new InvalidOperationException(
            "Could not locate the API configuration directory.");
    }

    private sealed class DesignTimePiiProtector : IPiiProtector
    {
        public string Protect(string plaintext) => plaintext;
        public string Unprotect(string protectedValue) => protectedValue;
    }
}

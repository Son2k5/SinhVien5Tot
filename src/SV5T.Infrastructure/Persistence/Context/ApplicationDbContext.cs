using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.Extensions.Configuration;
using SV5T.Domain.Admin;
using SV5T.Domain.Auth;
using SV5T.Domain.Users;
using SV5T.Domain.Welcome;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Criteria;
using SV5T.Domain.Evidences;
using SV5T.Domain.Standards;
using SV5T.Domain.Submissions;
using SubmissionApplication = SV5T.Domain.Submissions.Application;
using SV5T.Infrastructure.Configuration;
using SV5T.Infrastructure.Security.Pii;

namespace SV5T.Infrastructure.Persistence.Context;

public sealed class ApplicationDbContext(
    DbContextOptions<ApplicationDbContext> options,
    IPiiProtector piiProtector)
    : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    public DbSet<UserProfile> UserProfiles => Set<UserProfile>();

    public DbSet<UserAddress> UserAddresses => Set<UserAddress>();

    public DbSet<PortalContent> PortalContents => Set<PortalContent>();

    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public DbSet<StandardSet> StandardSets => Set<StandardSet>();
    public DbSet<Standard> Standards => Set<Standard>();
    public DbSet<Criterion> Criteria => Set<Criterion>();
    public DbSet<Campaign> Campaigns => Set<Campaign>();
    public DbSet<SubmissionApplication> Applications => Set<SubmissionApplication>();
    public DbSet<Evidence> Evidences => Set<Evidence>();
    public DbSet<ReviewLog> ReviewLogs => Set<ReviewLog>();
    public DbSet<AdminAuditLog> AdminAuditLogs => Set<AdminAuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        var protectedString = new ValueConverter<string, string>(
            value => piiProtector.Protect(value),
            value => piiProtector.Unprotect(value));
        modelBuilder.Entity<UserProfile>()
            .Property(profile => profile.IdentityCardNumber)
            .HasConversion(protectedString);
        modelBuilder.Entity<UserProfile>()
            .Property(profile => profile.ContactEmail)
            .HasConversion(protectedString);
        modelBuilder.Entity<UserProfile>()
            .Property(profile => profile.PhoneNumber)
            .HasConversion(protectedString);
        modelBuilder.Entity<UserAddress>()
            .Property(address => address.StreetAddress)
            .HasConversion(protectedString);
        base.OnModelCreating(modelBuilder);
    }
}

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

        var srcApiDirectory = Path.Combine(currentDirectory, "src", "SV5T.Api");
        if (File.Exists(Path.Combine(srcApiDirectory, "appsettings.json")))
        {
            return srcApiDirectory;
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


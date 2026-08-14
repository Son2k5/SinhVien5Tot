using Microsoft.EntityFrameworkCore;
using SV5T.Domain.Entities;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using SV5T.Infrastructure.Security;

namespace SV5T.Infrastructure.Persistence;

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

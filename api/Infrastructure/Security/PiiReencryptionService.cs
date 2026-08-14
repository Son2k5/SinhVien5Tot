using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SV5T.Infrastructure.Options;
using SV5T.Infrastructure.Persistence;

namespace SV5T.Infrastructure.Security;

internal sealed class PiiReencryptionService(
    IServiceScopeFactory scopeFactory,
    IOptions<PiiEncryptionOptions> options,
    ILogger<PiiReencryptionService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!options.Value.ReencryptOnStart)
        {
            return;
        }

        await RewriteProfilesAsync(stoppingToken);
        await RewriteAddressesAsync(stoppingToken);
        logger.LogWarning(
            "PII re-encryption completed. Disable PiiEncryption:ReencryptOnStart before the next start.");
    }

    private async Task RewriteProfilesAsync(CancellationToken cancellationToken)
    {
        var offset = 0;
        while (true)
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var profiles = await db.UserProfiles
                .OrderBy(profile => profile.Id)
                .Skip(offset)
                .Take(options.Value.BatchSize)
                .ToListAsync(cancellationToken);
            if (profiles.Count == 0)
            {
                return;
            }

            foreach (var profile in profiles)
            {
                db.Entry(profile).Property(value => value.IdentityCardNumber).IsModified = true;
                db.Entry(profile).Property(value => value.ContactEmail).IsModified = true;
                db.Entry(profile).Property(value => value.PhoneNumber).IsModified = true;
            }
            await db.SaveChangesAsync(cancellationToken);
            offset += profiles.Count;
        }
    }

    private async Task RewriteAddressesAsync(CancellationToken cancellationToken)
    {
        var offset = 0;
        while (true)
        {
            await using var scope = scopeFactory.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var addresses = await db.UserAddresses
                .OrderBy(address => address.Id)
                .Skip(offset)
                .Take(options.Value.BatchSize)
                .ToListAsync(cancellationToken);
            if (addresses.Count == 0)
            {
                return;
            }

            foreach (var address in addresses)
            {
                db.Entry(address).Property(value => value.StreetAddress).IsModified = true;
            }
            await db.SaveChangesAsync(cancellationToken);
            offset += addresses.Count;
        }
    }
}

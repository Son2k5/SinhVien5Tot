using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using SV5T.Application.Interfaces.Services.Email;
using SV5T.Infrastructure.Options;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.Extensions.Hosting;
using System.Security.Cryptography.X509Certificates;

namespace SV5T.Infrastructure.Email;

public static class EmailServiceCollectionExtensions
{
    public static IServiceCollection AddEmailServices(
        this IServiceCollection services,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        services.AddOptions<EmailSettings>()
            .Bind(configuration.GetSection(EmailSettings.SectionName))
            .Validate(
                settings =>
                    !string.IsNullOrWhiteSpace(settings.SmtpHost) &&
                    settings.SmtpPort is > 0 and <= 65_535 &&
                    !string.IsNullOrWhiteSpace(settings.Username) &&
                    !string.IsNullOrWhiteSpace(settings.Password) &&
                    !string.IsNullOrWhiteSpace(settings.FromName) &&
                    !string.IsNullOrWhiteSpace(settings.FromAddress) &&
                    settings.DailyRecipientLimit >= 0 &&
                    settings.PasswordResetReserve >= 0 &&
                    (settings.DailyRecipientLimit == 0 ||
                     settings.PasswordResetReserve < settings.DailyRecipientLimit) &&
                    settings.RetryDelaySeconds is >= 10 and <= 3_600 &&
                    settings.MaxDeliveryAttempts is >= 1 and <= 10 &&
                    settings.DeadLetterRetentionDays is >= 1 and <= 365 &&
                    settings.DeadLetterMaxLength is >= 100 and <= 100_000 &&
                    settings.MaxPendingMessages is >= 100 and <= 1_000_000,
                "EmailSettings is invalid. PasswordResetReserve must be lower than a non-zero DailyRecipientLimit.")
            .ValidateOnStart();

        services.TryAddSingleton<ISmtpClient, MailKitSmtpClient>();
        var keyPath = configuration["DataProtection:KeysPath"];
        var certificatePath = configuration["DataProtection:CertificatePath"];
        var certificatePassword = configuration["DataProtection:CertificatePassword"];
        var dataProtection = services.AddDataProtection()
            .SetApplicationName("SV5T.Api")
            .SetDefaultKeyLifetime(TimeSpan.FromDays(90));
        if (!string.IsNullOrWhiteSpace(keyPath))
        {
            if (environment.IsProduction() && !Path.IsPathRooted(keyPath))
            {
                throw new InvalidOperationException(
                    "Production DataProtection:KeysPath must be an absolute shared persistent path.");
            }
            dataProtection.PersistKeysToFileSystem(
                new DirectoryInfo(Path.IsPathRooted(keyPath)
                    ? keyPath
                    : Path.Combine(environment.ContentRootPath, keyPath)));
        }
        if (!string.IsNullOrWhiteSpace(certificatePath))
        {
            var resolvedCertificatePath = Path.IsPathRooted(certificatePath)
                ? certificatePath
                : Path.Combine(environment.ContentRootPath, certificatePath);
            dataProtection.ProtectKeysWithCertificate(
                X509CertificateLoader.LoadPkcs12FromFile(
                    resolvedCertificatePath,
                    certificatePassword));
        }
        else if (environment.IsProduction())
        {
            throw new InvalidOperationException(
                "Production Data Protection keys must be protected with DataProtection:CertificatePath.");
        }
        services.AddSingleton<IEmailPayloadProtector, DataProtectionEmailPayloadProtector>();
        services.AddSingleton<IEmailQuotaStore, RedisEmailQuotaStore>();
        services.AddSingleton<SmtpEmailSender>();
        services.AddSingleton<IEmailSender>(
            provider => provider.GetRequiredService<SmtpEmailSender>());
        services.AddSingleton<RedisEmailQueue>();
        services.AddSingleton<IEmailQueue>(
            provider => provider.GetRequiredService<RedisEmailQueue>());
        services.AddHostedService<EmailBackgroundWorker>();

        return services;
    }
}

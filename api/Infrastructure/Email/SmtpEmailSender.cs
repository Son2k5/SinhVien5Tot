using MailKit.Security;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using SV5T.Application.Interfaces.Services.Email;
using SV5T.Application.Models.Email;
using SV5T.Infrastructure.Options;

namespace SV5T.Infrastructure.Email;

public sealed class SmtpEmailSender(
    ISmtpClient smtpClient,
    IOptions<EmailSettings> options,
    ILogger<SmtpEmailSender> logger) : IEmailSender
{
    private readonly EmailSettings settings = options.Value;

    public async Task SendAsync(
        EmailMessage message,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(message.To);
        ArgumentException.ThrowIfNullOrWhiteSpace(message.Subject);
        ArgumentException.ThrowIfNullOrWhiteSpace(message.Body);

        await EnsureConnectedAsync(cancellationToken);

        var mimeMessage = new MimeMessage();
        mimeMessage.From.Add(new MailboxAddress(
            settings.FromName,
            settings.FromAddress));
        mimeMessage.To.Add(MailboxAddress.Parse(message.To));
        mimeMessage.Subject = message.Subject;
        mimeMessage.Body = new BodyBuilder
        {
            HtmlBody = message.Body
        }.ToMessageBody();

        await smtpClient.SendAsync(mimeMessage, cancellationToken);
    }

    public async Task DisconnectAsync(
        CancellationToken cancellationToken = default)
    {
        if (!smtpClient.IsConnected)
        {
            return;
        }

        try
        {
            await smtpClient.DisconnectAsync(true, cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "Could not gracefully disconnect the SMTP connection.");
        }
    }

    private async Task EnsureConnectedAsync(CancellationToken cancellationToken)
    {
        if (!smtpClient.IsConnected)
        {
            var socketOptions = settings.StartTls
                ? SecureSocketOptions.StartTls
                : SecureSocketOptions.Auto;

            await smtpClient.ConnectAsync(
                settings.SmtpHost,
                settings.SmtpPort,
                socketOptions,
                cancellationToken);
        }

        if (!smtpClient.IsAuthenticated)
        {
            await smtpClient.AuthenticateAsync(
                settings.Username,
                settings.Password,
                cancellationToken);
        }
    }
}

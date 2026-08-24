using MailKit.Security;
using MimeKit;

namespace SV5T.Infrastructure.Email;

public sealed class MailKitSmtpClient : ISmtpClient
{
    private readonly MailKit.Net.Smtp.SmtpClient client = new();

    public bool IsConnected => client.IsConnected;

    public bool IsAuthenticated => client.IsAuthenticated;

    public Task ConnectAsync(
        string host,
        int port,
        SecureSocketOptions options,
        CancellationToken cancellationToken = default) =>
        client.ConnectAsync(host, port, options, cancellationToken);

    public Task AuthenticateAsync(
        string username,
        string password,
        CancellationToken cancellationToken = default) =>
        client.AuthenticateAsync(username, password, cancellationToken);

    public Task<string> SendAsync(
        MimeMessage message,
        CancellationToken cancellationToken = default) =>
        client.SendAsync(message, cancellationToken);

    public Task DisconnectAsync(
        bool quit,
        CancellationToken cancellationToken = default) =>
        client.DisconnectAsync(quit, cancellationToken);

    public async ValueTask DisposeAsync()
    {
        if (client.IsConnected)
        {
            await client.DisconnectAsync(true);
        }

        client.Dispose();
    }
}



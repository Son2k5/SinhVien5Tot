using MailKit.Security;
using MimeKit;

namespace SV5T.Infrastructure.Email;

public interface ISmtpClient : IAsyncDisposable
{
    bool IsConnected { get; }

    bool IsAuthenticated { get; }

    Task ConnectAsync(
        string host,
        int port,
        SecureSocketOptions options,
        CancellationToken cancellationToken = default);

    Task AuthenticateAsync(
        string username,
        string password,
        CancellationToken cancellationToken = default);

    Task<string> SendAsync(
        MimeMessage message,
        CancellationToken cancellationToken = default);

    Task DisconnectAsync(
        bool quit,
        CancellationToken cancellationToken = default);
}

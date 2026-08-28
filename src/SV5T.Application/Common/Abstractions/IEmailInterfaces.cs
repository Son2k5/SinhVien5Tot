using SV5T.Application.Common.Models;

namespace SV5T.Application.Common.Abstractions;

public interface IEmailSender
{
    Task SendAsync(
        EmailMessage message,
        CancellationToken cancellationToken = default);

    Task DisconnectAsync(CancellationToken cancellationToken = default);
}

public interface IEmailQueue
{
    Task<Guid> EnqueueAsync(
        EmailMessage message,
        CancellationToken cancellationToken = default);
}

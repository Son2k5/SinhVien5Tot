using SV5T.Application.Models.Email;

namespace SV5T.Application.Interfaces.Services.Email;

public interface IEmailSender
{
    Task SendAsync(
        EmailMessage message,
        CancellationToken cancellationToken = default);

    Task DisconnectAsync(CancellationToken cancellationToken = default);
}

using SV5T.Application.Models.Email;

namespace SV5T.Application.Interfaces.Services.Email;

public interface IEmailQueue
{
    Task<Guid> EnqueueAsync(
        EmailMessage message,
        CancellationToken cancellationToken = default);
}

namespace SV5T.Infrastructure.Email;

internal sealed record EmailQuotaReservation(
    bool Allowed,
    DateTime? RetryAtUtc = null);

internal interface IEmailQuotaStore
{
    Task InitializeAsync(CancellationToken cancellationToken);

    Task<EmailQuotaReservation> TryReserveAsync(
        Guid emailQueueId,
        bool isPasswordReset,
        CancellationToken cancellationToken);

    Task ReleaseAsync(
        Guid emailQueueId,
        CancellationToken cancellationToken);
}

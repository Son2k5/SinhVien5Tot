namespace SV5T.Application.Chat;

public interface IChatNotifier
{
    Task NotifyNewMessageAsync(
        IReadOnlyCollection<Guid> userIds,
        MessageResponse message,
        CancellationToken cancellationToken);

    Task NotifyReadAsync(
        IReadOnlyCollection<Guid> userIds,
        Guid conversationId,
        Guid readerUserId,
        DateTime readAt,
        CancellationToken cancellationToken);
}

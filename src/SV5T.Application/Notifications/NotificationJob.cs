using SV5T.Domain.Notifications;

namespace SV5T.Application.Notifications;

public enum NotificationAudience
{
    AllStudents = 1,
    SingleUser = 2,
    Reviewers = 3
}

public sealed record NotificationJob(
    NotificationType Type,
    NotificationTargetType TargetType,
    Guid TargetId,
    Guid? ApplicationId,
    NotificationAudience Audience,
    Guid? RecipientUserId,
    string Title,
    string Body,
    string DedupKey);

public interface INotificationQueue
{
    bool TryEnqueue(NotificationJob job);
}

public interface INotificationRepository
{
    Task<IReadOnlyList<Notification>> GetPageAsync(
        Guid recipientUserId,
        DateTime? beforeCreatedAt,
        Guid? beforeId,
        int take,
        bool unreadOnly,
        CancellationToken cancellationToken);

    Task<int> GetUnreadCountAsync(Guid recipientUserId, CancellationToken cancellationToken);

    Task<Notification?> GetForUserAsync(
        Guid notificationId,
        Guid recipientUserId,
        CancellationToken cancellationToken);

    Task<int> MarkAllReadAsync(
        Guid recipientUserId,
        DateTime utcNow,
        CancellationToken cancellationToken);
}

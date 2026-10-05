namespace SV5T.Domain.Notifications;

public enum NotificationType
{
    ArticlePublished = 1,
    CampaignPublished = 2,
    ApplicationSubmitted = 3,
    EvidenceReviewed = 4,
    ApplicationDecided = 5,
    ApplicationWithdrawn = 6
}

public enum NotificationTargetType
{
    Article = 1,
    Campaign = 2,
    Application = 3,
    Evidence = 4
}

public sealed class Notification : Entity<Guid>
{
    private Notification()
    {
    }

    public Guid RecipientUserId { get; private set; }

    public NotificationType Type { get; private set; }

    public string Title { get; private set; } = string.Empty;

    public string Body { get; private set; } = string.Empty;

    public NotificationTargetType TargetType { get; private set; }

    public Guid TargetId { get; private set; }

    public Guid? ApplicationId { get; private set; }

    public bool IsRead { get; private set; }

    public DateTime? ReadAt { get; private set; }

    public DateTime CreatedAt { get; private set; }

    public string? DedupKey { get; private set; }

    public static Notification Create(
        Guid recipientUserId,
        NotificationType type,
        string title,
        string body,
        NotificationTargetType targetType,
        Guid targetId,
        Guid? applicationId,
        DateTime utcNow,
        string? dedupKey = null)
    {
        ArgumentOutOfRangeException.ThrowIfEqual(recipientUserId, Guid.Empty);
        ArgumentOutOfRangeException.ThrowIfEqual(targetId, Guid.Empty);
        ArgumentException.ThrowIfNullOrWhiteSpace(title);
        ArgumentException.ThrowIfNullOrWhiteSpace(body);
        if (title.Length > 200)
            throw new ArgumentOutOfRangeException(nameof(title), "Title must not exceed 200 characters.");
        if (body.Length > 500)
            throw new ArgumentOutOfRangeException(nameof(body), "Body must not exceed 500 characters.");

        return new Notification
        {
            Id = Guid.NewGuid(),
            RecipientUserId = recipientUserId,
            Type = type,
            Title = title,
            Body = body,
            TargetType = targetType,
            TargetId = targetId,
            ApplicationId = applicationId,
            IsRead = false,
            CreatedAt = DateTime.SpecifyKind(utcNow, DateTimeKind.Utc),
            DedupKey = string.IsNullOrWhiteSpace(dedupKey) ? null : dedupKey.Trim()
        };
    }

    public void MarkRead(DateTime utcNow)
    {
        if (IsRead)
            return;

        IsRead = true;
        ReadAt = DateTime.SpecifyKind(utcNow, DateTimeKind.Utc);
    }
}

using SV5T.Domain.Users;

namespace SV5T.Domain.Chat;

public enum ConversationType
{
    Direct = 1,
    Support = 2
}

public sealed class Conversation : AggregateRoot<Guid>
{
    private const int PreviewLength = 100;

    public ConversationType Type { get; private set; }
    public string PairKey { get; private set; } = string.Empty;
    public DateTime CreatedAt { get; private set; }
    public DateTime LastMessageAt { get; private set; }
    public string? LastMessagePreview { get; private set; }
    public ICollection<ConversationParticipant> Participants { get; } = [];
    public ICollection<Message> Messages { get; } = [];

    public static Conversation Create(
        Guid firstUserId,
        Guid secondUserId,
        ConversationType type,
        DateTime createdAt)
    {
        if (firstUserId == secondUserId)
            throw new ArgumentException("Conversation participants must be different users.");

        var conversation = new Conversation
        {
            Id = Guid.NewGuid(),
            Type = type,
            PairKey = CreatePairKey(firstUserId, secondUserId),
            CreatedAt = createdAt,
            LastMessageAt = createdAt
        };
        conversation.Participants.Add(new ConversationParticipant(conversation.Id, firstUserId, createdAt));
        conversation.Participants.Add(new ConversationParticipant(conversation.Id, secondUserId, createdAt));
        return conversation;
    }

    public static string CreatePairKey(Guid firstUserId, Guid secondUserId)
    {
        return firstUserId.CompareTo(secondUserId) < 0
            ? $"{firstUserId}:{secondUserId}"
            : $"{secondUserId}:{firstUserId}";
    }

    public void ApplyMessage(Message message)
    {
        if (message.ConversationId != Id)
            throw new ArgumentException("Message belongs to another conversation.", nameof(message));

        LastMessageAt = message.CreatedAt;
        LastMessagePreview = message.Body.Length <= PreviewLength
            ? message.Body
            : message.Body[..PreviewLength];
    }
}

public sealed class ConversationParticipant
{
    public ConversationParticipant()
    {
    }

    public ConversationParticipant(Guid conversationId, Guid userId, DateTime joinedAt)
    {
        ConversationId = conversationId;
        UserId = userId;
        JoinedAt = joinedAt;
    }

    public Guid ConversationId { get; set; }
    public Guid UserId { get; set; }
    public DateTime JoinedAt { get; set; }
    public DateTime? LastReadAt { get; private set; }
    public Conversation Conversation { get; set; } = null!;
    public User User { get; set; } = null!;

    public void MarkRead(DateTime upTo)
    {
        if (!LastReadAt.HasValue || upTo > LastReadAt.Value)
            LastReadAt = upTo;
    }
}

public sealed class Message : Entity<Guid>
{
    public Guid ConversationId { get; set; }
    public Guid SenderUserId { get; set; }
    public string Body { get; set; } = string.Empty;
    public Guid ClientMessageId { get; set; }
    public Guid? ApplicationRefId { get; set; }
    public DateTime CreatedAt { get; set; }
    public Conversation Conversation { get; set; } = null!;
    public User Sender { get; set; } = null!;
}

public sealed class ChatBlock
{
    public Guid BlockerUserId { get; set; }
    public Guid BlockedUserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public User Blocker { get; set; } = null!;
    public User Blocked { get; set; } = null!;
}

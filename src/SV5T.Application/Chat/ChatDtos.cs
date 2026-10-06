using System.Text;
using System.Text.Json.Serialization;
using SV5T.Domain.Chat;
using SV5T.Domain.Users.Enums;

namespace SV5T.Application.Chat;

public sealed record ChatUserResponse(
    Guid Id,
    string DisplayName,
    string? AvatarUrl,
    string RoleLabel,
    string? UnitLabel,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? StudentCode = null);

public sealed record ConversationSummaryResponse(
    Guid Id,
    ConversationType Type,
    ChatUserResponse OtherUser,
    string? LastMessagePreview,
    DateTime LastMessageAt,
    int UnreadCount);

public sealed record MessageResponse(
    Guid Id,
    Guid ConversationId,
    Guid SenderUserId,
    string Body,
    DateTime CreatedAt,
    Guid ClientMessageId,
    Guid? ApplicationRefId);

public sealed record MessageListResponse(
    IReadOnlyList<MessageResponse> Items,
    string? NextCursor,
    DateTime? OtherLastReadAt);

public sealed record ConversationListResponse(
    IReadOnlyList<ConversationSummaryResponse> Items,
    string? NextCursor);

public sealed record ContactResponse(
    Guid UserId,
    string DisplayName,
    string? AvatarUrl,
    string RoleLabel,
    string? UnitLabel,
    Guid? ExistingConversationId = null,
    string? Reason = null,
    [property: JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] string? StudentCode = null);

public sealed record ConversationIdResponse(Guid ConversationId);
public sealed record UnreadTotalResponse(int Total);

public sealed record ChatUserData(
    Guid Id,
    string DisplayName,
    string? AvatarUrl,
    Role Role,
    string? Faculty,
    string? AdministrativeClass,
    string? School,
    string? Major,
    string? StudentCode,
    bool IsActive,
    bool IsDeleted);

public sealed record ChatApplicationData(
    Guid Id,
    string ApplicationCode,
    Guid? ApplicantUserId,
    Guid? AssignedReviewerId);

public sealed record ChatConversationAccess(
    Conversation Conversation,
    ConversationParticipant CurrentParticipant,
    ConversationParticipant OtherParticipant);

public sealed record ChatConversationRow(
    Guid Id,
    ConversationType Type,
    Guid OtherUserId,
    string? LastMessagePreview,
    DateTime LastMessageAt,
    int UnreadCount);

public sealed record ChatConversationPage(
    IReadOnlyList<ChatConversationRow> Items,
    IReadOnlyDictionary<Guid, ChatUserData> Users);

public sealed record ChatMessagePage(
    IReadOnlyList<Message> Items,
    DateTime? OtherLastReadAt);

public sealed record SuggestedContactSeed(Guid UserId, string? Reason, DateTime SortAt, int Priority);

public interface IChatRepository
{
    Task<ChatUserData?> GetUserAsync(Guid userId, CancellationToken cancellationToken);
    Task<ChatApplicationData?> GetApplicationAsync(Guid applicationId, CancellationToken cancellationToken);
    Task<bool> MentorCanContactStudentAsync(Guid mentorId, Guid studentId, CancellationToken cancellationToken);
    Task<bool> HasBlockBetweenAsync(Guid firstUserId, Guid secondUserId, CancellationToken cancellationToken);
    Task<Conversation?> FindConversationByPairKeyAsync(string pairKey, CancellationToken cancellationToken);
    Task AddConversationAsync(Conversation conversation, CancellationToken cancellationToken);
    Task<ChatConversationAccess?> GetConversationAccessAsync(Guid conversationId, Guid userId, bool tracking, CancellationToken cancellationToken);
    Task<Message?> FindMessageAsync(Guid conversationId, Guid senderUserId, Guid clientMessageId, CancellationToken cancellationToken);
    Task<bool> CanReferenceApplicationAsync(Guid applicationId, Guid senderUserId, bool isStaff, CancellationToken cancellationToken);
    void AddMessage(Message message);
    Task<bool> TrySaveChangesAsync(CancellationToken cancellationToken);
    Task<ChatConversationPage> GetConversationsAsync(Guid userId, DateTime? beforeAt, Guid? beforeId, int take, CancellationToken cancellationToken);
    Task<ChatMessagePage?> GetMessagesAsync(Guid conversationId, Guid userId, DateTime? beforeAt, Guid? beforeId, int take, CancellationToken cancellationToken);
    Task<int> GetUnreadConversationCountAsync(Guid userId, CancellationToken cancellationToken);
    Task<IReadOnlyList<ChatUserData>> GetContactDirectoryAsync(CancellationToken cancellationToken);
    Task<IReadOnlyDictionary<Guid, Guid>> GetExistingConversationIdsAsync(Guid userId, IReadOnlyCollection<Guid> otherUserIds, CancellationToken cancellationToken);
    Task<IReadOnlySet<Guid>> GetUsersWhoBlockedAsync(Guid userId, CancellationToken cancellationToken);
    Task<IReadOnlySet<Guid>> GetAssignedMentorIdsAsync(Guid studentId, CancellationToken cancellationToken);
    Task<IReadOnlySet<Guid>> GetRecentContactIdsAsync(Guid userId, CancellationToken cancellationToken);
    Task<IReadOnlyList<SuggestedContactSeed>> GetSuggestedContactsAsync(Guid userId, Role role, CancellationToken cancellationToken);
    Task<Guid?> GetLatestSupportContactAsync(Guid userId, CancellationToken cancellationToken);
    Task<Guid?> GetSupportAdminAsync(Guid userId, Guid? configuredUserId, CancellationToken cancellationToken);
    Task<bool> BlockExistsAsync(Guid blockerUserId, Guid blockedUserId, CancellationToken cancellationToken);
    void AddBlock(ChatBlock block);
    Task RemoveBlockAsync(Guid blockerUserId, Guid blockedUserId, CancellationToken cancellationToken);
}

internal static class ChatCursor
{
    public static string Encode(DateTime at, Guid id)
    {
        var raw = $"{at.ToUniversalTime():O}|{id:N}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(raw))
            .TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    public static bool TryDecode(string? cursor, out DateTime at, out Guid id)
    {
        at = default;
        id = default;
        if (string.IsNullOrWhiteSpace(cursor)) return false;
        try
        {
            var value = cursor.Replace('-', '+').Replace('_', '/');
            value = value.PadRight(value.Length + (4 - value.Length % 4) % 4, '=');
            var parts = Encoding.UTF8.GetString(Convert.FromBase64String(value)).Split('|');
            return parts.Length == 2 &&
                   DateTime.TryParseExact(parts[0], "O", System.Globalization.CultureInfo.InvariantCulture,
                       System.Globalization.DateTimeStyles.RoundtripKind, out at) &&
                   Guid.TryParseExact(parts[1], "N", out id);
        }
        catch (FormatException)
        {
            return false;
        }
    }

    public static MessageResponse Map(Message message) => new(
        message.Id, message.ConversationId, message.SenderUserId, message.Body,
        message.CreatedAt, message.ClientMessageId, message.ApplicationRefId);

    public static string RoleLabel(Role role) => role switch
    {
        Role.User => "Sinh viên",
        Role.Mentor => "Cố vấn",
        Role.Admin => "Quản trị viên",
        _ => role.ToString()
    };

    public static string? UnitLabel(ChatUserData user) =>
        user.Role == Role.User
            ? string.Join(" · ", new[] { user.Faculty, user.AdministrativeClass }.Where(x => !string.IsNullOrWhiteSpace(x)))
            : user.Faculty ?? user.School;
}

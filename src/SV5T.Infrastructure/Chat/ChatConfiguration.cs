using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using MySqlConnector;
using SV5T.Application.Chat;
using SV5T.Domain.Chat;
using SV5T.Domain.Users.Enums;
using SV5T.Infrastructure.Persistence.Context;

namespace SV5T.Infrastructure.Chat;

public sealed class ConversationConfiguration : IEntityTypeConfiguration<Conversation>
{
    public void Configure(EntityTypeBuilder<Conversation> builder)
    {
        builder.ToTable("chat_conversations");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.PairKey).HasMaxLength(73).IsRequired();
        builder.Property(x => x.LastMessagePreview).HasMaxLength(100);
        builder.HasIndex(x => x.PairKey).IsUnique();
        builder.HasIndex(x => x.LastMessageAt);
    }
}

public sealed class ConversationParticipantConfiguration : IEntityTypeConfiguration<ConversationParticipant>
{
    public void Configure(EntityTypeBuilder<ConversationParticipant> builder)
    {
        builder.ToTable("chat_conversation_participants");
        builder.HasKey(x => new { x.ConversationId, x.UserId });
        builder.HasIndex(x => new { x.UserId, x.ConversationId });
        builder.HasOne(x => x.Conversation).WithMany(x => x.Participants)
            .HasForeignKey(x => x.ConversationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.ToTable("chat_messages");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Body).HasMaxLength(2000).IsRequired();
        builder.HasIndex(x => new { x.ConversationId, x.CreatedAt, x.Id });
        builder.HasIndex(x => new { x.ConversationId, x.SenderUserId, x.ClientMessageId }).IsUnique();
        builder.HasOne(x => x.Conversation).WithMany(x => x.Messages)
            .HasForeignKey(x => x.ConversationId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Sender).WithMany().HasForeignKey(x => x.SenderUserId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne<SV5T.Domain.Submissions.Application>().WithMany()
            .HasForeignKey(x => x.ApplicationRefId).OnDelete(DeleteBehavior.SetNull);
    }
}

public sealed class ChatBlockConfiguration : IEntityTypeConfiguration<ChatBlock>
{
    public void Configure(EntityTypeBuilder<ChatBlock> builder)
    {
        builder.ToTable("chat_blocks");
        builder.HasKey(x => new { x.BlockerUserId, x.BlockedUserId });
        builder.HasOne(x => x.Blocker).WithMany().HasForeignKey(x => x.BlockerUserId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Blocked).WithMany().HasForeignKey(x => x.BlockedUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

internal sealed class ChatRepository(ApplicationDbContext db) : IChatRepository
{
    public Task<ChatUserData?> GetUserAsync(Guid userId, CancellationToken cancellationToken) =>
        UserQuery(db.Users.AsNoTracking().Where(x => x.Id == userId))
            .FirstOrDefaultAsync(cancellationToken);

    public Task<ChatApplicationData?> GetApplicationAsync(Guid applicationId, CancellationToken cancellationToken) =>
        db.Applications.AsNoTracking().Where(x => x.Id == applicationId)
            .Select(x => new ChatApplicationData(x.Id, x.ApplicationCode, x.ApplicantUserId, x.AssignedReviewerId))
            .FirstOrDefaultAsync(cancellationToken);

    public Task<bool> MentorCanContactStudentAsync(Guid mentorId, Guid studentId, CancellationToken cancellationToken) =>
        db.Applications.AsNoTracking().AnyAsync(x =>
            x.ApplicantUserId == studentId &&
            (x.AssignedReviewerId == mentorId || x.Evidences.Any(e => e.ReviewedBy == mentorId)), cancellationToken);

    public Task<bool> HasBlockBetweenAsync(Guid firstUserId, Guid secondUserId, CancellationToken cancellationToken) =>
        db.ChatBlocks.AsNoTracking().AnyAsync(x =>
            (x.BlockerUserId == firstUserId && x.BlockedUserId == secondUserId) ||
            (x.BlockerUserId == secondUserId && x.BlockedUserId == firstUserId), cancellationToken);

    public Task<Conversation?> FindConversationByPairKeyAsync(string pairKey, CancellationToken cancellationToken) =>
        db.Conversations.AsNoTracking().FirstOrDefaultAsync(x => x.PairKey == pairKey, cancellationToken);

    public Task AddConversationAsync(Conversation conversation, CancellationToken cancellationToken) =>
        db.Conversations.AddAsync(conversation, cancellationToken).AsTask();

    public async Task<ChatConversationAccess?> GetConversationAccessAsync(
        Guid conversationId, Guid userId, bool tracking, CancellationToken cancellationToken)
    {
        IQueryable<Conversation> query = db.Conversations;
        if (!tracking) query = query.AsNoTracking();
        var conversation = await query.Include(x => x.Participants)
            .FirstOrDefaultAsync(x => x.Id == conversationId && x.Participants.Any(p => p.UserId == userId), cancellationToken);
        if (conversation is null) return null;
        var current = conversation.Participants.Single(x => x.UserId == userId);
        var other = conversation.Participants.Single(x => x.UserId != userId);
        return new ChatConversationAccess(conversation, current, other);
    }

    public Task<Message?> FindMessageAsync(
        Guid conversationId, Guid senderUserId, Guid clientMessageId, CancellationToken cancellationToken) =>
        db.Messages.AsNoTracking().FirstOrDefaultAsync(x => x.ConversationId == conversationId &&
            x.SenderUserId == senderUserId && x.ClientMessageId == clientMessageId, cancellationToken);

    public Task<bool> CanReferenceApplicationAsync(
        Guid applicationId, Guid senderUserId, bool isStaff, CancellationToken cancellationToken) =>
        db.Applications.AsNoTracking().AnyAsync(x => x.Id == applicationId && (isStaff || x.ApplicantUserId == senderUserId), cancellationToken);

    public void AddMessage(Message message) => db.Messages.Add(message);

    public async Task<bool> TrySaveChangesAsync(CancellationToken cancellationToken)
    {
        try
        {
            await db.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException exception) when (exception.InnerException is MySqlException { Number: 1062 })
        {
            foreach (var entry in db.ChangeTracker.Entries().Where(x => x.State == EntityState.Added))
                entry.State = EntityState.Detached;
            return false;
        }
    }

    public async Task<ChatConversationPage> GetConversationsAsync(
        Guid userId, DateTime? beforeAt, Guid? beforeId, int take, CancellationToken cancellationToken)
    {
        var query = db.ConversationParticipants.AsNoTracking().Where(x => x.UserId == userId);
        if (beforeAt.HasValue && beforeId.HasValue)
        {
            var at = beforeAt.Value;
            var id = beforeId.Value.ToString();
            query = query.Where(x => x.Conversation.LastMessageAt < at ||
                (x.Conversation.LastMessageAt == at && x.ConversationId.ToString().CompareTo(id) < 0));
        }

        var projected = await query.OrderByDescending(x => x.Conversation.LastMessageAt)
            .ThenByDescending(x => x.ConversationId)
            .Select(x => new
            {
                x.ConversationId,
                x.Conversation.Type,
                OtherUserId = x.Conversation.Participants.Where(p => p.UserId != userId).Select(p => p.UserId).Single(),
                x.Conversation.LastMessagePreview,
                x.Conversation.LastMessageAt,
                UnreadCount = db.Messages.Where(m => m.ConversationId == x.ConversationId &&
                        m.SenderUserId != userId && (!x.LastReadAt.HasValue || m.CreatedAt > x.LastReadAt.Value))
                    .OrderByDescending(m => m.CreatedAt).Select(m => m.Id).Take(100).Count()
            }).Take(take).ToListAsync(cancellationToken);
        var ids = projected.Select(x => x.OtherUserId).Distinct().ToArray();
        var users = await UserQuery(db.Users.AsNoTracking().Where(x => ids.Contains(x.Id)))
            .ToDictionaryAsync(x => x.Id, cancellationToken);
        var rows = projected.Select(x => new ChatConversationRow(
            x.ConversationId, x.Type, x.OtherUserId, x.LastMessagePreview, x.LastMessageAt, x.UnreadCount)).ToArray();
        return new ChatConversationPage(rows, users);
    }

    public async Task<ChatMessagePage?> GetMessagesAsync(
        Guid conversationId, Guid userId, DateTime? beforeAt, Guid? beforeId, int take, CancellationToken cancellationToken)
    {
        var participants = await db.ConversationParticipants.AsNoTracking()
            .Where(x => x.ConversationId == conversationId)
            .Select(x => new { x.UserId, x.LastReadAt }).ToListAsync(cancellationToken);
        if (participants.All(x => x.UserId != userId)) return null;
        var otherReadAt = participants.Single(x => x.UserId != userId).LastReadAt;
        var query = db.Messages.AsNoTracking().Where(x => x.ConversationId == conversationId);
        if (beforeAt.HasValue && beforeId.HasValue)
        {
            var at = beforeAt.Value;
            var id = beforeId.Value.ToString();
            query = query.Where(x => x.CreatedAt < at ||
                (x.CreatedAt == at && x.Id.ToString().CompareTo(id) < 0));
        }
        var items = await query.OrderByDescending(x => x.CreatedAt).ThenByDescending(x => x.Id)
            .Take(take).ToListAsync(cancellationToken);
        return new ChatMessagePage(items, otherReadAt);
    }

    public Task<int> GetUnreadConversationCountAsync(Guid userId, CancellationToken cancellationToken) =>
        db.ConversationParticipants.AsNoTracking().Where(x => x.UserId == userId)
            .CountAsync(x => db.Messages.Any(m => m.ConversationId == x.ConversationId &&
                m.SenderUserId != userId && (!x.LastReadAt.HasValue || m.CreatedAt > x.LastReadAt.Value)), cancellationToken);

    public async Task<IReadOnlyList<ChatUserData>> GetContactDirectoryAsync(CancellationToken cancellationToken) =>
        await UserQuery(db.Users.AsNoTracking()).ToListAsync(cancellationToken);

    public async Task<IReadOnlyDictionary<Guid, Guid>> GetExistingConversationIdsAsync(
        Guid userId, IReadOnlyCollection<Guid> otherUserIds, CancellationToken cancellationToken)
    {
        if (otherUserIds.Count == 0) return new Dictionary<Guid, Guid>();
        var ids = otherUserIds.ToArray();
        var rows = await db.ConversationParticipants.AsNoTracking().Where(x => x.UserId == userId)
            .SelectMany(x => x.Conversation.Participants.Where(p => p.UserId != userId && ids.Contains(p.UserId))
                .Select(p => new { p.UserId, x.ConversationId }))
            .ToListAsync(cancellationToken);
        return rows.GroupBy(x => x.UserId).ToDictionary(x => x.Key, x => x.First().ConversationId);
    }

    public async Task<IReadOnlySet<Guid>> GetUsersWhoBlockedAsync(Guid userId, CancellationToken cancellationToken) =>
        (await db.ChatBlocks.AsNoTracking().Where(x => x.BlockedUserId == userId)
            .Select(x => x.BlockerUserId).ToListAsync(cancellationToken)).ToHashSet();

    public async Task<IReadOnlySet<Guid>> GetAssignedMentorIdsAsync(Guid studentId, CancellationToken cancellationToken) =>
        (await db.Applications.AsNoTracking().Where(x => x.ApplicantUserId == studentId && x.AssignedReviewerId.HasValue)
            .Select(x => x.AssignedReviewerId!.Value).Distinct().ToListAsync(cancellationToken)).ToHashSet();

    public async Task<IReadOnlySet<Guid>> GetRecentContactIdsAsync(Guid userId, CancellationToken cancellationToken) =>
        (await db.ConversationParticipants.AsNoTracking().Where(x => x.UserId == userId)
            .OrderByDescending(x => x.Conversation.LastMessageAt)
            .SelectMany(x => x.Conversation.Participants.Where(p => p.UserId != userId).Select(p => p.UserId))
            .Take(20).ToListAsync(cancellationToken)).ToHashSet();

    public async Task<IReadOnlyList<SuggestedContactSeed>> GetSuggestedContactsAsync(
        Guid userId, Role role, CancellationToken cancellationToken)
    {
        var result = new List<SuggestedContactSeed>();
        if (role == Role.User)
        {
            result.AddRange(await db.Applications.AsNoTracking()
                .Where(x => x.ApplicantUserId == userId && x.AssignedReviewerId.HasValue)
                .Select(x => new SuggestedContactSeed(x.AssignedReviewerId!.Value,
                    "Mentor phụ trách hồ sơ " + x.ApplicationCode, x.AssignedAt ?? x.CreatedAt, 0))
                .ToListAsync(cancellationToken));
            result.AddRange(await db.Users.AsNoTracking()
                .Where(x => x.Role == Role.Admin && x.IsActive && !x.IsDeleted)
                .Select(x => new SuggestedContactSeed(x.Id, "Quản trị viên hỗ trợ", x.CreatedAt, 1))
                .Take(5).ToListAsync(cancellationToken));
        }
        else
        {
            result.AddRange(await db.Applications.AsNoTracking()
                .Where(x => x.AssignedReviewerId == userId && x.ApplicantUserId.HasValue)
                .Select(x => new SuggestedContactSeed(x.ApplicantUserId!.Value,
                    "Sinh viên có hồ sơ " + x.ApplicationCode + " đang được phụ trách", x.AssignedAt ?? x.CreatedAt, 0))
                .ToListAsync(cancellationToken));
        }

        result.AddRange(await db.ConversationParticipants.AsNoTracking().Where(x => x.UserId == userId)
            .OrderByDescending(x => x.Conversation.LastMessageAt)
            .SelectMany(x => x.Conversation.Participants.Where(p => p.UserId != userId)
                .Select(p => new SuggestedContactSeed(p.UserId, "Liên hệ gần đây", x.Conversation.LastMessageAt, 2)))
            .Take(10).ToListAsync(cancellationToken));
        return result;
    }

    public Task<Guid?> GetLatestSupportContactAsync(Guid userId, CancellationToken cancellationToken) =>
        db.ConversationParticipants.AsNoTracking()
            .Where(x => x.UserId == userId && x.Conversation.Type == ConversationType.Support)
            .OrderByDescending(x => x.Conversation.LastMessageAt)
            .SelectMany(x => x.Conversation.Participants.Where(p => p.UserId != userId).Select(p => (Guid?)p.UserId))
            .FirstOrDefaultAsync(cancellationToken);

    public async Task<Guid?> GetSupportAdminAsync(Guid userId, Guid? configuredUserId, CancellationToken cancellationToken)
    {
        if (configuredUserId.HasValue)
        {
            var configured = await db.Users.AsNoTracking().Where(x => x.Id == configuredUserId &&
                    x.Role != Role.User && x.IsActive && !x.IsDeleted)
                .Select(x => (Guid?)x.Id).FirstOrDefaultAsync(cancellationToken);
            if (configured.HasValue) return configured;
        }
        return await db.Users.AsNoTracking().Where(x => x.Role == Role.Admin && x.IsActive && !x.IsDeleted)
            .OrderBy(x => db.ConversationParticipants.Count(p => p.UserId == x.Id && p.Conversation.Type == ConversationType.Support))
            .ThenBy(x => x.Id).Select(x => (Guid?)x.Id).FirstOrDefaultAsync(cancellationToken);
    }

    public Task<bool> BlockExistsAsync(Guid blockerUserId, Guid blockedUserId, CancellationToken cancellationToken) =>
        db.ChatBlocks.AsNoTracking().AnyAsync(x => x.BlockerUserId == blockerUserId && x.BlockedUserId == blockedUserId, cancellationToken);

    public void AddBlock(ChatBlock block) => db.ChatBlocks.Add(block);

    public async Task RemoveBlockAsync(Guid blockerUserId, Guid blockedUserId, CancellationToken cancellationToken)
    {
        var block = await db.ChatBlocks.FirstOrDefaultAsync(
            x => x.BlockerUserId == blockerUserId && x.BlockedUserId == blockedUserId, cancellationToken);
        if (block is not null) db.ChatBlocks.Remove(block);
    }

    private static IQueryable<ChatUserData> UserQuery(IQueryable<SV5T.Domain.Users.User> users) =>
        users.Select(user => new ChatUserData(
        user.Id,
        user.Profile != null && user.Profile.FullName != "" ? user.Profile.FullName : user.DisplayName ?? "Người dùng",
        user.AvatarUrl,
        user.Role,
        user.Profile != null ? user.Profile.Faculty : null,
        user.Profile != null ? user.Profile.AdministrativeClass : null,
        user.Profile != null ? user.Profile.School : null,
        user.Profile != null ? user.Profile.Major : null,
        user.Profile != null ? user.Profile.StudentCode : null,
        user.IsActive,
        user.IsDeleted));
}

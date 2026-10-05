using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SV5T.Application.Notifications;
using SV5T.Domain.Notifications;
using SV5T.Infrastructure.Persistence.Context;

namespace SV5T.Infrastructure.Notifications;

public sealed class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("notifications");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Title).HasMaxLength(200).IsRequired();
        builder.Property(x => x.Body).HasMaxLength(500).IsRequired();
        builder.Property(x => x.DedupKey).HasMaxLength(300);
        builder.HasIndex(x => new { x.RecipientUserId, x.IsRead, x.CreatedAt });
        builder.HasIndex(x => new { x.RecipientUserId, x.DedupKey }).IsUnique();

        builder.HasOne<SV5T.Domain.Users.User>()
            .WithMany()
            .HasForeignKey(x => x.RecipientUserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<SV5T.Domain.Submissions.Application>()
            .WithMany()
            .HasForeignKey(x => x.ApplicationId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

internal sealed class NotificationRepository(ApplicationDbContext db) : INotificationRepository
{
    public async Task<IReadOnlyList<Notification>> GetPageAsync(
        Guid recipientUserId,
        DateTime? beforeCreatedAt,
        Guid? beforeId,
        int take,
        bool unreadOnly,
        CancellationToken cancellationToken)
    {
        var query = db.Notifications
            .AsNoTracking()
            .Where(x => x.RecipientUserId == recipientUserId);
        if (unreadOnly)
            query = query.Where(x => !x.IsRead);
        if (beforeCreatedAt.HasValue && beforeId.HasValue)
        {
            var createdAt = beforeCreatedAt.Value;
            var id = beforeId.Value;
            var idText = id.ToString();
            query = query.Where(x =>
                x.CreatedAt < createdAt ||
                (x.CreatedAt == createdAt && x.Id.ToString().CompareTo(idText) < 0));
        }

        return await query
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .Take(take)
            .ToListAsync(cancellationToken);
    }

    public Task<int> GetUnreadCountAsync(
        Guid recipientUserId,
        CancellationToken cancellationToken) =>
        db.Notifications
            .AsNoTracking()
            .CountAsync(x => x.RecipientUserId == recipientUserId && !x.IsRead, cancellationToken);

    public Task<Notification?> GetForUserAsync(
        Guid notificationId,
        Guid recipientUserId,
        CancellationToken cancellationToken) =>
        db.Notifications.FirstOrDefaultAsync(
            x => x.Id == notificationId && x.RecipientUserId == recipientUserId,
            cancellationToken);

    public Task<int> MarkAllReadAsync(
        Guid recipientUserId,
        DateTime utcNow,
        CancellationToken cancellationToken) =>
        db.Notifications
            .Where(x => x.RecipientUserId == recipientUserId && !x.IsRead)
            .ExecuteUpdateAsync(
                setters => setters
                    .SetProperty(x => x.IsRead, true)
                    .SetProperty(x => x.ReadAt, utcNow),
                cancellationToken);
}

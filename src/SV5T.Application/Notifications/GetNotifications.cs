using System.Text;
using FluentValidation;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Notifications;

namespace SV5T.Application.Notifications;

public sealed record GetNotificationsQuery(string? Cursor, int PageSize = 20, bool UnreadOnly = false)
    : IRequest<NotificationListResponse>;

public sealed record NotificationListResponse(
    IReadOnlyList<NotificationResponse> Items,
    string? NextCursor);

public sealed record NotificationResponse(
    Guid Id,
    NotificationType Type,
    string Title,
    string Body,
    NotificationTargetType TargetType,
    Guid TargetId,
    Guid? ApplicationId,
    bool IsRead,
    DateTime CreatedAt);

public sealed class GetNotificationsQueryValidator : AbstractValidator<GetNotificationsQuery>
{
    public GetNotificationsQueryValidator()
    {
        RuleFor(x => x.Cursor)
            .Must(cursor => cursor is null || NotificationCursor.TryDecode(cursor, out _, out _))
            .WithMessage("Cursor không hợp lệ.");
    }
}

public sealed class GetNotificationsHandler(
    INotificationRepository notifications,
    ICurrentUser currentUser)
    : IRequestHandler<GetNotificationsQuery, NotificationListResponse>
{
    public async Task<NotificationListResponse> Handle(
        GetNotificationsQuery request,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId
            ?? throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phiên đăng nhập không hợp lệ.",
                "invalid_session");

        DateTime? beforeCreatedAt = null;
        Guid? beforeId = null;
        if (request.Cursor is not null &&
            NotificationCursor.TryDecode(request.Cursor, out var createdAt, out var id))
        {
            beforeCreatedAt = createdAt;
            beforeId = id;
        }

        var pageSize = Math.Clamp(request.PageSize, 1, 50);
        var rows = await notifications.GetPageAsync(
            userId,
            beforeCreatedAt,
            beforeId,
            pageSize + 1,
            request.UnreadOnly,
            cancellationToken);
        var hasMore = rows.Count > pageSize;
        var page = rows.Take(pageSize).ToArray();
        var items = page.Select(Map).ToArray();
        var nextCursor = hasMore && page.Length > 0
            ? NotificationCursor.Encode(page[^1].CreatedAt, page[^1].Id)
            : null;

        return new NotificationListResponse(items, nextCursor);
    }

    private static NotificationResponse Map(Notification notification) =>
        new(
            notification.Id,
            notification.Type,
            notification.Title,
            notification.Body,
            notification.TargetType,
            notification.TargetId,
            notification.ApplicationId,
            notification.IsRead,
            notification.CreatedAt);
}

internal static class NotificationCursor
{
    public static string Encode(DateTime createdAt, Guid id)
    {
        var value = $"{createdAt.ToUniversalTime():O}|{id:N}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(value))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    public static bool TryDecode(string cursor, out DateTime createdAt, out Guid id)
    {
        createdAt = default;
        id = default;
        if (string.IsNullOrWhiteSpace(cursor))
            return false;

        try
        {
            var base64 = cursor.Replace('-', '+').Replace('_', '/');
            base64 = base64.PadRight(base64.Length + ((4 - base64.Length % 4) % 4), '=');
            var parts = Encoding.UTF8.GetString(Convert.FromBase64String(base64)).Split('|');
            return parts.Length == 2 &&
                   DateTime.TryParseExact(
                       parts[0],
                       "O",
                       System.Globalization.CultureInfo.InvariantCulture,
                       System.Globalization.DateTimeStyles.RoundtripKind,
                       out createdAt) &&
                   Guid.TryParseExact(parts[1], "N", out id);
        }
        catch (FormatException)
        {
            return false;
        }
    }
}

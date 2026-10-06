using FluentValidation;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Users.Enums;

namespace SV5T.Application.Chat;

public sealed record GetConversationsQuery(string? Cursor, int PageSize = 20)
    : IRequest<ConversationListResponse>;

public sealed class GetConversationsQueryValidator : AbstractValidator<GetConversationsQuery>
{
    public GetConversationsQueryValidator()
    {
        RuleFor(x => x.PageSize).InclusiveBetween(1, 50);
        RuleFor(x => x.Cursor).Must(x => x is null || ChatCursor.TryDecode(x, out _, out _))
            .WithMessage("Cursor không hợp lệ.");
    }
}

public sealed class GetConversationsHandler(IChatRepository chats, ICurrentUser currentUser)
    : IRequestHandler<GetConversationsQuery, ConversationListResponse>
{
    public async Task<ConversationListResponse> Handle(GetConversationsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw Unauthorized();
        DateTime? beforeAt = null;
        Guid? beforeId = null;
        if (ChatCursor.TryDecode(request.Cursor, out var at, out var id))
        {
            beforeAt = at;
            beforeId = id;
        }

        var page = await chats.GetConversationsAsync(
            userId, beforeAt, beforeId, request.PageSize + 1, cancellationToken);
        var rows = page.Items.Take(request.PageSize).ToArray();
        var items = rows.Select(row =>
        {
            var other = page.Users[row.OtherUserId];
            return new ConversationSummaryResponse(
                row.Id,
                row.Type,
                new ChatUserResponse(other.Id, other.DisplayName, other.AvatarUrl,
                    ChatCursor.RoleLabel(other.Role), ChatCursor.UnitLabel(other),
                    currentUser.IsInRole(nameof(Role.Mentor)) || currentUser.IsInRole(nameof(Role.Admin))
                        ? other.StudentCode
                        : null),
                row.LastMessagePreview,
                row.LastMessageAt,
                Math.Min(99, row.UnreadCount));
        }).ToArray();
        var next = page.Items.Count > request.PageSize && rows.Length > 0
            ? ChatCursor.Encode(rows[^1].LastMessageAt, rows[^1].Id)
            : null;
        return new ConversationListResponse(items, next);
    }

    private static UseCaseException Unauthorized() => new(
        ApplicationErrorKind.Unauthorized, "Phiên đăng nhập không hợp lệ.", "invalid_session");
}

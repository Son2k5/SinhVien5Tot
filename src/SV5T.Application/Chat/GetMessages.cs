using FluentValidation;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;

namespace SV5T.Application.Chat;

public sealed record GetMessagesQuery(Guid ConversationId, string? Cursor, int PageSize = 20)
    : IRequest<MessageListResponse>;

public sealed class GetMessagesQueryValidator : AbstractValidator<GetMessagesQuery>
{
    public GetMessagesQueryValidator()
    {
        RuleFor(x => x.ConversationId).NotEmpty();
        RuleFor(x => x.PageSize).InclusiveBetween(1, 50);
        RuleFor(x => x.Cursor).Must(x => x is null || ChatCursor.TryDecode(x, out _, out _))
            .WithMessage("Cursor không hợp lệ.");
    }
}

public sealed class GetMessagesHandler(IChatRepository chats, ICurrentUser currentUser)
    : IRequestHandler<GetMessagesQuery, MessageListResponse>
{
    public async Task<MessageListResponse> Handle(GetMessagesQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized, "Phiên đăng nhập không hợp lệ.", "invalid_session");
        DateTime? beforeAt = null;
        Guid? beforeId = null;
        if (ChatCursor.TryDecode(request.Cursor, out var at, out var id))
        {
            beforeAt = at;
            beforeId = id;
        }

        var page = await chats.GetMessagesAsync(
            request.ConversationId, userId, beforeAt, beforeId, request.PageSize + 1, cancellationToken)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound,
                "Không tìm thấy cuộc trò chuyện.", "conversation_not_found");
        var rows = page.Items.Take(request.PageSize).ToArray();
        var next = page.Items.Count > request.PageSize && rows.Length > 0
            ? ChatCursor.Encode(rows[^1].CreatedAt, rows[^1].Id)
            : null;
        return new MessageListResponse(rows.Select(ChatCursor.Map).ToArray(), next, page.OtherLastReadAt);
    }
}

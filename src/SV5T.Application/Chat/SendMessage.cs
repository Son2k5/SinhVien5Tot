using System.Text.RegularExpressions;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Chat;
using SV5T.Domain.Users.Enums;

namespace SV5T.Application.Chat;

public sealed record SendMessageCommand(
    Guid ConversationId,
    Guid ClientMessageId,
    string Body,
    Guid? ApplicationRefId) : IRequest<MessageResponse>;

public sealed partial class SendMessageCommandValidator : AbstractValidator<SendMessageCommand>
{
    public SendMessageCommandValidator()
    {
        RuleFor(x => x.ConversationId).NotEmpty();
        RuleFor(x => x.ClientMessageId).NotEmpty();
        RuleFor(x => x.Body)
            .Must(x => !string.IsNullOrWhiteSpace(x)).WithMessage("Nội dung tin nhắn không được để trống.")
            .Must(x => x is null || x.Trim().Length <= 2000).WithMessage("Tin nhắn không được vượt quá 2000 ký tự.")
            .Must(x => x is null || !HtmlTagRegex().IsMatch(x)).WithMessage("Tin nhắn chỉ được chứa văn bản thuần.");
    }

    [GeneratedRegex(@"<\s*/?\s*[a-zA-Z][^>]*>", RegexOptions.CultureInvariant)]
    private static partial Regex HtmlTagRegex();
}

public sealed class SendMessageHandler(
    IChatRepository chats,
    IChatNotifier notifier,
    ICurrentUser currentUser,
    ILogger<SendMessageHandler> logger) : IRequestHandler<SendMessageCommand, MessageResponse>
{
    public async Task<MessageResponse> Handle(SendMessageCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw Unauthorized();
        var existing = await chats.FindMessageAsync(
            request.ConversationId, userId, request.ClientMessageId, cancellationToken);
        if (existing is not null)
            return ChatCursor.Map(existing);

        var access = await chats.GetConversationAccessAsync(
            request.ConversationId, userId, tracking: true, cancellationToken)
            ?? throw ConversationNotFound();
        var recipient = await chats.GetUserAsync(access.OtherParticipant.UserId, cancellationToken);
        if (recipient is null || !recipient.IsActive || recipient.IsDeleted ||
            await chats.HasBlockBetweenAsync(userId, access.OtherParticipant.UserId, cancellationToken))
            throw CannotSend();

        var sender = await chats.GetUserAsync(userId, cancellationToken) ?? throw Unauthorized();
        if (request.ApplicationRefId.HasValue &&
            !await chats.CanReferenceApplicationAsync(
                request.ApplicationRefId.Value, userId, sender.Role != Role.User, cancellationToken))
            throw new UseCaseException(ApplicationErrorKind.Validation,
                "Không thể tham chiếu hồ sơ này.", "invalid_application_reference");

        var message = new Message
        {
            Id = Guid.NewGuid(),
            ConversationId = access.Conversation.Id,
            SenderUserId = userId,
            ClientMessageId = request.ClientMessageId,
            Body = request.Body.Trim(),
            ApplicationRefId = request.ApplicationRefId,
            CreatedAt = DateTime.UtcNow
        };
        access.Conversation.ApplyMessage(message);
        chats.AddMessage(message);
        if (!await chats.TrySaveChangesAsync(cancellationToken))
        {
            existing = await chats.FindMessageAsync(
                request.ConversationId, userId, request.ClientMessageId, cancellationToken);
            return existing is not null
                ? ChatCursor.Map(existing)
                : throw new UseCaseException(ApplicationErrorKind.Conflict,
                    "Không thể gửi tin nhắn.", "message_send_conflict");
        }

        var response = ChatCursor.Map(message);
        try
        {
            await notifier.NotifyNewMessageAsync(
                new[] { userId, access.OtherParticipant.UserId }, response, cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception,
                "Realtime message notification failed for conversation {ConversationId}.", request.ConversationId);
        }
        return response;
    }

    private static UseCaseException Unauthorized() => new(
        ApplicationErrorKind.Unauthorized, "Phiên đăng nhập không hợp lệ.", "invalid_session");
    private static UseCaseException ConversationNotFound() => new(
        ApplicationErrorKind.NotFound, "Không tìm thấy cuộc trò chuyện.", "conversation_not_found");
    private static UseCaseException CannotSend() => new(
        ApplicationErrorKind.Conflict, "Không thể gửi tin nhắn tới người dùng này", "chat_recipient_unavailable");
}

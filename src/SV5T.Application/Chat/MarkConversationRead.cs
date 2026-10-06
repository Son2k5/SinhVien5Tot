using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;

namespace SV5T.Application.Chat;

public sealed record MarkConversationReadCommand(Guid ConversationId) : IRequest;

public sealed class MarkConversationReadCommandValidator : AbstractValidator<MarkConversationReadCommand>
{
    public MarkConversationReadCommandValidator() => RuleFor(x => x.ConversationId).NotEmpty();
}

public sealed class MarkConversationReadHandler(
    IChatRepository chats,
    IChatNotifier notifier,
    ICurrentUser currentUser,
    ILogger<MarkConversationReadHandler> logger) : IRequestHandler<MarkConversationReadCommand>
{
    public async Task Handle(MarkConversationReadCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized, "Phiên đăng nhập không hợp lệ.", "invalid_session");
        var access = await chats.GetConversationAccessAsync(
            request.ConversationId, userId, tracking: true, cancellationToken)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound,
                "Không tìm thấy cuộc trò chuyện.", "conversation_not_found");
        access.CurrentParticipant.MarkRead(access.Conversation.LastMessageAt);
        await chats.TrySaveChangesAsync(cancellationToken);
        var readAt = access.CurrentParticipant.LastReadAt!.Value;
        try
        {
            await notifier.NotifyReadAsync(
                new[] { access.OtherParticipant.UserId }, request.ConversationId, userId, readAt, cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogWarning(exception,
                "Realtime read notification failed for conversation {ConversationId}.", request.ConversationId);
        }
    }
}

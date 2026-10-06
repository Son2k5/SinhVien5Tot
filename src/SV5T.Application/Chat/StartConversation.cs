using FluentValidation;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Chat;
using SV5T.Domain.Users.Enums;

namespace SV5T.Application.Chat;

public sealed record StartConversationCommand(Guid TargetUserId) : IRequest<ConversationIdResponse>;

public sealed class StartConversationCommandValidator : AbstractValidator<StartConversationCommand>
{
    public StartConversationCommandValidator() =>
        RuleFor(x => x.TargetUserId).NotEmpty().WithMessage("Thiếu người dùng cần liên hệ.");
}

public sealed class StartConversationHandler(IChatRepository chats, ICurrentUser currentUser)
    : IRequestHandler<StartConversationCommand, ConversationIdResponse>
{
    public async Task<ConversationIdResponse> Handle(StartConversationCommand request, CancellationToken cancellationToken)
    {
        var userId = RequireUserId();
        if (userId == request.TargetUserId)
            throw Invalid("Không thể tạo cuộc trò chuyện với chính mình.", "chat_self_not_allowed");

        var me = await chats.GetUserAsync(userId, cancellationToken)
            ?? throw NotFound();
        var target = await chats.GetUserAsync(request.TargetUserId, cancellationToken)
            ?? throw NotFound();
        if (!target.IsActive || target.IsDeleted)
            throw Invalid("Người dùng này hiện không khả dụng.", "chat_target_inactive");

        var meIsStudent = me.Role == Role.User;
        var targetIsStudent = target.Role == Role.User;
        if (!meIsStudent && !targetIsStudent)
            throw Invalid("Không hỗ trợ trò chuyện giữa hai tài khoản nhân sự.", "staff_chat_not_allowed");

        var type = meIsStudent && targetIsStudent
            ? ConversationType.Direct
            : ConversationType.Support;

        if (type == ConversationType.Direct &&
            await chats.HasBlockBetweenAsync(userId, target.Id, cancellationToken))
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể liên hệ người dùng này.",
                "chat_contact_unavailable");

        if (me.Role == Role.Mentor && targetIsStudent &&
            !await chats.MentorCanContactStudentAsync(me.Id, target.Id, cancellationToken))
            throw Invalid("Bạn không phụ trách hồ sơ của sinh viên này.", "student_not_assigned");

        var pairKey = Conversation.CreatePairKey(userId, target.Id);
        var existing = await chats.FindConversationByPairKeyAsync(pairKey, cancellationToken);
        if (existing is not null)
            return new ConversationIdResponse(existing.Id);

        var conversation = Conversation.Create(userId, target.Id, type, DateTime.UtcNow);
        await chats.AddConversationAsync(conversation, cancellationToken);
        if (await chats.TrySaveChangesAsync(cancellationToken))
            return new ConversationIdResponse(conversation.Id);

        existing = await chats.FindConversationByPairKeyAsync(pairKey, cancellationToken);
        return existing is not null
            ? new ConversationIdResponse(existing.Id)
            : throw new UseCaseException(ApplicationErrorKind.Conflict, "Không thể tạo cuộc trò chuyện.", "chat_create_conflict");
    }

    private Guid RequireUserId() => currentUser.UserId ?? throw new UseCaseException(
        ApplicationErrorKind.Unauthorized, "Phiên đăng nhập không hợp lệ.", "invalid_session");

    private static UseCaseException Invalid(string message, string code) =>
        new(ApplicationErrorKind.Validation, message, code);

    private static UseCaseException NotFound() =>
        new(ApplicationErrorKind.NotFound, "Không tìm thấy người dùng.", "user_not_found");
}

using FluentValidation;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Chat;
using SV5T.Domain.Users.Enums;

namespace SV5T.Application.Chat;

public sealed record BlockUserCommand(Guid UserId) : IRequest;
public sealed record UnblockUserCommand(Guid UserId) : IRequest;

public sealed class BlockUserCommandValidator : AbstractValidator<BlockUserCommand>
{
    public BlockUserCommandValidator() => RuleFor(x => x.UserId).NotEmpty();
}
public sealed class UnblockUserCommandValidator : AbstractValidator<UnblockUserCommand>
{
    public UnblockUserCommandValidator() => RuleFor(x => x.UserId).NotEmpty();
}

public sealed class BlockUserHandler(IChatRepository chats, ICurrentUser currentUser)
    : IRequestHandler<BlockUserCommand>
{
    public async Task Handle(BlockUserCommand request, CancellationToken cancellationToken)
    {
        var userId = RequireUserId();
        if (userId == request.UserId)
            throw Invalid();
        var target = await chats.GetUserAsync(request.UserId, cancellationToken)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Không tìm thấy người dùng.", "user_not_found");
        if (target.Role != Role.User)
            throw Invalid();
        if (await chats.BlockExistsAsync(userId, request.UserId, cancellationToken)) return;
        chats.AddBlock(new ChatBlock { BlockerUserId = userId, BlockedUserId = request.UserId, CreatedAt = DateTime.UtcNow });
        await chats.TrySaveChangesAsync(cancellationToken);
    }

    private Guid RequireUserId() => currentUser.UserId ?? throw new UseCaseException(
        ApplicationErrorKind.Unauthorized, "Phiên đăng nhập không hợp lệ.", "invalid_session");
    private static UseCaseException Invalid() => new(
        ApplicationErrorKind.Validation, "Chỉ có thể chặn tài khoản sinh viên khác.", "invalid_block_target");
}

public sealed class UnblockUserHandler(IChatRepository chats, ICurrentUser currentUser)
    : IRequestHandler<UnblockUserCommand>
{
    public async Task Handle(UnblockUserCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized, "Phiên đăng nhập không hợp lệ.", "invalid_session");
        var target = await chats.GetUserAsync(request.UserId, cancellationToken);
        if (target is not null && target.Role != Role.User)
            throw new UseCaseException(ApplicationErrorKind.Validation,
                "Chỉ có thể bỏ chặn tài khoản sinh viên.", "invalid_block_target");
        await chats.RemoveBlockAsync(userId, request.UserId, cancellationToken);
        await chats.TrySaveChangesAsync(cancellationToken);
    }
}

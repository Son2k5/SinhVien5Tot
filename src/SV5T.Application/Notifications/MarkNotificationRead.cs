using FluentValidation;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;

namespace SV5T.Application.Notifications;

public sealed record MarkNotificationReadCommand(Guid Id) : IRequest;

public sealed class MarkNotificationReadCommandValidator : AbstractValidator<MarkNotificationReadCommand>
{
    public MarkNotificationReadCommandValidator() => RuleFor(x => x.Id).NotEmpty();
}

public sealed class MarkNotificationReadHandler(
    INotificationRepository notifications,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser)
    : IRequestHandler<MarkNotificationReadCommand>
{
    public async Task Handle(MarkNotificationReadCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId
            ?? throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phiên đăng nhập không hợp lệ.",
                "invalid_session");
        var notification = await notifications.GetForUserAsync(request.Id, userId, cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy thông báo.",
                "notification_not_found");

        notification.MarkRead(DateTime.UtcNow);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}

using FluentValidation;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;

namespace SV5T.Application.Notifications;

public sealed record MarkAllNotificationsReadCommand : IRequest;

public sealed class MarkAllNotificationsReadCommandValidator
    : AbstractValidator<MarkAllNotificationsReadCommand>
{
}

public sealed class MarkAllNotificationsReadHandler(
    INotificationRepository notifications,
    ICurrentUser currentUser)
    : IRequestHandler<MarkAllNotificationsReadCommand>
{
    public async Task Handle(
        MarkAllNotificationsReadCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId
            ?? throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phiên đăng nhập không hợp lệ.",
                "invalid_session");
        await notifications.MarkAllReadAsync(userId, DateTime.UtcNow, cancellationToken);
    }
}

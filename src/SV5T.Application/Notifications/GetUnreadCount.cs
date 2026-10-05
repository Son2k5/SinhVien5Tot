using FluentValidation;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;

namespace SV5T.Application.Notifications;

public sealed record GetUnreadNotificationCountQuery : IRequest<UnreadNotificationCountResponse>;

public sealed record UnreadNotificationCountResponse(int Count);

public sealed class GetUnreadNotificationCountQueryValidator
    : AbstractValidator<GetUnreadNotificationCountQuery>
{
}

public sealed class GetUnreadNotificationCountHandler(
    INotificationRepository notifications,
    ICurrentUser currentUser)
    : IRequestHandler<GetUnreadNotificationCountQuery, UnreadNotificationCountResponse>
{
    public async Task<UnreadNotificationCountResponse> Handle(
        GetUnreadNotificationCountQuery request,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId
            ?? throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phiên đăng nhập không hợp lệ.",
                "invalid_session");
        var count = await notifications.GetUnreadCountAsync(userId, cancellationToken);
        return new UnreadNotificationCountResponse(count);
    }
}

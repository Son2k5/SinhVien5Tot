using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;

namespace SV5T.Application.Chat;

public sealed record GetUnreadTotalQuery : IRequest<UnreadTotalResponse>;

public sealed class GetUnreadTotalQueryValidator : FluentValidation.AbstractValidator<GetUnreadTotalQuery>;

public sealed class GetUnreadTotalHandler(IChatRepository chats, ICurrentUser currentUser)
    : IRequestHandler<GetUnreadTotalQuery, UnreadTotalResponse>
{
    public async Task<UnreadTotalResponse> Handle(GetUnreadTotalQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized, "Phiên đăng nhập không hợp lệ.", "invalid_session");
        return new UnreadTotalResponse(
            await chats.GetUnreadConversationCountAsync(userId, cancellationToken));
    }
}

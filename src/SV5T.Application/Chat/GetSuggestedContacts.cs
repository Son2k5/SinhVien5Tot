using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;

namespace SV5T.Application.Chat;

public sealed record GetSuggestedContactsQuery : IRequest<IReadOnlyList<ContactResponse>>;

public sealed class GetSuggestedContactsQueryValidator
    : FluentValidation.AbstractValidator<GetSuggestedContactsQuery> { }

public sealed class GetSuggestedContactsHandler(IChatRepository chats, ICurrentUser currentUser)
    : IRequestHandler<GetSuggestedContactsQuery, IReadOnlyList<ContactResponse>>
{
    public async Task<IReadOnlyList<ContactResponse>> Handle(GetSuggestedContactsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized, "Phiên đăng nhập không hợp lệ.", "invalid_session");
        var viewer = await chats.GetUserAsync(userId, cancellationToken)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Không tìm thấy người dùng.", "user_not_found");
        var seeds = await chats.GetSuggestedContactsAsync(userId, viewer.Role, cancellationToken);
        var unique = seeds.GroupBy(x => x.UserId).Select(group => group
                .OrderBy(x => x.Priority).ThenByDescending(x => x.SortAt).First())
            .OrderBy(x => x.Priority).ThenByDescending(x => x.SortAt).Take(10).ToArray();
        var directory = await chats.GetContactDirectoryAsync(cancellationToken);
        var users = directory.Where(x => x.IsActive && !x.IsDeleted && unique.Any(seed => seed.UserId == x.Id))
            .ToDictionary(x => x.Id);
        var existing = await chats.GetExistingConversationIdsAsync(userId, unique.Select(x => x.UserId).ToArray(), cancellationToken);
        return unique.Where(x => users.ContainsKey(x.UserId)).Select(seed =>
        {
            var user = users[seed.UserId];
            var existingConversationId = existing.TryGetValue(user.Id, out var conversationId)
                ? conversationId
                : (Guid?)null;
            return new ContactResponse(user.Id, user.DisplayName, user.AvatarUrl,
                ChatCursor.RoleLabel(user.Role), ChatCursor.UnitLabel(user),
                existingConversationId, seed.Reason,
                viewer.Role != Domain.Users.Enums.Role.User ? user.StudentCode : null);
        }).ToArray();
    }
}

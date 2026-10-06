using FluentValidation;
using MediatR;
using Microsoft.Extensions.Caching.Memory;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Users.Enums;

namespace SV5T.Application.Chat;

public enum ChatContactScope { All, Students, Staff }

public sealed record SearchChatContactsQuery(string Q, ChatContactScope Scope = ChatContactScope.All, int Limit = 20)
    : IRequest<IReadOnlyList<ContactResponse>>;

public sealed class SearchChatContactsQueryValidator : AbstractValidator<SearchChatContactsQuery>
{
    public SearchChatContactsQueryValidator()
    {
        RuleFor(x => x.Q).Must(x => x is not null && x.Trim().Length is >= 2 and <= 50)
            .WithMessage("Từ khóa phải có từ 2 đến 50 ký tự.");
        RuleFor(x => x.Limit).InclusiveBetween(1, 20);
        RuleFor(x => x.Scope).IsInEnum();
    }
}

public sealed class SearchChatContactsHandler(
    IChatRepository chats,
    ICurrentUser currentUser,
    IMemoryCache cache) : IRequestHandler<SearchChatContactsQuery, IReadOnlyList<ContactResponse>>
{
    private const string DirectoryCacheKey = "chat:contact-directory:v1";

    public async Task<IReadOnlyList<ContactResponse>> Handle(SearchChatContactsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized, "Phiên đăng nhập không hợp lệ.", "invalid_session");
        var viewer = await chats.GetUserAsync(userId, cancellationToken)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Không tìm thấy người dùng.", "user_not_found");
        var directory = await cache.GetOrCreateAsync(DirectoryCacheKey, async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
            return await chats.GetContactDirectoryAsync(CancellationToken.None);
        }) ?? [];
        if (directory.Count > 20_000)
            throw new UseCaseException(ApplicationErrorKind.Unavailable,
                "Tìm kiếm liên hệ cần được chuyển sang truy vấn cơ sở dữ liệu.", "chat_directory_too_large");

        var visible = directory.Where(x => x.Id != userId && x.IsActive && !x.IsDeleted)
            .Where(x => viewer.Role == Role.User || x.Role == Role.User)
            .Where(x => request.Scope switch
            {
                ChatContactScope.Students => x.Role == Role.User,
                ChatContactScope.Staff => x.Role != Role.User,
                _ => true
            }).ToArray();
        var ids = visible.Select(x => x.Id).ToArray();
        var existing = await chats.GetExistingConversationIdsAsync(userId, ids, cancellationToken);
        var blockers = await chats.GetUsersWhoBlockedAsync(userId, cancellationToken);
        var assignedMentors = viewer.Role == Role.User
            ? await chats.GetAssignedMentorIdsAsync(userId, cancellationToken)
            : new HashSet<Guid>();
        var recent = await chats.GetRecentContactIdsAsync(userId, cancellationToken);
        var context = new ChatSearchViewerContext(
            viewer.Role != Role.User, viewer.Faculty, assignedMentors, recent);

        return visible
            .Where(x => !blockers.Contains(x.Id))
            .Select(x => new { User = x, Score = ChatSearchRanker.ScoreContact(request.Q.Trim(), x, context) })
            .Where(x => x.Score > 0)
            .OrderByDescending(x => x.Score)
            .ThenBy(x => x.User.DisplayName, StringComparer.CurrentCultureIgnoreCase)
            .Take(request.Limit)
            .Select(x =>
            {
                var existingConversationId = existing.TryGetValue(x.User.Id, out var conversationId)
                    ? conversationId
                    : (Guid?)null;
                return new ContactResponse(
                    x.User.Id, x.User.DisplayName, x.User.AvatarUrl,
                    ChatCursor.RoleLabel(x.User.Role), ChatCursor.UnitLabel(x.User),
                    existingConversationId, null,
                    viewer.Role != Role.User ? x.User.StudentCode : null);
            })
            .ToArray();
    }
}

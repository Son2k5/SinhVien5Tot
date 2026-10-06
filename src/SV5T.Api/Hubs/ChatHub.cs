using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using SV5T.Application.Chat;

namespace SV5T.Api.Hubs;

[Authorize]
public sealed class ChatHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var rawUserId = Context.User?.FindFirstValue(JwtRegisteredClaimNames.Sub)
            ?? Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(rawUserId, out var userId))
        {
            Context.Abort();
            return;
        }

        await Groups.AddToGroupAsync(Context.ConnectionId, Group(userId), Context.ConnectionAborted);
        await base.OnConnectedAsync();
    }

    internal static string Group(Guid userId) => $"user:{userId}";
}

public sealed class SignalRChatNotifier(IHubContext<ChatHub> hub) : IChatNotifier
{
    public Task NotifyNewMessageAsync(
        IReadOnlyCollection<Guid> userIds,
        MessageResponse message,
        CancellationToken cancellationToken) =>
        hub.Clients.Groups(userIds.Distinct().Select(ChatHub.Group).ToArray())
            .SendAsync("message:new", message, cancellationToken);

    public Task NotifyReadAsync(
        IReadOnlyCollection<Guid> userIds,
        Guid conversationId,
        Guid readerUserId,
        DateTime readAt,
        CancellationToken cancellationToken) =>
        hub.Clients.Groups(userIds.Distinct().Select(ChatHub.Group).ToArray())
            .SendAsync("conversation:read", new { conversationId, readerUserId, readAt }, cancellationToken);
}

using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SV5T.Application.Chat;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/chat")]
public sealed class ChatController(ISender sender) : ControllerBase
{
    public sealed record StartRequest(Guid TargetUserId);
    public sealed record StartSupportRequest(Guid? ApplicationId);
    public sealed record SendRequest(Guid ClientMessageId, string Body, Guid? ApplicationRefId);

    [HttpGet("conversations")]
    public async Task<ActionResult<ConversationListResponse>> GetConversations(
        [FromQuery] string? cursor, [FromQuery] int pageSize = 20, CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new GetConversationsQuery(cursor, pageSize), cancellationToken));

    [HttpPost("conversations")]
    public async Task<ActionResult<ConversationIdResponse>> Start(
        StartRequest request, CancellationToken cancellationToken) =>
        Ok(await sender.Send(new StartConversationCommand(request.TargetUserId), cancellationToken));

    [HttpPost("support")]
    public async Task<ActionResult<ConversationIdResponse>> StartSupport(
        StartSupportRequest request, CancellationToken cancellationToken) =>
        Ok(await sender.Send(new StartSupportConversationCommand(request.ApplicationId), cancellationToken));

    [HttpGet("conversations/{id:guid}/messages")]
    public async Task<ActionResult<MessageListResponse>> GetMessages(
        Guid id, [FromQuery] string? cursor, [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new GetMessagesQuery(id, cursor, pageSize), cancellationToken));

    [HttpPost("conversations/{id:guid}/messages")]
    [EnableRateLimiting("chat-send")]
    public async Task<ActionResult<MessageResponse>> Send(
        Guid id, SendRequest request, CancellationToken cancellationToken) =>
        Ok(await sender.Send(new SendMessageCommand(
            id, request.ClientMessageId, request.Body, request.ApplicationRefId), cancellationToken));

    [HttpPost("conversations/{id:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken cancellationToken)
    {
        await sender.Send(new MarkConversationReadCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpGet("unread-total")]
    public async Task<ActionResult<UnreadTotalResponse>> GetUnreadTotal(CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetUnreadTotalQuery(), cancellationToken));

    [HttpGet("search")]
    public async Task<ActionResult<IReadOnlyList<ContactResponse>>> Search(
        [FromQuery] string q, [FromQuery] ChatContactScope scope = ChatContactScope.All,
        [FromQuery] int limit = 20, CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new SearchChatContactsQuery(q, scope, limit), cancellationToken));

    [HttpGet("suggested-contacts")]
    public async Task<ActionResult<IReadOnlyList<ContactResponse>>> Suggested(CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetSuggestedContactsQuery(), cancellationToken));

    [HttpPost("blocks/{userId:guid}")]
    public async Task<IActionResult> Block(Guid userId, CancellationToken cancellationToken)
    {
        await sender.Send(new BlockUserCommand(userId), cancellationToken);
        return NoContent();
    }

    [HttpDelete("blocks/{userId:guid}")]
    public async Task<IActionResult> Unblock(Guid userId, CancellationToken cancellationToken)
    {
        await sender.Send(new UnblockUserCommand(userId), cancellationToken);
        return NoContent();
    }
}

using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Notifications;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/notifications")]
public sealed class NotificationsController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<NotificationListResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<NotificationListResponse>> Get(
        [FromQuery] string? cursor,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool unreadOnly = false,
        CancellationToken cancellationToken = default) =>
        Ok(await mediator.Send(
            new GetNotificationsQuery(cursor, pageSize, unreadOnly),
            cancellationToken));

    [HttpGet("unread-count")]
    [ProducesResponseType<UnreadNotificationCountResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<UnreadNotificationCountResponse>> GetUnreadCount(
        CancellationToken cancellationToken) =>
        Ok(await mediator.Send(new GetUnreadNotificationCountQuery(), cancellationToken));

    [HttpPost("{id:guid}/read")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> MarkRead(Guid id, CancellationToken cancellationToken)
    {
        await mediator.Send(new MarkNotificationReadCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("read-all")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> MarkAllRead(CancellationToken cancellationToken)
    {
        await mediator.Send(new MarkAllNotificationsReadCommand(), cancellationToken);
        return NoContent();
    }
}

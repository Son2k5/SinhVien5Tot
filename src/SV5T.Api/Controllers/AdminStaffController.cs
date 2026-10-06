using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Staff;
using SV5T.Domain.Users.Enums;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/staff")]
public sealed class AdminStaffController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResponse<StaffResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResponse<StaffResponse>>> GetAll(
        [FromQuery] Role? role,
        [FromQuery] StaffStatus? status,
        [FromQuery] string? q,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(
            new GetStaffQuery(role, status, q, page, pageSize),
            cancellationToken));

    [HttpGet("{id:guid}")]
    [ProducesResponseType<StaffResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StaffResponse>> GetById(
        Guid id,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetStaffByIdQuery(id), cancellationToken));

    [HttpPost]
    [EnableRateLimiting("staff-write")]
    [ProducesResponseType<CreateStaffResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<CreateStaffResponse>> Create(
        CreateStaffRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(
            new CreateStaffCommand(
                request.Email,
                request.FullName,
                request.Phone,
                request.Role),
            cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = result.Staff.Id }, result);
    }

    [HttpPut("{id:guid}")]
    [EnableRateLimiting("staff-write")]
    [ProducesResponseType<StaffResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<StaffResponse>> Update(
        Guid id,
        UpdateStaffRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new UpdateStaffCommand(
                id,
                request.FullName,
                request.Phone,
                request.Role,
                request.RowVersion),
            cancellationToken));

    [HttpPost("{id:guid}/lock")]
    [EnableRateLimiting("staff-write")]
    [ProducesResponseType<StaffResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<StaffResponse>> Lock(
        Guid id,
        StaffVersionRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new LockStaffCommand(id, request.RowVersion),
            cancellationToken));

    [HttpPost("{id:guid}/unlock")]
    [EnableRateLimiting("staff-write")]
    [ProducesResponseType<StaffResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<StaffResponse>> Unlock(
        Guid id,
        StaffVersionRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new UnlockStaffCommand(id, request.RowVersion),
            cancellationToken));

    [HttpPost("{id:guid}/send-invitation")]
    [EnableRateLimiting("staff-write")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> SendInvitation(
        Guid id,
        CancellationToken cancellationToken)
    {
        await sender.Send(new SendStaffInvitationCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpDelete("{id:guid}")]
    [EnableRateLimiting("staff-write")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Delete(
        Guid id,
        [FromQuery] string rowVersion,
        CancellationToken cancellationToken)
    {
        await sender.Send(new DeleteStaffCommand(id, rowVersion), cancellationToken);
        return NoContent();
    }

    public sealed record CreateStaffRequest(
        string Email,
        string FullName,
        string? Phone,
        Role Role);

    public sealed record UpdateStaffRequest(
        string FullName,
        string? Phone,
        Role Role,
        string RowVersion);

    public sealed record StaffVersionRequest(string RowVersion);
}

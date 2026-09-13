using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Students.Commands.DeleteStudent;
using SV5T.Application.Admin.Students.Commands.LockStudent;
using SV5T.Application.Admin.Students.Commands.ReviewStudent;
using SV5T.Application.Admin.Students.Commands.UnlockStudent;
using SV5T.Application.Admin.Students.Queries.GetStudentById;
using SV5T.Application.Admin.Students.Queries.GetStudentsPaged;
using SV5T.Application.Common.Models;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,Mentor")]
[Route("api/admin/students")]
public sealed class AdminStudentsController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<AdminStudentListItemResponse>>(200)]
    public async Task<ActionResult<PagedResult<AdminStudentListItemResponse>>> GetPaged(
        [FromQuery] string? search = null,
        [FromQuery] string? school = null,
        [FromQuery] string? faculty = null,
        [FromQuery] string? major = null,
        [FromQuery] string? @class = null,
        [FromQuery] int? cohort = null,
        [FromQuery] string? schoolYear = null,
        [FromQuery] bool? isActive = null,
        [FromQuery] bool? isVerified = null,
        [FromQuery] bool includeDeleted = false,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDir = null,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default
    )
    {
        var query = new GetStudentsPagedQuery(
            search,
            faculty,
            major,
            @class,
            cohort,
            school,
            schoolYear,
            isActive,
            isVerified,
            includeDeleted,
            sortBy,
            sortDir,
            pageIndex,
            pageSize
        );

        return Ok(await sender.Send(query, ct));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<AdminStudentDetailResponse>(200)]
    [ProducesResponseType<ProblemDetails>(404)]
    public async Task<ActionResult<AdminStudentDetailResponse>> GetById(Guid id, CancellationToken ct)
    {
        var r = await sender.Send(new GetStudentByIdQuery(id), ct);
        return r is null ? NotFound() : Ok(r);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(204)]
    [ProducesResponseType<ProblemDetails>(400)]
    [ProducesResponseType<ProblemDetails>(404)]
    [ProducesResponseType<ProblemDetails>(409)]
    public async Task<IActionResult> Delete(Guid id, [FromBody] DeleteStudentRequest request, CancellationToken ct)
    {
        await sender.Send(new DeleteStudentCommand(id, request), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/lock")]
    [Authorize(Roles = "Admin,Mentor")]
    [ProducesResponseType(204)]
    [ProducesResponseType<ProblemDetails>(400)]
    [ProducesResponseType<ProblemDetails>(404)]
    [ProducesResponseType<ProblemDetails>(409)]
    public async Task<IActionResult> Lock(Guid id, [FromBody] LockStudentRequest request, CancellationToken ct)
    {
        await sender.Send(new LockStudentCommand(id, request), ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/unlock")]
    [Authorize(Roles = "Admin,Mentor")]
    [ProducesResponseType(204)]
    [ProducesResponseType<ProblemDetails>(400)]
    [ProducesResponseType<ProblemDetails>(404)]
    [ProducesResponseType<ProblemDetails>(409)]
    public async Task<IActionResult> Unlock(Guid id, [FromBody] UnlockStudentRequest request, CancellationToken ct)
    {
        await sender.Send(new UnlockStudentCommand(id, request), ct);
        return NoContent();
    }

    [HttpPatch("{id:guid}/review")]
    [ProducesResponseType<AdminStudentEvidenceItemResponse>(200)]
    [ProducesResponseType<ProblemDetails>(400)]
    [ProducesResponseType<ProblemDetails>(404)]
    [ProducesResponseType<ProblemDetails>(409)]
    public async Task<ActionResult<AdminStudentEvidenceItemResponse>> Review(
        Guid id,
        [FromBody] ReviewStudentEvidenceRequest request,
        CancellationToken ct
    )
    {
        return Ok(await sender.Send(new ReviewStudentCommand(id, request), ct));
    }
}

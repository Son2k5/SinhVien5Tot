using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Commands.AddStandard;
using SV5T.Application.Admin.StandardSets.Commands.CreateStandardSet;

using SV5T.Application.Admin.StandardSets.Commands.DeleteStandard;
using SV5T.Application.Admin.StandardSets.Commands.DeleteStandardSet;
using SV5T.Application.Admin.StandardSets.Commands.InitDefaultStandards;
using SV5T.Application.Admin.StandardSets.Commands.PublishStandardSet;
using SV5T.Application.Admin.StandardSets.Commands.UnpublishStandardSet;
using SV5T.Application.Admin.StandardSets.Commands.UpdateStandard;
using SV5T.Application.Admin.StandardSets.Commands.UpdateStandardSet;
using SV5T.Application.Admin.StandardSets.Queries.GetAllStandardSets;
using SV5T.Application.Admin.StandardSets.Queries.GetStandardsBySetId;
using SV5T.Application.Admin.StandardSets.Queries.GetStandardSetById;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/standard-sets")]
public sealed class AdminStandardSetsController(ISender sender)
    : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<StandardSetResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<StandardSetResponse>>> GetAll(
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetAllStandardSetsQuery(), cancellationToken));

    [HttpGet("{id:guid}")]
    [ProducesResponseType<StandardSetResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StandardSetResponse>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetStandardSetByIdQuery(id), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [ProducesResponseType<StandardSetResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StandardSetResponse>> Create(
        CreateStandardSetRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CreateStandardSetCommand(request), cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType<StandardSetResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StandardSetResponse>> Update(
        Guid id,
        UpdateStandardSetRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new UpdateStandardSetCommand(id, request), cancellationToken));

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        await sender.Send(new DeleteStandardSetCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("{id:guid}/publish")]
    [ProducesResponseType<StandardSetResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StandardSetResponse>> Publish(
        Guid id,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new PublishStandardSetCommand(id), cancellationToken));

    [HttpPost("{id:guid}/unpublish")]
    [ProducesResponseType<StandardSetResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StandardSetResponse>> Unpublish(
        Guid id,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new UnpublishStandardSetCommand(id), cancellationToken));

    // ================= Standard Sub-resources (Tiêu chuẩn lớn) =================

    [HttpGet("{id:guid}/standards")]
    [ProducesResponseType<IReadOnlyList<StandardResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<StandardResponse>>> GetStandards(
        Guid id,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetStandardsBySetIdQuery(id), cancellationToken));

    [HttpPost("{id:guid}/standards")]
    [ProducesResponseType<StandardResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StandardResponse>> AddStandard(
        Guid id,
        CreateStandardRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new AddStandardCommand(id, request), cancellationToken);
        return Created($"api/admin/standard-sets/{id}/standards/{result.Id}", result);
    }

    [HttpPost("{id:guid}/standards/init-defaults")]
    [ProducesResponseType<IReadOnlyList<StandardResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<StandardResponse>>> InitDefaultStandards(
        Guid id,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new InitDefaultStandardsCommand(id), cancellationToken));

    [HttpPut("{id:guid}/standards/{standardId:guid}")]
    [ProducesResponseType<StandardResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StandardResponse>> UpdateStandard(
        Guid id,
        Guid standardId,
        UpdateStandardRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new UpdateStandardCommand(id, standardId, request), cancellationToken));

    [HttpDelete("{id:guid}/standards/{standardId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteStandard(
        Guid id,
        Guid standardId,
        CancellationToken cancellationToken)
    {
        await sender.Send(new DeleteStandardCommand(id, standardId), cancellationToken);
        return NoContent();
    }
}

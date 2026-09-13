using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Services;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/standard-sets")]
public sealed class AdminStandardSetsController(IAdminStandardService standardService)
    : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<StandardSetResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<IReadOnlyList<StandardSetResponse>>> GetAll(
        CancellationToken cancellationToken) =>
        Ok(await standardService.GetAllAsync(cancellationToken));

    [HttpGet("{id:guid}")]
    [ProducesResponseType<StandardSetResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StandardSetResponse>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await standardService.GetByIdAsync(id, cancellationToken);
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
        var result = await standardService.CreateAsync(request, cancellationToken);

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
        Ok(await standardService.UpdateAsync(id, request, cancellationToken));

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        await standardService.DeleteAsync(id, cancellationToken);
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
        Ok(await standardService.PublishAsync(id, cancellationToken));

    [HttpPost("{id:guid}/unpublish")]
    [ProducesResponseType<StandardSetResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StandardSetResponse>> Unpublish(
        Guid id,
        CancellationToken cancellationToken) =>
        Ok(await standardService.UnpublishAsync(id, cancellationToken));

    // ================= Standard Sub-resources (Tiêu chuẩn lớn) =================

    [HttpGet("{id:guid}/standards")]
    [ProducesResponseType<IReadOnlyList<StandardResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<StandardResponse>>> GetStandards(
        Guid id,
        CancellationToken cancellationToken) =>
        Ok(await standardService.GetStandardsAsync(id, cancellationToken));

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
        var result = await standardService.AddStandardAsync(id, request, cancellationToken);
        return Created($"api/admin/standard-sets/{id}/standards/{result.Id}", result);
    }

    [HttpPost("{id:guid}/standards/init-defaults")]
    [ProducesResponseType<IReadOnlyList<StandardResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<StandardResponse>>> InitDefaultStandards(
        Guid id,
        CancellationToken cancellationToken) =>
        Ok(await standardService.InitDefaultStandardsAsync(id, cancellationToken));

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
        Ok(await standardService.UpdateStandardAsync(id, standardId, request, cancellationToken));

    [HttpDelete("{id:guid}/standards/{standardId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteStandard(
        Guid id,
        Guid standardId,
        CancellationToken cancellationToken)
    {
        await standardService.DeleteStandardAsync(id, standardId, cancellationToken);
        return NoContent();
    }
}

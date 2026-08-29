using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Services;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/standard-sets")]
public sealed class AdminStandardSetsController(
    IAdminStandardService standardService)
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

    // ================= Criteria Sub-resources =================

    [HttpGet("{id:guid}/criteria")]
    [ProducesResponseType<IReadOnlyList<CriterionResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<CriterionResponse>>> GetCriteria(
        Guid id,
        CancellationToken cancellationToken) =>
        Ok(await standardService.GetCriteriaAsync(id, cancellationToken));

    [HttpPost("{id:guid}/criteria")]
    [ProducesResponseType<CriterionResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CriterionResponse>> AddCriterion(
        Guid id,
        CreateCriterionRequest request,
        CancellationToken cancellationToken)
    {
        var result = await standardService.AddCriterionAsync(id, request, cancellationToken);

        return Created(
            $"api/admin/standard-sets/{id}/criteria/{result.Id}",
            result);
    }

    [HttpPut("{id:guid}/criteria/{criterionId:guid}")]
    [ProducesResponseType<CriterionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CriterionResponse>> UpdateCriterion(
        Guid id,
        Guid criterionId,
        UpdateCriterionRequest request,
        CancellationToken cancellationToken) =>
        Ok(await standardService.UpdateCriterionAsync(id, criterionId, request, cancellationToken));

    [HttpDelete("{id:guid}/criteria/{criterionId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteCriterion(
        Guid id,
        Guid criterionId,
        CancellationToken cancellationToken)
    {
        await standardService.DeleteCriterionAsync(id, criterionId, cancellationToken);
        return NoContent();
    }
}

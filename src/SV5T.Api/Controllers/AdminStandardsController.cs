using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Criteria.Abstractions;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/standards")]
public sealed class AdminStandardsController(ICriterionService criterionService)
    : ControllerBase
{
    [HttpGet("{standardId:guid}/criteria")]
    [ProducesResponseType<IReadOnlyList<CriterionResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<CriterionResponse>>> GetCriteria(
        Guid standardId,
        CancellationToken cancellationToken) =>
        Ok(await criterionService.GetCriteriaAsync(standardId, cancellationToken));

    [HttpPost("{standardId:guid}/criteria")]
    [ProducesResponseType<CriterionResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CriterionResponse>> AddCriterion(
        Guid standardId,
        CreateCriterionRequest request,
        CancellationToken cancellationToken)
    {
        var result = await criterionService.AddCriterionAsync(standardId, request, cancellationToken);
        return Created($"api/admin/standards/{standardId}/criteria/{result.Id}", result);
    }

    [HttpPut("{standardId:guid}/criteria/{criterionId:guid}")]
    [ProducesResponseType<CriterionResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CriterionResponse>> UpdateCriterion(
        Guid standardId,
        Guid criterionId,
        UpdateCriterionRequest request,
        CancellationToken cancellationToken) =>
        Ok(await criterionService.UpdateCriterionAsync(standardId, criterionId, request, cancellationToken));

    [HttpDelete("{standardId:guid}/criteria/{criterionId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteCriterion(
        Guid standardId,
        Guid criterionId,
        CancellationToken cancellationToken)
    {
        await criterionService.DeleteCriterionAsync(standardId, criterionId, cancellationToken);
        return NoContent();
    }
}

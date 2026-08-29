using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Services;
using SV5T.Domain.Evidences;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,Mentor")]
[Route("api/admin/evidences")]
public sealed class AdminEvidencesController(
    IAdminEvidenceReviewService evidenceReviewService)
    : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResponse<EvidenceResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResponse<EvidenceResponse>>> GetAll(
        [FromQuery] Guid? campaignId,
        [FromQuery] EvidenceStatus? status,
        [FromQuery] Guid? applicationId,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await evidenceReviewService.GetPagedAsync(
            campaignId,
            status,
            applicationId,
            pageIndex,
            pageSize,
            cancellationToken));

    [HttpGet("{id:guid}")]
    [ProducesResponseType<EvidenceResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EvidenceResponse>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await evidenceReviewService.GetByIdAsync(id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{id:guid}/review")]
    [ProducesResponseType<EvidenceResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<EvidenceResponse>> Review(
        Guid id,
        ReviewEvidenceRequest request,
        CancellationToken cancellationToken) =>
        Ok(await evidenceReviewService.ReviewAsync(
            id,
            request,
            cancellationToken));
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Services;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Campaigns.Enums;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/campaigns")]
public sealed class AdminCampaignsController(
    IAdminCampaignService campaignService)
    : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResponse<CampaignResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<PagedResponse<CampaignResponse>>> GetPaged(
        [FromQuery] AwardLevel? level,
        [FromQuery] CampaignStatus? status,
        [FromQuery] string? schoolYear,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await campaignService.GetPagedAsync(level, status, schoolYear, pageIndex, pageSize, cancellationToken));

    [HttpGet("all")]
    [ProducesResponseType<IReadOnlyList<CampaignResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CampaignResponse>>> GetAll(
        [FromQuery] AwardLevel? level,
        [FromQuery] CampaignStatus? status,
        [FromQuery] string? schoolYear,
        CancellationToken cancellationToken = default) =>
        Ok(await campaignService.GetAllAsync(level, status, schoolYear, cancellationToken));

    [HttpGet("{id:guid}")]
    [ProducesResponseType<CampaignDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CampaignDetailResponse>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await campaignService.GetByIdAsync(id, cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost]
    [ProducesResponseType<CampaignDetailResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CampaignDetailResponse>> Create(
        CreateCampaignRequest request,
        CancellationToken cancellationToken)
    {
        var result = await campaignService.CreateAsync(request, cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            result);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType<CampaignDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<CampaignDetailResponse>> Update(
        Guid id,
        UpdateCampaignRequest request,
        CancellationToken cancellationToken) =>
        Ok(await campaignService.UpdateAsync(id, request, cancellationToken));

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType<CampaignDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CampaignDetailResponse>> UpdateStatus(
        Guid id,
        UpdateCampaignStatusRequest request,
        CancellationToken cancellationToken) =>
        Ok(await campaignService.UpdateStatusAsync(id, request, cancellationToken));

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        await campaignService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}

using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Admin.Campaigns.Commands.BatchDeleteCampaigns;
using SV5T.Application.Admin.Campaigns.Commands.CreateCampaign;
using SV5T.Application.Admin.Campaigns.Commands.DeleteCampaign;
using SV5T.Application.Admin.Campaigns.Commands.UpdateCampaign;
using SV5T.Application.Admin.Campaigns.Commands.UpdateCampaignStatus;
using SV5T.Application.Admin.Campaigns.Queries.GetAllCampaigns;
using SV5T.Application.Admin.Campaigns.Queries.GetCampaignById;
using SV5T.Application.Admin.Campaigns.Queries.GetCampaignsPaged;
using SV5T.Application.Admin.Dtos;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Campaigns.Enums;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin")]
[Route("api/admin/campaigns")]
public sealed class AdminCampaignsController(ISender sender) : ControllerBase
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
        Ok(await sender.Send(new GetCampaignsPagedQuery(level, status, schoolYear, pageIndex, pageSize), cancellationToken));

    [HttpGet("all")]
    [ProducesResponseType<IReadOnlyList<CampaignResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<CampaignResponse>>> GetAll(
        [FromQuery] AwardLevel? level,
        [FromQuery] CampaignStatus? status,
        [FromQuery] string? schoolYear,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new GetAllCampaignsQuery(level, status, schoolYear), cancellationToken));

    [HttpGet("{id:guid}")]
    [ProducesResponseType<CampaignDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CampaignDetailResponse>> GetById(
        Guid id,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetCampaignByIdQuery(id), cancellationToken);
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
        var result = await sender.Send(new CreateCampaignCommand(request), cancellationToken);

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
        Ok(await sender.Send(new UpdateCampaignCommand(id, request), cancellationToken));

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType<CampaignDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<CampaignDetailResponse>> UpdateStatus(
        Guid id,
        UpdateCampaignStatusRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new UpdateCampaignStatusCommand(id, request), cancellationToken));

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(
        Guid id,
        CancellationToken cancellationToken)
    {
        await sender.Send(new DeleteCampaignCommand(id), cancellationToken);
        return NoContent();
    }

    [HttpPost("batch-delete")]
    [ProducesResponseType<BatchDeleteCampaignsResult>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<BatchDeleteCampaignsResult>> BatchDelete(
        [FromBody] BatchDeleteCampaignsRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new BatchDeleteCampaignsCommand(request.Ids), cancellationToken);
        return Ok(result);
    }
}

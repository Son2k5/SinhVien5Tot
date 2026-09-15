using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Common.Models;
using SV5T.Application.Student.Campaigns.Queries.GetCampaignDetail;
using SV5T.Application.Student.Campaigns.Queries.GetOpenCampaigns;
using SV5T.Application.Student.Dtos;
using SV5T.Domain.Awards.Enums;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/student/campaigns")]
public sealed class StudentCampaignsController(ISender sender) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<PagedResult<StudentCampaignListItemResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResult<StudentCampaignListItemResponse>>> GetOpen(
        [FromQuery] AwardLevel? level,
        [FromQuery] string? schoolYear,
        [FromQuery] AwardType? awardType,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new GetOpenCampaignsQuery(level, schoolYear, awardType, pageIndex, pageSize), cancellationToken));

    [HttpGet("{campaignId:guid}")]
    [ProducesResponseType<StudentCampaignDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StudentCampaignDetailResponse>> GetDetail(
        Guid campaignId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetStudentCampaignDetailQuery(campaignId), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }
}

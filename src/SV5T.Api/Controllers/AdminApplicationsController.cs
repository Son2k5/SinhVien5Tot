using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Admin.Applications;
using SV5T.Application.Admin.Dtos;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,Mentor")]
[Route("api/admin/applications")]
public sealed class AdminApplicationsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<PagedResponse<ReviewApplicationResponse>>> GetAll(
        [FromQuery] Guid? campaignId, [FromQuery] SubmissionStatus? status,
        [FromQuery] int pageIndex = 1, [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new GetSubmittedApplicationsQuery(campaignId, status, pageIndex, pageSize), cancellationToken));

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ReviewApplicationResponse>> Get(Guid id, CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetSubmittedApplicationQuery(id), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{id:guid}/decision")]
    public async Task<ActionResult<ReviewApplicationResponse>> Decide(Guid id,
        ReviewApplicationDecisionRequest request, CancellationToken cancellationToken) =>
        Ok(await sender.Send(new DecideApplicationCommand(id, request), cancellationToken));
}

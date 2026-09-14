using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Common.Models;
using SV5T.Application.Student.Applications.Commands.CreateApplication;
using SV5T.Application.Student.Applications.Commands.SubmitApplication;
using SV5T.Application.Student.Applications.Commands.WithdrawApplication;
using SV5T.Application.Student.Applications.Queries.GetApplicationDetail;
using SV5T.Application.Student.Applications.Queries.GetMyApplications;
using SV5T.Application.Student.Dtos;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/student/applications")]
public sealed class StudentApplicationsController(ISender sender) : ControllerBase
{
    public sealed class CreateApplicationRequest
    {
        public Guid CampaignId { get; set; }
    }

    public sealed class SubmitApplicationRequest
    {
        public string RowVersion { get; set; } = string.Empty;
    }

    public sealed class WithdrawApplicationRequest
    {
        public string RowVersion { get; set; } = string.Empty;
        public string? Reason { get; set; }
    }

    [HttpGet]
    [ProducesResponseType<PagedResult<StudentApplicationSummaryResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResult<StudentApplicationSummaryResponse>>> GetMine(
        [FromQuery] SubmissionStatus? status,
        [FromQuery] int pageIndex = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default) =>
        Ok(await sender.Send(new GetMyApplicationsQuery(status, pageIndex, pageSize), cancellationToken));

    [HttpPost]
    [ProducesResponseType<StudentApplicationDetailResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StudentApplicationDetailResponse>> Create(
        CreateApplicationRequest request,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new CreateApplicationCommand(request.CampaignId), cancellationToken);
        return CreatedAtAction(nameof(GetDetail), new { applicationId = result.Id }, result);
    }

    [HttpGet("{applicationId:guid}")]
    [ProducesResponseType<StudentApplicationDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<StudentApplicationDetailResponse>> GetDetail(
        Guid applicationId,
        CancellationToken cancellationToken)
    {
        var result = await sender.Send(new GetStudentApplicationDetailQuery(applicationId), cancellationToken);
        return result is null ? NotFound() : Ok(result);
    }

    [HttpPost("{applicationId:guid}/submit")]
    [ProducesResponseType<StudentApplicationDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StudentApplicationDetailResponse>> Submit(
        Guid applicationId,
        SubmitApplicationRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new SubmitApplicationCommand(applicationId, request.RowVersion), cancellationToken));

    [HttpPost("{applicationId:guid}/withdraw")]
    [ProducesResponseType<StudentApplicationDetailResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StudentApplicationDetailResponse>> Withdraw(
        Guid applicationId,
        WithdrawApplicationRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new WithdrawApplicationCommand(applicationId, request.RowVersion, request.Reason),
            cancellationToken));
}

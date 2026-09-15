using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Student.Dtos;
using SV5T.Application.Student.Evidences.Commands.UpsertEvidence;
using SV5T.Application.Student.Evidences.Commands.UploadEvidenceFile;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/student")]
public sealed class StudentEvidencesController(ISender sender) : ControllerBase
{
    private const long MaxEvidenceBytes = 10 * 1024 * 1024;
    private const long MaxEvidenceRequestBytes = MaxEvidenceBytes + 512 * 1024;

    public sealed class UpsertEvidenceBodyRequest
    {
        public string DataJson { get; set; } = "{}";
        public string? RowVersion { get; set; }
    }

    public sealed class UploadEvidenceFileForm
    {
        [FromForm(Name = "file")]
        public IFormFile? File { get; set; }
    }

    [HttpPut("applications/{applicationId:guid}/evidences/{criterionId:guid}")]
    [ProducesResponseType<StudentEvidenceItemResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<StudentEvidenceItemResponse>> Upsert(
        Guid applicationId,
        Guid criterionId,
        UpsertEvidenceBodyRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new UpsertEvidenceCommand(applicationId, criterionId, new UpsertEvidenceRequest(request.DataJson, request.RowVersion)),
            cancellationToken));

    [HttpPost("evidences/{evidenceId:guid}/files")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxEvidenceRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxEvidenceRequestBytes)]
    [ProducesResponseType<StudentEvidenceItemResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<StudentEvidenceItemResponse>> UploadFile(
        Guid evidenceId,
        [FromForm] UploadEvidenceFileForm form,
        CancellationToken cancellationToken)
    {
        var file = form.File;
        if (file is null || file.Length == 0 || file.Length > MaxEvidenceBytes)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Tập tin minh chứng phải có dung lượng từ 1 byte đến 10 MB.",
                "invalid_evidence_size");
        }

        await using var content = new MemoryStream((int)file.Length);
        await file.CopyToAsync(content, cancellationToken);
        content.Position = 0;

        return Ok(await sender.Send(
            new UploadEvidenceFileCommand(
                evidenceId,
                new UploadEvidenceFileRequest(content, file.FileName, file.Length)),
            cancellationToken));
    }
}

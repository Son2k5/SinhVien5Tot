using MediatR;
using System.Text.Json;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Student.Abstractions;
using SV5T.Application.Student.Dtos;
using SV5T.Application.Student.Support;
using SV5T.Domain.Submissions;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Student.Evidences.Commands.SubmitEvidence;

public sealed class SubmitEvidenceHandler(
    IStudentEvidenceRepository evidences,
    IStudentApplicationRepository applications,
    IUnitOfWork uow,
    ICurrentUser currentUser) : IRequestHandler<SubmitEvidenceCommand, StudentEvidenceItemResponse>
{
    public async Task<StudentEvidenceItemResponse> Handle(SubmitEvidenceCommand command, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized, "Phiên đăng nhập không hợp lệ.", "invalid_session");
        var evidence = await evidences.GetByIdForUserAsync(command.EvidenceId, userId, tracking: true, cancellationToken: ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Không tìm thấy minh chứng.", "evidence_not_found");
        var app = evidence.Application;
        StudentEvidenceGuard.EnsureCampaignAcceptingEvidence(app.Campaign);
        if (app.Status is SubmissionStatus.Approved or SubmissionStatus.Rejected or SubmissionStatus.Withdrawn)
            throw new UseCaseException(ApplicationErrorKind.Conflict, "Minh chứng không còn được nhận xét duyệt.", "evidence_submission_closed");
        if (evidence.Status != EvidenceStatus.Draft)
            throw new UseCaseException(ApplicationErrorKind.Conflict, "Minh chứng không ở trạng thái nháp.", "evidence_not_submittable");
        byte[] version;
        try { version = Convert.FromBase64String(command.RowVersion); }
        catch (FormatException) { throw new UseCaseException(ApplicationErrorKind.Validation, "RowVersion không hợp lệ.", "invalid_row_version"); }
        if (!version.SequenceEqual(evidence.RowVersion))
            throw new UseCaseException(ApplicationErrorKind.Conflict, "Minh chứng đã thay đổi. Vui lòng tải lại.", "concurrency_conflict");
        if (!HasContent(evidence.DataJson, evidence.AttachmentsJson))
            throw new UseCaseException(ApplicationErrorKind.Validation, "Minh chứng chưa có nội dung hoặc tệp đính kèm.", "evidence_empty");

        var now = DateTime.UtcNow;
        evidence.Status = EvidenceStatus.Submitted;
        evidence.UpdatedAt = now;
        evidence.UpdatedBy = userId.ToString();
        await uow.ExecuteInTransactionAsync(async token =>
        {
            await applications.AddReviewLogAsync(new ReviewLog
            {
                ApplicationId = app.Id,
                EvidenceId = evidence.Id,
                ActorId = userId,
                Action = ReviewAction.EvidenceSubmitted,
                MetadataJson = "{\"source\":\"student-evidence\"}",
                CreatedAt = now
            }, token);
            await uow.SaveChangesAsync(token);
        }, ct);
        return new StudentEvidenceItemResponse(evidence.Id, evidence.CriterionId,
            evidence.Criterion?.Code ?? "", evidence.Criterion?.Title ?? "",
            evidence.Criterion?.Standard?.GroupCode.ToString() ?? "", evidence.Status,
            evidence.DataJson, evidence.AttachmentsJson, evidence.ReviewerNote, evidence.ReviewedAt,
            Convert.ToBase64String(evidence.RowVersion), evidence.CreatedAt, evidence.UpdatedAt ?? evidence.CreatedAt);
    }

    private static bool HasContent(string dataJson, string attachmentsJson)
    {
        try
        {
            using var data = JsonDocument.Parse(dataJson);
            using var attachments = JsonDocument.Parse(attachmentsJson);
            var hasData = data.RootElement.ValueKind switch
            {
                JsonValueKind.Object => data.RootElement.EnumerateObject().Any(),
                JsonValueKind.Array => data.RootElement.GetArrayLength() > 0,
                JsonValueKind.Null => false,
                _ => true
            };
            var hasFiles = attachments.RootElement.ValueKind == JsonValueKind.Array &&
                attachments.RootElement.GetArrayLength() > 0;
            return hasData || hasFiles;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}

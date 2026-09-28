using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Student.Abstractions;
using SV5T.Application.Student.Dtos;
using SV5T.Application.Student.Support;
using SV5T.Domain.Submissions;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Student.Evidences.Commands.ReopenEvidence;

public sealed record ReopenEvidenceCommand(Guid EvidenceId, string RowVersion) : IRequest<StudentEvidenceItemResponse>;

public sealed class ReopenEvidenceHandler(
    IStudentEvidenceRepository evidences,
    IStudentApplicationRepository applications,
    IUnitOfWork uow,
    ICurrentUser currentUser) : IRequestHandler<ReopenEvidenceCommand, StudentEvidenceItemResponse>
{
    public async Task<StudentEvidenceItemResponse> Handle(ReopenEvidenceCommand command, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized, "Phiên đăng nhập không hợp lệ.", "invalid_session");
        var evidence = await evidences.GetByIdForUserAsync(command.EvidenceId, userId, tracking: true, cancellationToken: ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Không tìm thấy minh chứng.", "evidence_not_found");

        StudentEvidenceGuard.EnsureCampaignAcceptingEvidence(evidence.Application.Campaign);
        StudentApplicationGuard.EnsureApplicationEditable(evidence.Application);
        if (evidence.Status != EvidenceStatus.Submitted)
            throw new UseCaseException(ApplicationErrorKind.Conflict,
                "Chỉ có thể mở sửa minh chứng đang chờ xét duyệt.", "evidence_not_reopenable");

        byte[] version;
        try { version = Convert.FromBase64String(command.RowVersion); }
        catch (FormatException) { throw new UseCaseException(ApplicationErrorKind.Validation,
            "Phiên bản dữ liệu không hợp lệ.", "invalid_row_version"); }
        if (!version.SequenceEqual(evidence.RowVersion))
            throw new UseCaseException(ApplicationErrorKind.Conflict,
                "Minh chứng đã thay đổi. Vui lòng tải lại.", "concurrency_conflict");

        var now = DateTime.UtcNow;
        evidence.Status = EvidenceStatus.Draft;
        evidence.UpdatedAt = now;
        evidence.UpdatedBy = userId.ToString();
        await uow.ExecuteInTransactionAsync(async token =>
        {
            await applications.AddReviewLogAsync(new ReviewLog
            {
                ApplicationId = evidence.ApplicationId,
                EvidenceId = evidence.Id,
                ActorId = userId,
                Action = ReviewAction.EvidenceReopened,
                CreatedAt = now
            }, token);
            await uow.SaveChangesAsync(token);
        }, ct);

        return new StudentEvidenceItemResponse(evidence.Id, evidence.CriterionId,
            evidence.Criterion?.Code ?? string.Empty, evidence.Criterion?.Title ?? string.Empty,
            evidence.Criterion?.Standard?.GroupCode.ToString() ?? string.Empty,
            evidence.Status, evidence.DataJson, evidence.AttachmentsJson, evidence.ReviewerNote,
            evidence.ReviewedAt, Convert.ToBase64String(evidence.RowVersion),
            evidence.CreatedAt, evidence.UpdatedAt ?? evidence.CreatedAt);
    }
}

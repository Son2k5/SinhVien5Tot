using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Evidences.Common;
using SV5T.Application.Admin.Support;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Evidences.Abstractions;
using SV5T.Application.Notifications;
using SV5T.Domain.Evidences;
using SV5T.Domain.Notifications;
using SV5T.Domain.Submissions;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Admin.Evidences.Commands.ReviewEvidence;

public sealed class ReviewEvidenceHandler(
    IEvidenceRepository evidenceRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    INotificationQueue? notificationQueue = null
) : IRequestHandler<ReviewEvidenceCommand, EvidenceResponse>
{
    public async Task<EvidenceResponse> Handle(
        ReviewEvidenceCommand command,
        CancellationToken cancellationToken)
    {
        var reviewerId = currentUser.UserId
            ?? throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Không xác định được danh tính người chấm điểm.");

        var evidence = await evidenceRepository.GetByIdAsync(
            command.EvidenceId,
            tracking: true,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy minh chứng.",
                "evidence_not_found");

        // 1. Kiểm tra trạng thái và thời hạn chiến dịch
        if (evidence.Application?.Campaign is not null)
        {
            EvidenceStateGuard.EnsureCampaignReviewable(evidence.Application.Campaign);
        }

        // 2. Kiểm tra trạng thái hồ sơ cha
        if (evidence.Application is not null)
        {
            EvidenceStateGuard.EnsureApplicationReviewable(evidence.Application.Status);
        }

        // 3. Kiểm tra chuyển dịch trạng thái hợp lệ của Minh chứng
        EvidenceStateGuard.EnsureCanTransition(evidence.Status, command.Request.Decision);

        // 4. Kiểm tra Optimistic Concurrency Token (RowVersion)
        byte[] clientRowVersion;
        try
        {
            clientRowVersion = Convert.FromBase64String(command.Request.RowVersion);
        }
        catch (FormatException)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "RowVersion không đúng định dạng Base64.",
                "invalid_row_version");
        }

        if (evidence.RowVersion.Length > 0 && !evidence.RowVersion.SequenceEqual(clientRowVersion))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Minh chứng đã được cập nhật bởi một người chấm khác trong lúc bạn thao tác. Vui lòng tải lại trang và thử lại.",
                "concurrency_conflict");
        }

        var now = DateTime.UtcNow;
        var isRevert = command.Request.Decision == EvidenceStatus.Submitted;
        evidence.Status = command.Request.Decision;
        evidence.ReviewerNote = isRevert ? null : command.Request.Note?.Trim();
        evidence.ReviewedBy = isRevert ? null : reviewerId;
        evidence.ReviewedAt = isRevert ? null : now;
        evidence.UpdatedAt = now;
        evidence.UpdatedBy = reviewerId.ToString();

        // 5. Tự động đồng bộ: Chuyển Application sang UnderReview nếu đang là Submitted hoặc Resubmitted
        if (evidence.Application is not null &&
            evidence.Application.Status is SubmissionStatus.Submitted or SubmissionStatus.Resubmitted)
        {
            evidence.Application.Status = SubmissionStatus.UnderReview;
            evidence.Application.AssignedReviewerId ??= reviewerId;
            evidence.Application.UpdatedAt = now;
            evidence.Application.UpdatedBy = reviewerId.ToString();
        }

        // 6. Ghi nhật ký xét duyệt ReviewLog
        var action = command.Request.Decision switch
        {
            EvidenceStatus.Approved => ReviewAction.EvidenceApproved,
            EvidenceStatus.Rejected => ReviewAction.EvidenceRejected,
            EvidenceStatus.NeedsRevision => ReviewAction.EvidenceRevisionRequested,
            _ => ReviewAction.ReviewStarted
        };

        await evidenceRepository.AddReviewLogAsync(new ReviewLog
        {
            ApplicationId = evidence.ApplicationId,
            EvidenceId = evidence.Id,
            ActorId = reviewerId,
            Action = action,
            Note = evidence.ReviewerNote,
            MetadataJson = """{"source":"admin-evidence-review"}""",
            CreatedAt = now
        }, cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);
        if (command.Request.Decision != EvidenceStatus.Approved &&
            evidence.Application?.ApplicantUserId is Guid applicantId)
        {
            var content = NotificationContentBuilder.Build(
                NotificationType.EvidenceReviewed,
                new NotificationContentData(
                    ApplicationCode: evidence.Application.ApplicationCode,
                    Decision: command.Request.Decision switch
                    {
                        EvidenceStatus.Rejected => "đã bị từ chối",
                        EvidenceStatus.NeedsRevision => "cần được bổ sung",
                        _ => "đã được cập nhật"
                    },
                    ReviewerNote: evidence.ReviewerNote));
            notificationQueue?.TryEnqueue(new NotificationJob(
                NotificationType.EvidenceReviewed,
                NotificationTargetType.Evidence,
                evidence.Id,
                evidence.ApplicationId,
                NotificationAudience.SingleUser,
                applicantId,
                content.Title,
                content.Body,
                $"EvidenceReviewed:{evidence.Id}:{now:O}"));
        }
        return EvidenceReviewMappings.MapToResponse(evidence);
    }
}

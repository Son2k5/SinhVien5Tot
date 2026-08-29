using FluentValidation;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Support;
using SV5T.Application.Common;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Evidences.Abstractions;
using SV5T.Domain.Evidences;
using SV5T.Domain.Submissions;
using SV5T.Domain.Submissions.Enums;
using SubmissionApplication = SV5T.Domain.Submissions.Application;

namespace SV5T.Application.Admin.Services;

public interface IAdminEvidenceReviewService
{
    Task<PagedResponse<EvidenceResponse>> GetPagedAsync(
        Guid? campaignId,
        EvidenceStatus? status,
        Guid? applicationId,
        int pageIndex,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<EvidenceResponse?> GetByIdAsync(
        Guid evidenceId,
        CancellationToken cancellationToken = default);

    Task<EvidenceResponse> ReviewAsync(
        Guid evidenceId,
        ReviewEvidenceRequest request,
        CancellationToken cancellationToken = default);
}

public sealed class AdminEvidenceReviewService(
    IEvidenceRepository evidenceRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    IValidator<ReviewEvidenceRequest> reviewValidator)
    : IAdminEvidenceReviewService
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    public async Task<PagedResponse<EvidenceResponse>> GetPagedAsync(
        Guid? campaignId,
        EvidenceStatus? status,
        Guid? applicationId,
        int pageIndex,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        pageIndex = pageIndex < 1 ? 1 : pageIndex;
        pageSize = pageSize is < 1 or > MaxPageSize ? DefaultPageSize : pageSize;

        var paged = await evidenceRepository.GetPagedAsync(
            campaignId, status, applicationId, pageIndex, pageSize, cancellationToken);

        return new PagedResponse<EvidenceResponse>(
            paged.Items.Select(MapToResponse).ToList(),
            paged.TotalCount,
            paged.PageIndex,
            paged.PageSize,
            paged.TotalPages);
    }

    public async Task<EvidenceResponse?> GetByIdAsync(
        Guid evidenceId,
        CancellationToken cancellationToken = default)
    {
        var evidence = await evidenceRepository.GetByIdAsync(evidenceId, cancellationToken: cancellationToken);
        return evidence is null ? null : MapToResponse(evidence);
    }

    public async Task<EvidenceResponse> ReviewAsync(
        Guid evidenceId,
        ReviewEvidenceRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidationExecutor.ValidateAsync(reviewValidator, request, cancellationToken);

        var reviewerId = currentUser.UserId
            ?? throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Không xác định được danh tính người chấm điểm.");

        var evidence = await evidenceRepository.GetByIdAsync(
            evidenceId,
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
        EvidenceStateGuard.EnsureCanTransition(evidence.Status, request.Decision);

        // 4. Kiểm tra Optimistic Concurrency Token (RowVersion)
        byte[] clientRowVersion;
        try
        {
            clientRowVersion = Convert.FromBase64String(request.RowVersion);
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
        evidence.Status = request.Decision;
        evidence.ReviewerNote = request.Note?.Trim();
        evidence.ReviewedBy = reviewerId;
        evidence.ReviewedAt = now;
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
        var action = request.Decision switch
        {
            EvidenceStatus.Approved => ReviewAction.EvidenceApproved,
            EvidenceStatus.Rejected => ReviewAction.EvidenceRejected,
            _ => ReviewAction.EvidenceRevisionRequested
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
        return MapToResponse(evidence);
    }

    public static EvidenceResponse MapToResponse(Evidence evidence) =>
        new(
            evidence.Id,
            evidence.ApplicationId,
            evidence.Application?.ApplicationCode ?? string.Empty,
            evidence.CriterionId,
            evidence.Criterion?.Code ?? string.Empty,
            evidence.Criterion?.Title ?? string.Empty,
            evidence.Application?.CampaignId ?? Guid.Empty,
            evidence.Application?.Campaign?.Name ?? string.Empty,
            evidence.EvidenceTypeTemplateId,
            evidence.EvidenceTypeTemplate?.Name ?? string.Empty,
            evidence.DataJson,
            evidence.AttachmentsJson,
            evidence.NumericValue,
            evidence.Status,
            evidence.ReviewerNote,
            evidence.ReviewedBy,
            evidence.ReviewedAt,
            Convert.ToBase64String(evidence.RowVersion),
            evidence.CreatedAt);
}

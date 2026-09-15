using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Campaigns.Enums;
using SV5T.Domain.Evidences;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Admin.Support;

public static class EvidenceStateGuard
{
    private static readonly Dictionary<EvidenceStatus, HashSet<EvidenceStatus>> AllowedTransitions = new()
    {
        [EvidenceStatus.Draft] = [EvidenceStatus.Submitted],
        [EvidenceStatus.Submitted] = [EvidenceStatus.Approved, EvidenceStatus.Rejected, EvidenceStatus.NeedsRevision],
        [EvidenceStatus.NeedsRevision] = [EvidenceStatus.Submitted],
        [EvidenceStatus.Approved] = [EvidenceStatus.NeedsRevision, EvidenceStatus.Rejected],
        [EvidenceStatus.Rejected] = [EvidenceStatus.NeedsRevision, EvidenceStatus.Approved]
    };

    public static void EnsureCanTransition(EvidenceStatus current, EvidenceStatus target)
    {
        if (!AllowedTransitions.TryGetValue(current, out var nextStates) || !nextStates.Contains(target))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể chuyển trạng thái minh chứng. Vui lòng tải lại và thử lại.",
                "invalid_state_transition");
        }
    }

    public static void EnsureApplicationReviewable(SubmissionStatus status)
    {
        if (status is SubmissionStatus.Draft or SubmissionStatus.Approved or SubmissionStatus.Rejected or SubmissionStatus.Withdrawn)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể xét duyệt minh chứng khi hồ sơ đang ở trạng thái nháp, đã đóng hoặc đã có kết quả xét duyệt cuối cùng.",
                "application_not_reviewable");
        }
    }

    public static void EnsureCampaignReviewable(Campaign campaign)
    {
        if (campaign.Status is CampaignStatus.Draft or CampaignStatus.Closed or CampaignStatus.Archived)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Đợt xét hiện không mở xét duyệt minh chứng.",
                "campaign_not_reviewable");
        }

        if (DateTime.UtcNow > campaign.ReviewDeadline)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Đã quá hạn xét duyệt minh chứng của đợt xét này.",
                "campaign_review_deadline_passed");
        }
    }
}

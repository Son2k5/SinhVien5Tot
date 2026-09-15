using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Campaigns.Enums;
using SV5T.Domain.Submissions.Enums;
using SubmissionApplication = SV5T.Domain.Submissions.Application;

namespace SV5T.Application.Student.Support;

public static class StudentApplicationGuard
{
    public static void EnsureCampaignOpenForRegistration(Campaign campaign)
    {
        if (!campaign.IsRegistrationOpen())
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Đợt xét không mở đăng ký tại thời điểm hiện tại.",
                "campaign_not_open");
        }
    }

    public static void EnsureNoDuplicateApplication(SubmissionApplication? existing)
    {
        if (existing is not null)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Bạn đã đăng ký hồ sơ cho đợt xét này.",
                "application_duplicate");
        }
    }

    public static void EnsureApplicationOwnedByUser(SubmissionApplication application, Guid userId)
    {
        if (application.ApplicantUserId != userId)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Forbidden,
                "Bạn không có quyền truy cập hồ sơ này.",
                "application_access_denied");
        }
    }

    public static void EnsureApplicationEditable(SubmissionApplication application)
    {
        if (application.Status is not (SubmissionStatus.Draft or SubmissionStatus.NeedsRevision))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Hồ sơ không ở trạng thái cho phép chỉnh sửa.",
                "application_not_editable");
        }
    }

    public static void EnsureApplicationSubmittable(SubmissionApplication application)
    {
        if (application.Status is not (SubmissionStatus.Draft or SubmissionStatus.NeedsRevision))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Hồ sơ không ở trạng thái cho phép nộp.",
                "application_not_submittable");
        }
    }

    public static void EnsureApplicationWithdrawable(SubmissionApplication application)
    {
        if (application.Status
            is SubmissionStatus.Approved
            or SubmissionStatus.Rejected
            or SubmissionStatus.Withdrawn)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Hồ sơ đã có kết quả cuối cùng, không thể rút.",
                "application_not_withdrawable");
        }
    }

    public static void EnsureSubmitBeforeDeadline(Campaign campaign)
    {
        if (DateTime.UtcNow > campaign.SubmitDeadline)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Đã quá hạn nộp hồ sơ của đợt xét này.",
                "campaign_submit_deadline_passed");
        }
    }

    public static void EnsureCampaignNotArchived(Campaign campaign)
    {
        if (campaign.Status is CampaignStatus.Archived or CampaignStatus.Closed)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Đợt xét đã đóng, không thể thao tác.",
                "campaign_closed");
        }
    }
}

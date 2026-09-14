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
                "Dot xet khong mo dang ky tai thoi diem hien tai.",
                "campaign_not_open");
        }
    }

    public static void EnsureNoDuplicateApplication(SubmissionApplication? existing)
    {
        if (existing is not null)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Ban da dang ky ho so cho dot xet nay.",
                "application_duplicate");
        }
    }

    public static void EnsureApplicationOwnedByUser(SubmissionApplication application, Guid userId)
    {
        if (application.ApplicantUserId != userId)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Forbidden,
                "Ban khong co quyen truy cap ho so nay.",
                "application_access_denied");
        }
    }

    public static void EnsureApplicationEditable(SubmissionApplication application)
    {
        if (application.Status is not (SubmissionStatus.Draft or SubmissionStatus.NeedsRevision))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Ho so khong o trang thai cho phep chinh sua.",
                "application_not_editable");
        }
    }

    public static void EnsureApplicationSubmittable(SubmissionApplication application)
    {
        if (application.Status is not (SubmissionStatus.Draft or SubmissionStatus.NeedsRevision))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Ho so khong o trang thai cho phep nop.",
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
                "Ho so da co ket qua cuoi cung, khong the rut.",
                "application_not_withdrawable");
        }
    }

    public static void EnsureSubmitBeforeDeadline(Campaign campaign)
    {
        if (DateTime.UtcNow > campaign.SubmitDeadline)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Da qua han nop ho so cua dot xet nay.",
                "campaign_submit_deadline_passed");
        }
    }

    public static void EnsureCampaignNotArchived(Campaign campaign)
    {
        if (campaign.Status is CampaignStatus.Archived or CampaignStatus.Closed)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Dot xet da dong, khong the thao tac.",
                "campaign_closed");
        }
    }
}

using FluentValidation;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Student.Abstractions;
using SV5T.Application.Notifications;
using SV5T.Domain.Campaigns.Enums;
using SV5T.Domain.Notifications;
using SV5T.Domain.Submissions;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Admin.Applications;

public sealed record DecideApplicationCommand(Guid Id, ReviewApplicationDecisionRequest Request)
    : IRequest<ReviewApplicationResponse>;

public sealed class DecideApplicationCommandValidator : AbstractValidator<DecideApplicationCommand>
{
    public DecideApplicationCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Request.Decision)
            .Must(x => x is SubmissionStatus.Approved or SubmissionStatus.Rejected or SubmissionStatus.NeedsRevision);
        RuleFor(x => x.Request.Note).NotEmpty()
            .When(x => x.Request.Decision is SubmissionStatus.Rejected or SubmissionStatus.NeedsRevision);
        RuleFor(x => x.Request.RowVersion).NotEmpty();
    }
}

public sealed class DecideApplicationHandler(IReviewApplicationRepository applications,
    IStudentCriterionRepository criteria, IUnitOfWork uow, ICurrentUser currentUser,
    INotificationQueue? notificationQueue = null)
    : IRequestHandler<DecideApplicationCommand, ReviewApplicationResponse>
{
    public async Task<ReviewApplicationResponse> Handle(DecideApplicationCommand command, CancellationToken ct)
    {
        var actor = currentUser.UserId ?? throw new UseCaseException(ApplicationErrorKind.Unauthorized,
            "Phiên đăng nhập không hợp lệ.", "invalid_session");
        var app = await applications.GetByIdAsync(command.Id, true, ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Không tìm thấy hồ sơ.", "application_not_found");
        if (app.SubmittedAt is null || app.Status is not (SubmissionStatus.Submitted or
            SubmissionStatus.UnderReview or SubmissionStatus.Resubmitted))
            throw new UseCaseException(ApplicationErrorKind.Conflict, "Hồ sơ chưa sẵn sàng đánh giá tổng kết.",
                "application_not_reviewable");
        if (app.Campaign.Status is not (CampaignStatus.Open or CampaignStatus.Reviewing) ||
            DateTime.UtcNow > app.Campaign.ReviewDeadline)
            throw new UseCaseException(ApplicationErrorKind.Conflict, "Đợt xét đã đóng đánh giá.",
                "campaign_not_reviewable");
        byte[] version;
        try { version = Convert.FromBase64String(command.Request.RowVersion); }
        catch (FormatException) { throw new UseCaseException(ApplicationErrorKind.Validation,
            "RowVersion không hợp lệ.", "invalid_row_version"); }
        if (!version.SequenceEqual(app.RowVersion))
            throw new UseCaseException(ApplicationErrorKind.Conflict, "Hồ sơ đã thay đổi. Vui lòng tải lại.",
                "concurrency_conflict");
        var progress = await ApplicationReviewSupport.ProgressAsync(app, criteria, ct);
        if (command.Request.Decision == SubmissionStatus.Approved &&
            progress.Count(p => p.Complete) != 5)
            throw new UseCaseException(ApplicationErrorKind.Validation,
                "Hồ sơ chưa đạt đủ 5 tiêu chuẩn.", "application_standards_incomplete");

        var now = DateTime.UtcNow;
        var note = command.Request.Note?.Trim();
        await uow.ExecuteInTransactionAsync(async token =>
        {
            app.Status = command.Request.Decision;
            app.AssignedReviewerId ??= actor;
            app.AssignedAt ??= now;
            app.ReviewerGeneralNote = note;
            app.RejectionReason = command.Request.Decision == SubmissionStatus.Rejected ? note : null;
            app.UpdatedAt = now;
            app.UpdatedBy = actor.ToString();
            await applications.AddReviewLogAsync(new ReviewLog
            {
                ApplicationId = app.Id,
                ActorId = actor,
                Action = command.Request.Decision switch
                {
                    SubmissionStatus.Approved => ReviewAction.ApplicationApproved,
                    SubmissionStatus.Rejected => ReviewAction.ApplicationRejected,
                    _ => ReviewAction.ApplicationRevisionRequested
                },
                Note = note,
                MetadataJson = "{\"source\":\"campaign-application-review\"}",
                CreatedAt = now
            }, token);
            await uow.SaveChangesAsync(token);
        }, ct);
        if (app.ApplicantUserId is Guid applicantId)
        {
            var content = NotificationContentBuilder.Build(
                NotificationType.ApplicationDecided,
                new NotificationContentData(
                    ApplicationCode: app.ApplicationCode,
                    Decision: command.Request.Decision switch
                    {
                        SubmissionStatus.Approved => "đã được phê duyệt",
                        SubmissionStatus.Rejected => "đã bị từ chối",
                        _ => "cần được chỉnh sửa"
                    },
                    ReviewerNote: note));
            notificationQueue?.TryEnqueue(new NotificationJob(
                NotificationType.ApplicationDecided,
                NotificationTargetType.Application,
                app.Id,
                app.Id,
                NotificationAudience.SingleUser,
                applicantId,
                content.Title,
                content.Body,
                $"ApplicationDecided:{app.Id}:{command.Request.Decision}:{now:O}"));
        }
        return ApplicationReviewSupport.Map(app, progress);
    }
}

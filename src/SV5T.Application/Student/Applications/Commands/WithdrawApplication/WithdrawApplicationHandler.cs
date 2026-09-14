using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Student.Abstractions;
using SV5T.Application.Student.Dtos;
using SV5T.Application.Student.Support;
using SV5T.Domain.Submissions;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Student.Applications.Commands.WithdrawApplication;

public sealed class WithdrawApplicationHandler(
    IStudentApplicationRepository applications,
    IStudentEvidenceRepository evidences,
    IUnitOfWork uow,
    ICurrentUser currentUser)
    : IRequestHandler<WithdrawApplicationCommand, StudentApplicationDetailResponse>
{
    public async Task<StudentApplicationDetailResponse> Handle(
        WithdrawApplicationCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId
            ?? throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phien dang nhap khong hop le.",
                "invalid_session");

        var app = await applications.GetByIdForUserAsync(
                request.ApplicationId, userId, tracking: true, cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Khong tim thay ho so.",
                "application_not_found");

        EnsureRowVersionMatch(app.RowVersion, request.RowVersion);
        StudentApplicationGuard.EnsureApplicationWithdrawable(app);

        var now = DateTime.UtcNow;
        var reason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim();

        await uow.ExecuteInTransactionAsync(async ct =>
        {
            app.Status = SubmissionStatus.Withdrawn;
            app.UpdatedAt = now;
            app.UpdatedBy = userId.ToString();

            await applications.AddReviewLogAsync(new ReviewLog
            {
                ApplicationId = app.Id,
                ActorId = userId,
                Action = ReviewAction.ApplicationWithdrawn,
                Note = reason,
                MetadataJson = """{"source":"student-application"}""",
                CreatedAt = now
            }, ct);

            await uow.SaveChangesAsync(ct);
        }, cancellationToken);

        var evidenceList = await evidences.GetByApplicationAsync(app.Id, cancellationToken);

        return new StudentApplicationDetailResponse(
            app.Id,
            app.ApplicationCode,
            app.CampaignId,
            app.Campaign?.Name ?? string.Empty,
            app.Campaign?.SchoolYear ?? string.Empty,
            app.Campaign?.SubmitDeadline ?? DateTime.MaxValue,
            app.Status,
            app.ApplicantSnapshotJson,
            app.CreatedAt,
            app.SubmittedAt,
            app.UpdatedAt,
            Convert.ToBase64String(app.RowVersion),
            evidenceList.Select(e => new StudentEvidenceItemResponse(
                e.Id,
                e.CriterionId,
                e.Criterion?.Code ?? string.Empty,
                e.Criterion?.Title ?? string.Empty,
                e.Criterion?.Standard?.GroupCode.ToString() ?? string.Empty,
                e.Status,
                e.DataJson,
                e.AttachmentsJson,
                e.ReviewerNote,
                e.ReviewedAt,
                Convert.ToBase64String(e.RowVersion),
                e.CreatedAt,
                e.UpdatedAt ?? e.CreatedAt)).ToList());
    }

    private static void EnsureRowVersionMatch(byte[] current, string clientBase64)
    {
        byte[] client;
        try
        {
            client = Convert.FromBase64String(clientBase64);
        }
        catch
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "RowVersion sai dinh dang.",
                "validation_error");
        }

        if (!client.SequenceEqual(current))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Du lieu da doi. Tai lai va thu lai.",
                "concurrency_conflict");
        }
    }
}

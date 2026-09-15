using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Student.Abstractions;
using SV5T.Application.Student.Dtos;
using SV5T.Application.Student.Support;
using SV5T.Domain.Submissions;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Student.Applications.Commands.SubmitApplication;

public sealed class SubmitApplicationHandler(
    IStudentApplicationRepository applications,
    IStudentEvidenceRepository evidences,
    IStudentCriterionRepository criteria,
    IUnitOfWork uow,
    ICurrentUser currentUser)
    : IRequestHandler<SubmitApplicationCommand, StudentApplicationDetailResponse>
{
    public async Task<StudentApplicationDetailResponse> Handle(
        SubmitApplicationCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId
            ?? throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phiên đăng nhập không hợp lệ.",
                "invalid_session");

        var app = await applications.GetByIdForUserAsync(
                request.ApplicationId, userId, tracking: true, cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy hồ sơ.",
                "application_not_found");

        EnsureRowVersionMatch(app.RowVersion, request.RowVersion);
        StudentApplicationGuard.EnsureApplicationSubmittable(app);

        if (app.Campaign is null)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Hồ sơ thiếu thông tin đợt xét.",
                "campaign_not_found");
        }

        StudentApplicationGuard.EnsureSubmitBeforeDeadline(app.Campaign);

        var requirements = await criteria.GetRequirementsByStandardSetIdAsync(
            app.StandardSetId, cancellationToken);
        var allCriteriaById = requirements.ToDictionary(r => r.Id);

        var requiredIds = requirements
            .Where(c => c.Type == Domain.Standards.Enums.CriterionType.Requirement &&
                        CriterionRequirementHelper.IsRequired(c, allCriteriaById))
            .Select(c => c.Id)
            .ToHashSet();

        var evidenceList = await evidences.GetByApplicationAsync(app.Id, cancellationToken);
        var submittedIds = evidenceList
            .Where(e => e.Status is EvidenceStatus.Draft or EvidenceStatus.Submitted or EvidenceStatus.Approved)
            .Select(e => e.CriterionId)
            .ToHashSet();

        var missing = requiredIds.Except(submittedIds).ToList();
        if (missing.Count > 0)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                $"Hồ sơ thiếu {missing.Count} minh chứng bắt buộc.",
                "application_missing_evidences");
        }

        var now = DateTime.UtcNow;
        var isResubmit = app.Status == SubmissionStatus.NeedsRevision;

        await uow.ExecuteInTransactionAsync(async ct =>
        {
            app.Status = SubmissionStatus.Submitted;
            app.SubmittedAt = now;
            app.UpdatedAt = now;
            app.UpdatedBy = userId.ToString();

            foreach (var e in evidenceList.Where(e => e.Status == EvidenceStatus.Draft))
            {
                e.Status = EvidenceStatus.Submitted;
                e.UpdatedAt = now;
                e.UpdatedBy = userId.ToString();
            }

            await applications.AddReviewLogAsync(new ReviewLog
            {
                ApplicationId = app.Id,
                ActorId = userId,
                Action = isResubmit ? ReviewAction.ApplicationResubmitted : ReviewAction.ApplicationSubmitted,
                MetadataJson = """{"source":"student-application"}""",
                CreatedAt = now
            }, ct);

            await uow.SaveChangesAsync(ct);
        }, cancellationToken);

        return new StudentApplicationDetailResponse(
            app.Id,
            app.ApplicationCode,
            app.CampaignId,
            app.Campaign.Name,
            app.Campaign.SchoolYear,
            app.Campaign.SubmitDeadline,
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
                "Phiên bản dữ liệu không hợp lệ. Vui lòng tải lại và thử lại.",
                "validation_error");
        }

        if (!client.SequenceEqual(current))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Dữ liệu đã thay đổi. Vui lòng tải lại và thử lại.",
                "concurrency_conflict");
        }
    }
}

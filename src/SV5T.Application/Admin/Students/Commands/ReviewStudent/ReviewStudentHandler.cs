using FluentValidation;
using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Students.Abstractions;
using SV5T.Application.Admin.Support;
using SV5T.Application.Auth.Support;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Admin;
using SV5T.Domain.Standards.Enums;
using SV5T.Domain.Submissions;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Admin.Students.Commands.ReviewStudent;

public sealed class ReviewStudentHandler(
    IAdminStudentRepository repository,
    IAdminAuditLogRepository audit,
    IUnitOfWork uow,
    ICurrentUser user,
    IValidator<ReviewStudentEvidenceRequest> validator
) : IRequestHandler<ReviewStudentCommand, AdminStudentEvidenceItemResponse>
{
    public async Task<AdminStudentEvidenceItemResponse> Handle(ReviewStudentCommand r, CancellationToken ct)
    {
        await AuthServiceSupport.ValidateAsync(validator, r.Request, ct);

        var actor =
            user.UserId
            ?? throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Khong xac dinh admin.",
                "invalid_session"
            );

        var student = await repository.GetByIdAsync(r.Id, false, false, ct);

        if (student is null || student.Role != SV5T.Domain.Users.Enums.Role.User || student.IsDeleted)
        {
            throw new UseCaseException(ApplicationErrorKind.NotFound, "Khong tim thay sinh vien.", "student_not_found");
        }

        var e =
            await repository.GetEvidenceForStudentAsync(student.Id, r.Request.EvidenceId, true, ct)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Khong tim thay minh chung.",
                "evidence_not_found"
            );
        byte[] client;
        try
        {
            client = Convert.FromBase64String(r.Request.RowVersion);
        }
        catch
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "RowVersion sai dinh dang.",
                "validation_error"
            );
        }

        if (!client.SequenceEqual(e.RowVersion))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Du lieu da doi. Tai lai va thu lai.",
                "concurrency_conflict"
            );
        }
        EvidenceStateGuard.EnsureCanTransition(e.Status, r.Request.Decision);
        if (e.Application is not null)
        {
            EvidenceStateGuard.EnsureApplicationReviewable(e.Application.Status);
            if (e.Application.Campaign is not null)
                EvidenceStateGuard.EnsureCampaignReviewable(e.Application.Campaign);
        }
        var now = DateTime.UtcNow;
        var note = string.IsNullOrWhiteSpace(r.Request.Note) ? null : r.Request.Note.Trim();
        var act = r.Request.Decision switch
        {
            EvidenceStatus.Approved => ReviewAction.EvidenceApproved,
            EvidenceStatus.Rejected => ReviewAction.EvidenceRejected,
            _ => ReviewAction.EvidenceRevisionRequested,
        };
        await uow.ExecuteInTransactionAsync(
            async c =>
            {
                e.Status = r.Request.Decision;
                e.ReviewerNote = note;
                e.ReviewedBy = actor;
                e.ReviewedAt = now;
                e.UpdatedAt = now;
                e.UpdatedBy = actor.ToString();
                if (
                    e.Application is not null
                    && e.Application.Status is SubmissionStatus.Submitted or SubmissionStatus.Resubmitted
                )
                {
                    e.Application.Status = SubmissionStatus.UnderReview;
                    e.Application.UpdatedAt = now;
                    e.Application.UpdatedBy = actor.ToString();
                }
                await repository.AddReviewLogAsync(
                    new ReviewLog
                    {
                        ApplicationId = e.ApplicationId,
                        EvidenceId = e.Id,
                        ActorId = actor,
                        Action = act,
                        Note = note,
                        MetadataJson = """{"source":"admin-students"}""",
                        CreatedAt = now,
                    },
                    c
                );
                await audit.AddAsync(
                    new AdminAuditLog
                    {
                        Action = "StudentEvidenceReviewed",
                        TargetUserId = student.Id,
                        ActorId = actor,
                        Reason = note,
                        MetadataJson = """{"source":"admin-students"}""",
                        CreatedAt = now,
                    },
                    c
                );
                await uow.SaveChangesAsync(c);
            },
            ct
        );
        return new AdminStudentEvidenceItemResponse(
            e.Id,
            e.ApplicationId,
            e.Application?.ApplicationCode ?? "",
            e.CriterionId,
            e.Criterion?.Code ?? "",
            e.Criterion?.Title ?? "",
            e.Criterion?.Standard?.GroupCode,
            G(e.Criterion?.Standard?.GroupCode),
            e.Application?.CampaignId ?? Guid.Empty,
            e.Application?.Campaign?.Name ?? "",
            e.Status,
            e.ReviewerNote,
            e.ReviewedBy,
            e.ReviewedAt,
            Convert.ToBase64String(e.RowVersion),
            e.CreatedAt
        );
    }

    static string G(StandardGroupCode? c) =>
        c switch
        {
            StandardGroupCode.Ethics => "Dao duc tot",
            StandardGroupCode.Study => "Hoc tap tot",
            StandardGroupCode.Fitness => "The luc tot",
            StandardGroupCode.Volunteer => "Tinh nguyen tot",
            StandardGroupCode.Integration => "Hoi nhap tot",
            _ => "Chua phan nhom",
        };
}

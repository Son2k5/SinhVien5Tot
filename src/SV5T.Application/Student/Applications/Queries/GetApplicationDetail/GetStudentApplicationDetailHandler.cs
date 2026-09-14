using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Student.Abstractions;
using SV5T.Application.Student.Dtos;

namespace SV5T.Application.Student.Applications.Queries.GetApplicationDetail;

public sealed class GetStudentApplicationDetailHandler(
    IStudentApplicationRepository repository,
    IStudentEvidenceRepository evidences,
    ICurrentUser currentUser)
    : IRequestHandler<GetStudentApplicationDetailQuery, StudentApplicationDetailResponse?>
{
    public async Task<StudentApplicationDetailResponse?> Handle(
        GetStudentApplicationDetailQuery request,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId
            ?? throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phien dang nhap khong hop le.",
                "invalid_session");

        var app = await repository.GetByIdForUserAsync(
            request.ApplicationId, userId, cancellationToken: cancellationToken);

        if (app is null)
        {
            return null;
        }

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
}

using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Student.Abstractions;
using SV5T.Application.Student.Dtos;
using SV5T.Application.Student.Support;
using SV5T.Domain.Evidences;
using SV5T.Domain.Standards.Enums;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Student.Evidences.Commands.UpsertEvidence;

public sealed class UpsertEvidenceHandler(
    IStudentApplicationRepository applications,
    IStudentEvidenceRepository evidences,
    IStudentCriterionRepository criteria,
    IUnitOfWork uow,
    ICurrentUser currentUser)
    : IRequestHandler<UpsertEvidenceCommand, StudentEvidenceItemResponse>
{
    public async Task<StudentEvidenceItemResponse> Handle(
        UpsertEvidenceCommand command,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId
            ?? throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phiên đăng nhập không hợp lệ.",
                "invalid_session");

        var app = await applications.GetByIdForUserAsync(
                command.ApplicationId, userId, tracking: true, cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy hồ sơ.",
                "application_not_found");

        StudentApplicationGuard.EnsureApplicationEditable(app);

        var criterion = await criteria.GetByIdAsync(command.CriterionId, cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy tiêu chí.",
                "criterion_not_found");

        if (criterion.Type != CriterionType.Requirement)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Chỉ được nộp minh chứng cho tiêu chí bắt buộc.",
                "criterion_not_requirement");
        }

        var existing = await evidences.GetByApplicationAndCriterionAsync(
            app.Id, criterion.Id, tracking: true, cancellationToken: cancellationToken);

        if (existing is not null)
        {
            StudentEvidenceGuard.EnsureEvidenceEditable(existing);
            if (!string.IsNullOrWhiteSpace(command.Request.RowVersion))
            {
                EnsureRowVersionMatch(existing.RowVersion, command.Request.RowVersion!);
            }

            var now = DateTime.UtcNow;
            existing.DataJson = command.Request.DataJson;
            existing.UpdatedAt = now;
            existing.UpdatedBy = userId.ToString();
            if (existing.Status == EvidenceStatus.NeedsRevision)
            {
                existing.Status = EvidenceStatus.Draft;
            }

            await uow.SaveChangesAsync(cancellationToken);
            return Map(existing);
        }

        var evidence = new Evidence
        {
            ApplicationId = app.Id,
            CriterionId = criterion.Id,
            DataJson = command.Request.DataJson,
            AttachmentsJson = "[]",
            Status = EvidenceStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId.ToString()
            // NOTE: Không gán Criterion = criterion ở đây.
            // criterion được load bằng AsNoTracking (Detached) nên nếu gán vào
            // navigation, EF Core sẽ coi là entity mới (Added) và re-INSERT
            // bảng criteria -> MySQL 1062 criteria.PRIMARY -> 409 unique_constraint_violation.
        };

        await evidences.AddAsync(evidence, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return Map(evidence, criterion);
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

    private static StudentEvidenceItemResponse Map(Evidence e, Domain.Criteria.Criterion? criterion = null)
    {
        var crit = criterion ?? e.Criterion;
        return new(
            e.Id,
            e.CriterionId,
            crit?.Code ?? string.Empty,
            crit?.Title ?? string.Empty,
            crit?.Standard?.GroupCode.ToString() ?? string.Empty,
            e.Status,
            e.DataJson,
            e.AttachmentsJson,
            e.ReviewerNote,
            e.ReviewedAt,
            Convert.ToBase64String(e.RowVersion),
            e.CreatedAt,
            e.UpdatedAt ?? e.CreatedAt);
    }
}

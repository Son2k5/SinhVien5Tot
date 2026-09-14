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
                "Phien dang nhap khong hop le.",
                "invalid_session");

        var app = await applications.GetByIdForUserAsync(
                command.ApplicationId, userId, tracking: true, cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Khong tim thay ho so.",
                "application_not_found");

        StudentApplicationGuard.EnsureApplicationEditable(app);

        var criterion = await criteria.GetByIdAsync(command.CriterionId, cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Khong tim thay tieu chi.",
                "criterion_not_found");

        if (criterion.Type != CriterionType.Requirement)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Chi duoc nop minh chung cho tieu chi loai Requirement.",
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
            EvidenceTypeTemplateId = ResolveTemplateId(criterion),
            DataJson = command.Request.DataJson,
            AttachmentsJson = "[]",
            Status = EvidenceStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = userId.ToString()
        };

        await evidences.AddAsync(evidence, cancellationToken);
        await uow.SaveChangesAsync(cancellationToken);
        return Map(evidence);
    }

    private static Guid ResolveTemplateId(Domain.Criteria.Criterion criterion)
    {
        // TemplateId se duoc resolve day du khi co mapping Criterion->Template.
        // Tam dung Guid rong de giu flow; se thay bang lookup khi schema co cot lien ket.
        return Guid.Empty;
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

    private static StudentEvidenceItemResponse Map(Evidence e) => new(
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
        e.UpdatedAt ?? e.CreatedAt);
}

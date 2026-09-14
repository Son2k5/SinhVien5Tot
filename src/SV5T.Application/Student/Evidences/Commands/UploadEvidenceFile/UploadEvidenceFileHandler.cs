using System.Text.Json;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Student.Abstractions;
using SV5T.Application.Student.Dtos;
using SV5T.Application.Student.Support;

namespace SV5T.Application.Student.Evidences.Commands.UploadEvidenceFile;

public sealed class UploadEvidenceFileHandler(
    IStudentEvidenceRepository evidences,
    IEvidenceFileStorage storage,
    IUnitOfWork uow,
    ICurrentUser currentUser)
    : IRequestHandler<UploadEvidenceFileCommand, StudentEvidenceItemResponse>
{
    public async Task<StudentEvidenceItemResponse> Handle(
        UploadEvidenceFileCommand command,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId
            ?? throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phien dang nhap khong hop le.",
                "invalid_session");

        var evidence = await evidences.GetByIdForUserAsync(
                command.EvidenceId, userId, tracking: true, cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Khong tim thay minh chung.",
                "evidence_not_found");

        StudentEvidenceGuard.EnsureEvidenceEditable(evidence);
        StudentEvidenceGuard.EnsureExtensionAllowed(command.Request.FileName);
        StudentEvidenceGuard.EnsureSizeAllowed(command.Request.Length);

        var stored = await storage.UploadAsync(
            userId,
            evidence.ApplicationId,
            command.Request.Content,
            command.Request.FileName,
            cancellationToken);

        var attachments = ParseAttachments(evidence.AttachmentsJson);
        attachments.Add(new Dictionary<string, object?>
        {
            ["url"] = stored.Url,
            ["publicId"] = stored.PublicId,
            ["resourceType"] = stored.ResourceType,
            ["bytes"] = stored.Bytes,
            ["fileName"] = stored.OriginalFileName,
            ["uploadedAt"] = DateTime.UtcNow
        });

        var now = DateTime.UtcNow;
        evidence.AttachmentsJson = JsonSerializer.Serialize(attachments);
        evidence.UpdatedAt = now;
        evidence.UpdatedBy = userId.ToString();

        await uow.SaveChangesAsync(cancellationToken);

        return new StudentEvidenceItemResponse(
            evidence.Id,
            evidence.CriterionId,
            evidence.Criterion?.Code ?? string.Empty,
            evidence.Criterion?.Title ?? string.Empty,
            evidence.Criterion?.Standard?.GroupCode.ToString() ?? string.Empty,
            evidence.Status,
            evidence.DataJson,
            evidence.AttachmentsJson,
            evidence.ReviewerNote,
            evidence.ReviewedAt,
            Convert.ToBase64String(evidence.RowVersion),
            evidence.CreatedAt,
            evidence.UpdatedAt ?? evidence.CreatedAt);
    }

    private static List<Dictionary<string, object?>> ParseAttachments(string json)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return [];
            }

            return JsonSerializer.Deserialize<List<Dictionary<string, object?>>>(json) ?? [];
        }
        catch
        {
            return [];
        }
    }
}

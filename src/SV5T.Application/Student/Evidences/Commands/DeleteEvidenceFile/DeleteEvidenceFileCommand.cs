using System.Text.Json;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Student.Abstractions;
using SV5T.Application.Student.Dtos;
using SV5T.Application.Student.Support;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Student.Evidences.Commands.DeleteEvidenceFile;

public sealed record DeleteEvidenceFileCommand(Guid EvidenceId, int FileIndex, string RowVersion)
    : IRequest<StudentEvidenceItemResponse>;

public sealed class DeleteEvidenceFileHandler(
    IStudentEvidenceRepository evidences,
    IEvidenceFileStorage storage,
    IUnitOfWork uow,
    ICurrentUser currentUser) : IRequestHandler<DeleteEvidenceFileCommand, StudentEvidenceItemResponse>
{
    public async Task<StudentEvidenceItemResponse> Handle(DeleteEvidenceFileCommand command, CancellationToken ct)
    {
        var userId = currentUser.UserId ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized, "Phiên đăng nhập không hợp lệ.", "invalid_session");
        var evidence = await evidences.GetByIdForUserAsync(command.EvidenceId, userId, tracking: true, cancellationToken: ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Không tìm thấy minh chứng.", "evidence_not_found");

        StudentEvidenceGuard.EnsureEvidenceEditable(evidence);
        StudentEvidenceGuard.EnsureCampaignAcceptingEvidence(evidence.Application.Campaign);
        if (evidence.Application.Status is SubmissionStatus.Approved or SubmissionStatus.Rejected or SubmissionStatus.Withdrawn ||
            evidence.Application.Status is not (SubmissionStatus.Draft or SubmissionStatus.NeedsRevision) &&
            evidence.Status is not (EvidenceStatus.NeedsRevision or EvidenceStatus.Rejected) &&
            !(evidence.Status == EvidenceStatus.Draft && evidence.ReviewedAt.HasValue))
            StudentApplicationGuard.EnsureApplicationEditable(evidence.Application);

        byte[] version;
        try { version = Convert.FromBase64String(command.RowVersion); }
        catch (FormatException) { throw new UseCaseException(ApplicationErrorKind.Validation,
            "Phiên bản dữ liệu không hợp lệ.", "invalid_row_version"); }
        if (!version.SequenceEqual(evidence.RowVersion))
            throw new UseCaseException(ApplicationErrorKind.Conflict,
                "Minh chứng đã thay đổi. Vui lòng tải lại.", "concurrency_conflict");

        List<JsonElement> attachments;
        try
        {
            attachments = JsonSerializer.Deserialize<List<JsonElement>>(evidence.AttachmentsJson) ?? [];
        }
        catch (JsonException)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation,
                "Danh sách tập tin không hợp lệ.", "invalid_evidence_files");
        }
        if (command.FileIndex < 0 || command.FileIndex >= attachments.Count)
            throw new UseCaseException(ApplicationErrorKind.NotFound,
                "Không tìm thấy tập tin minh chứng.", "evidence_file_not_found");

        var removed = attachments[command.FileIndex];
        attachments.RemoveAt(command.FileIndex);
        evidence.AttachmentsJson = JsonSerializer.Serialize(attachments);
        if (evidence.Status is EvidenceStatus.NeedsRevision or EvidenceStatus.Rejected)
            evidence.Status = EvidenceStatus.Draft;
        evidence.UpdatedAt = DateTime.UtcNow;
        evidence.UpdatedBy = userId.ToString();
        await uow.SaveChangesAsync(ct);

        if (removed.ValueKind == JsonValueKind.Object &&
            removed.TryGetProperty("publicId", out var publicId) && publicId.ValueKind == JsonValueKind.String &&
            !string.IsNullOrWhiteSpace(publicId.GetString()))
        {
            var resourceType = removed.TryGetProperty("resourceType", out var resource)
                ? resource.GetString() ?? "raw" : "raw";
            await storage.DeleteAsync(publicId.GetString()!, resourceType, ct);
        }

        return new StudentEvidenceItemResponse(evidence.Id, evidence.CriterionId,
            evidence.Criterion?.Code ?? string.Empty, evidence.Criterion?.Title ?? string.Empty,
            evidence.Criterion?.Standard?.GroupCode.ToString() ?? string.Empty,
            evidence.Status, evidence.DataJson, evidence.AttachmentsJson, evidence.ReviewerNote,
            evidence.ReviewedAt, Convert.ToBase64String(evidence.RowVersion),
            evidence.CreatedAt, evidence.UpdatedAt ?? evidence.CreatedAt);
    }
}

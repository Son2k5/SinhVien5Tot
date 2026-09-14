using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Student.Dtos;

public sealed record StudentApplicationSummaryResponse(
    Guid Id,
    string ApplicationCode,
    Guid CampaignId,
    string CampaignName,
    string SchoolYear,
    SubmissionStatus Status,
    DateTime CreatedAt,
    DateTime? SubmittedAt,
    DateTime? UpdatedAt,
    int TotalEvidences,
    int ApprovedEvidences,
    int PendingEvidences);

public sealed record StudentApplicationDetailResponse(
    Guid Id,
    string ApplicationCode,
    Guid CampaignId,
    string CampaignName,
    string SchoolYear,
    DateTime SubmitDeadline,
    SubmissionStatus Status,
    string? SnapshotJson,
    DateTime CreatedAt,
    DateTime? SubmittedAt,
    DateTime? UpdatedAt,
    string RowVersion,
    IReadOnlyList<StudentEvidenceItemResponse> Evidences);

public sealed record StudentEvidenceItemResponse(
    Guid Id,
    Guid CriterionId,
    string CriterionCode,
    string CriterionTitle,
    string GroupCode,
    EvidenceStatus Status,
    string? DataJson,
    string? AttachmentsJson,
    string? ReviewerNote,
    DateTime? ReviewedAt,
    string RowVersion,
    DateTime CreatedAt,
    DateTime UpdatedAt);

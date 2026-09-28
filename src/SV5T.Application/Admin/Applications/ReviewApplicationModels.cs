using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Admin.Applications;

public sealed record StandardProgress(string GroupCode, int RequiredCount, int ApprovedCount, bool Complete);

public sealed record ReviewApplicationResponse(Guid Id, string ApplicationCode, Guid CampaignId,
    string CampaignName, string ApplicantSnapshotJson, SubmissionStatus Status, DateTime? SubmittedAt,
    Guid? AssignedReviewerId, string? ReviewerGeneralNote,
    string? RejectionReason, string RowVersion, IReadOnlyList<StandardProgress> Standards);

public sealed record ReviewApplicationDecisionRequest(SubmissionStatus Decision, string? Note, string RowVersion);

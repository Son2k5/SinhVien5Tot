using SV5T.Application.Admin.Dtos;
using SV5T.Domain.Evidences;

namespace SV5T.Application.Admin.Evidences.Common;

public static class EvidenceReviewMappings
{
    public static EvidenceResponse MapToResponse(Evidence evidence) =>
        new(
            evidence.Id,
            evidence.ApplicationId,
            evidence.Application?.ApplicationCode ?? string.Empty,
            evidence.CriterionId,
            evidence.Criterion?.Code ?? string.Empty,
            evidence.Criterion?.Title ?? string.Empty,
            evidence.Application?.CampaignId ?? Guid.Empty,
            evidence.Application?.Campaign?.Name ?? string.Empty,
            evidence.DataJson,
            evidence.AttachmentsJson,
            evidence.NumericValue,
            evidence.Status,
            evidence.ReviewerNote,
            evidence.ReviewedBy,
            evidence.ReviewedAt,
            Convert.ToBase64String(evidence.RowVersion),
            evidence.CreatedAt);
}

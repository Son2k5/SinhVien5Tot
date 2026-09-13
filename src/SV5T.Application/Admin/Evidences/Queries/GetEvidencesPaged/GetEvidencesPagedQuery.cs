using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Admin.Evidences.Queries.GetEvidencesPaged;

public sealed record GetEvidencesPagedQuery(
    Guid? CampaignId,
    EvidenceStatus? Status,
    Guid? ApplicationId,
    int PageIndex = 1,
    int PageSize = 20
) : IRequest<PagedResponse<EvidenceResponse>>;

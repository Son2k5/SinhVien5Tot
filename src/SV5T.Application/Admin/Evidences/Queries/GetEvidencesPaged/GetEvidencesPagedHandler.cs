using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Evidences.Common;
using SV5T.Application.Evidences.Abstractions;

namespace SV5T.Application.Admin.Evidences.Queries.GetEvidencesPaged;

public sealed class GetEvidencesPagedHandler(IEvidenceRepository evidenceRepository)
    : IRequestHandler<GetEvidencesPagedQuery, PagedResponse<EvidenceResponse>>
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    public async Task<PagedResponse<EvidenceResponse>> Handle(
        GetEvidencesPagedQuery request,
        CancellationToken cancellationToken)
    {
        var pageIndex = request.PageIndex < 1 ? 1 : request.PageIndex;
        var pageSize = request.PageSize is < 1 or > MaxPageSize ? DefaultPageSize : request.PageSize;

        var paged = await evidenceRepository.GetPagedAsync(
            request.CampaignId,
            request.Status,
            request.ApplicationId,
            pageIndex,
            pageSize,
            cancellationToken);

        return new PagedResponse<EvidenceResponse>(
            paged.Items.Select(EvidenceReviewMappings.MapToResponse).ToList(),
            paged.TotalCount,
            paged.PageIndex,
            paged.PageSize,
            paged.TotalPages);
    }
}

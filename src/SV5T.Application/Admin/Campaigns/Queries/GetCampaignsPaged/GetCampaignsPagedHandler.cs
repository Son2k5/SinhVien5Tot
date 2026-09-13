using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Campaigns.Abstractions;
using SV5T.Application.Common.Models;
using SV5T.Domain.Campaigns;

namespace SV5T.Application.Admin.Campaigns.Queries.GetCampaignsPaged;

public sealed class GetCampaignsPagedHandler(ICampaignRepository campaignRepository)
    : IRequestHandler<GetCampaignsPagedQuery, PagedResult<CampaignResponse>>
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    public async Task<PagedResult<CampaignResponse>> Handle(
        GetCampaignsPagedQuery request,
        CancellationToken cancellationToken
    )
    {
        var pageIndex = request.PageIndex < 1 ? 1 : request.PageIndex;
        var pageSize = request.PageSize is < 1 or > MaxPageSize ? DefaultPageSize : request.PageSize;
        var paged = await campaignRepository.GetPagedAsync(
            request.Level,
            request.Status,
            request.SchoolYear,
            pageIndex,
            pageSize,
            cancellationToken
        );
        return new PagedResult<CampaignResponse>(
            paged.Items.Select(MapToResponse).ToList(),
            paged.TotalCount,
            paged.PageIndex,
            paged.PageSize
        );
    }

    private static CampaignResponse MapToResponse(Campaign campaign) =>
        new(
            campaign.Id,
            campaign.Name,
            campaign.SchoolYear,
            campaign.Level,
            campaign.AwardType,
            campaign.Status,
            campaign.StandardSetId,
            campaign.StandardSet?.AcademicYear,
            campaign.PrerequisiteCampaignId,
            campaign.PrerequisiteCampaign?.Name,
            campaign.RegOpenAt,
            campaign.RegCloseAt,
            campaign.SubmitDeadline,
            campaign.ReviewDeadline,
            campaign.Description,
            campaign.CreatedAt
        );
}

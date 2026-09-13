using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Campaigns.Abstractions;
using SV5T.Domain.Campaigns;

namespace SV5T.Application.Admin.Campaigns.Queries.GetAllCampaigns;

public sealed class GetAllCampaignsHandler(ICampaignRepository campaignRepository)
    : IRequestHandler<GetAllCampaignsQuery, IReadOnlyList<CampaignResponse>>
{
    public async Task<IReadOnlyList<CampaignResponse>> Handle(
        GetAllCampaignsQuery request,
        CancellationToken cancellationToken
    )
    {
        var campaigns = await campaignRepository.GetAllAsync(
            request.Level,
            request.Status,
            request.SchoolYear,
            cancellationToken
        );
        return campaigns.Select(MapToResponse).ToList();
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
            campaign.StandardSet?.Name ?? campaign.StandardSet?.AcademicYear,
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

using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Campaigns.Abstractions;
using SV5T.Domain.Campaigns;

namespace SV5T.Application.Admin.Campaigns.Queries.GetCampaignById;

public sealed class GetCampaignByIdHandler(ICampaignRepository campaignRepository)
    : IRequestHandler<GetCampaignByIdQuery, CampaignDetailResponse?>
{
    public async Task<CampaignDetailResponse?> Handle(GetCampaignByIdQuery request, CancellationToken cancellationToken)
    {
        var campaign = await campaignRepository.GetByIdAsync(
            request.Id,
            includeDetails: true,
            cancellationToken: cancellationToken
        );
        return campaign is null ? null : MapToDetailResponse(campaign);
    }

    private static CampaignDetailResponse MapToDetailResponse(Campaign campaign) =>
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
            campaign.CollectiveEligibilityRuleJson,
            campaign.RegOpenAt,
            campaign.RegCloseAt,
            campaign.SubmitDeadline,
            campaign.ReviewDeadline,
            campaign.Description,
            campaign.Applications.Count,
            campaign.CreatedAt
        );
}

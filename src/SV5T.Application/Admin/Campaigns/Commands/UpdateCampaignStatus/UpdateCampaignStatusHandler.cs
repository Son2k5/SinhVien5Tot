using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Campaigns.Abstractions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Campaigns;

namespace SV5T.Application.Admin.Campaigns.Commands.UpdateCampaignStatus;

public sealed class UpdateCampaignStatusHandler(
    ICampaignRepository campaignRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser
) : IRequestHandler<UpdateCampaignStatusCommand, CampaignDetailResponse>
{
    public async Task<CampaignDetailResponse> Handle(
        UpdateCampaignStatusCommand request,
        CancellationToken cancellationToken
    )
    {
        var actorId =
            currentUser.UserId ?? throw new UseCaseException(ApplicationErrorKind.Unauthorized, "Khong xac dinh user.");

        var campaign =
            await campaignRepository.GetByIdAsync(
                request.Id,
                includeDetails: true,
                tracking: true,
                cancellationToken: cancellationToken
            )
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Khong tim thay chien dich.",
                "campaign_not_found"
            );
        campaign.Status = request.Request.Status;
        campaign.UpdatedAt = DateTime.UtcNow;
        campaign.UpdatedBy = actorId.ToString();
        await campaignRepository.UpdateAsync(campaign, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Map(campaign);
    }

    static CampaignDetailResponse Map(Campaign c) =>
        new(
            c.Id,
            c.Name,
            c.SchoolYear,
            c.Level,
            c.AwardType,
            c.Status,
            c.StandardSetId,
            c.StandardSet?.AcademicYear,
            c.PrerequisiteCampaignId,
            c.PrerequisiteCampaign?.Name,
            c.CollectiveEligibilityRuleJson,
            c.RegOpenAt,
            c.RegCloseAt,
            c.SubmitDeadline,
            c.ReviewDeadline,
            c.Description,
            c.Applications.Count,
            c.CreatedAt
        );
}

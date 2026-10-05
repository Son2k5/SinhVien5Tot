using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Campaigns.Abstractions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Notifications;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Campaigns.Enums;
using SV5T.Domain.Notifications;

namespace SV5T.Application.Admin.Campaigns.Commands.UpdateCampaignStatus;

public sealed class UpdateCampaignStatusHandler(
    ICampaignRepository campaignRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    INotificationQueue? notificationQueue = null
) : IRequestHandler<UpdateCampaignStatusCommand, CampaignDetailResponse>
{
    public async Task<CampaignDetailResponse> Handle(
        UpdateCampaignStatusCommand request,
        CancellationToken cancellationToken
    )
    {
        var actorId =
            currentUser.UserId ?? throw new UseCaseException(ApplicationErrorKind.Unauthorized, "Không xác định được danh tính người dùng hiện tại.", "invalid_session");

        var campaign =
            await campaignRepository.GetByIdAsync(
                request.Id,
                includeDetails: true,
                tracking: true,
                cancellationToken: cancellationToken
            )
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy chiến dịch.",
                "campaign_not_found"
            );
        var previousStatus = campaign.Status;
        campaign.Status = request.Request.Status;
        campaign.UpdatedAt = DateTime.UtcNow;
        campaign.UpdatedBy = actorId.ToString();
        await campaignRepository.UpdateAsync(campaign, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        if (campaign.Status is CampaignStatus.Open or CampaignStatus.Published &&
            previousStatus is not (CampaignStatus.Open or CampaignStatus.Published))
        {
            var content = NotificationContentBuilder.Build(
                NotificationType.CampaignPublished,
                new NotificationContentData(CampaignName: campaign.Name));
            notificationQueue?.TryEnqueue(new NotificationJob(
                NotificationType.CampaignPublished,
                NotificationTargetType.Campaign,
                campaign.Id,
                null,
                NotificationAudience.AllStudents,
                null,
                content.Title,
                content.Body,
                $"CampaignPublished:{campaign.Id}"));
        }
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

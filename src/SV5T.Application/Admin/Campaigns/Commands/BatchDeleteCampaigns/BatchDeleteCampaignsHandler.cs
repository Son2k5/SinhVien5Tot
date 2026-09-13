using MediatR;
using SV5T.Application.Campaigns.Abstractions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Campaigns.Enums;

namespace SV5T.Application.Admin.Campaigns.Commands.BatchDeleteCampaigns;

public sealed class BatchDeleteCampaignsHandler(
    ICampaignRepository campaignRepository,
    IUnitOfWork unitOfWork)
    : IRequestHandler<BatchDeleteCampaignsCommand, BatchDeleteCampaignsResult>
{
    public async Task<BatchDeleteCampaignsResult> Handle(
        BatchDeleteCampaignsCommand request,
        CancellationToken cancellationToken)
    {
        var uniqueIds = request.Ids.Distinct().ToList();
        if (uniqueIds.Count == 0)
        {
            return new BatchDeleteCampaignsResult(0);
        }

        var campaigns = await campaignRepository.GetByIdsAsync(
            uniqueIds,
            includeDetails: true,
            tracking: true,
            cancellationToken: cancellationToken
        );

        if (campaigns.Count == 0)
        {
            throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy chiến dịch nào để xóa.",
                "campaigns_not_found"
            );
        }

        var hasApplications = campaigns.FirstOrDefault(c => c.Applications.Count > 0);
        if (hasApplications is not null)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Chiến dịch '{hasApplications.Name}' đã có hồ sơ đăng ký, không thể xóa.",
                "campaign_has_applications"
            );
        }

        var hasDependent = campaigns.FirstOrDefault(c => c.DependentCampaigns.Count > 0);
        if (hasDependent is not null)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Chiến dịch '{hasDependent.Name}' đang là điều kiện tiên quyết của chiến dịch khác, không thể xóa.",
                "campaign_has_dependents"
            );
        }


        await campaignRepository.RemoveRangeAsync(campaigns, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return new BatchDeleteCampaignsResult(campaigns.Count);
    }
}

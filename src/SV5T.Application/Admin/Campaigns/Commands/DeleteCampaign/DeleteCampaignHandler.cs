using MediatR;
using SV5T.Application.Campaigns.Abstractions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Campaigns.Enums;

namespace SV5T.Application.Admin.Campaigns.Commands.DeleteCampaign;

public sealed class DeleteCampaignHandler(ICampaignRepository campaignRepository, IUnitOfWork unitOfWork)
    : IRequestHandler<DeleteCampaignCommand, MediatR.Unit>
{
    public async Task<MediatR.Unit> Handle(DeleteCampaignCommand request, CancellationToken cancellationToken)
    {
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
        if (campaign.Applications.Count > 0)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể xóa chiến dịch đã có hồ sơ đăng ký.",
                "campaign_has_applications"
            );
        }

        if (campaign.DependentCampaigns.Count > 0)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể xóa chiến dịch đang là điều kiện tiên quyết của chiến dịch khác.",
                "campaign_has_dependents"
            );
        }
        await campaignRepository.RemoveAsync(campaign, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return MediatR.Unit.Value;
    }
}

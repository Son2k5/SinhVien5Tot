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
                "Khong tim thay chien dich.",
                "campaign_not_found"
            );
        if (campaign.Status != CampaignStatus.Draft)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Chi co the xoa chien dich dang o trang thai Nhap (Draft).",
                "campaign_not_deletable"
            );
        }

        if (campaign.Applications.Count > 0)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Khong the xoa chien dich da co ho so dang ky.",
                "campaign_has_applications"
            );
        }
        await campaignRepository.RemoveAsync(campaign, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return MediatR.Unit.Value;
    }
}

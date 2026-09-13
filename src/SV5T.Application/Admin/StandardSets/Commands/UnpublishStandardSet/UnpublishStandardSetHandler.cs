using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Campaigns.Abstractions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Admin.StandardSets.Commands.UnpublishStandardSet;

public sealed class UnpublishStandardSetHandler(
    IStandardSetRepository standardSetRepository,
    ICampaignRepository campaignRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser
) : IRequestHandler<UnpublishStandardSetCommand, StandardSetResponse>
{
    public async Task<StandardSetResponse> Handle(
        UnpublishStandardSetCommand command,
        CancellationToken cancellationToken
    )
    {
        var standardSet =
            await standardSetRepository.GetByIdAsync(command.StandardSetId, true, true, true, cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn.",
                "standard_set_not_found"
            );
        if (standardSet.Status != StandardSetStatus.Published)
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Chỉ có thể hoàn lại bộ tiêu chuẩn đang ở trạng thái Đã công bố (Published).",
                "standard_set_not_published"
            );
        var allCampaigns = await campaignRepository.GetAllAsync(cancellationToken: cancellationToken);
        var usingCampaign = allCampaigns.FirstOrDefault(campaign => campaign.StandardSetId == command.StandardSetId);
        if (usingCampaign is not null)
        {
            var campaignName = usingCampaign.Name;
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Không thể hủy công bố vì bộ tiêu chuẩn đang được sử dụng " +
                $"bởi chiến dịch '{campaignName}'. " +
                "Vui lòng gỡ hoặc chỉnh sửa chiến dịch trước.",
                "standard_set_in_use"
            );
        }
        var actorId = RequireAdminUserId();
        var now = DateTime.UtcNow;
        standardSet.Status = StandardSetStatus.Draft;
        standardSet.PublishedAt = null;
        standardSet.UpdatedAt = now;
        standardSet.UpdatedBy = actorId.ToString();
        await standardSetRepository.UpdateAsync(standardSet, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return AdminStandardMappings.MapToSetResponse(standardSet, true);
    }

    private Guid RequireAdminUserId() =>
        currentUser.UserId
        ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized,
            "Không xác định được danh tính người dùng hiện tại."
        );
}


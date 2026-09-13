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
        UnpublishStandardSetCommand request,
        CancellationToken cancellationToken
    )
    {
        var standardSet =
            await standardSetRepository.GetByIdAsync(request.StandardSetId, true, true, true, cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Khong tim thay bo tieu chuan.",
                "standard_set_not_found"
            );
        if (standardSet.Status != StandardSetStatus.Published)
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Chi co the hoan lai bo tieu chuan dang o trang thai Da cong bo (Published).",
                "standard_set_not_published"
            );
        var allCampaigns = await campaignRepository.GetAllAsync(cancellationToken: cancellationToken);
        var usingCampaign = allCampaigns.FirstOrDefault(c => c.StandardSetId == request.StandardSetId);
        if (usingCampaign is not null)
        {
            var campaignName = usingCampaign.Name;
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Khong the huy cong bo vi bo tieu chuan dang duoc su dung " +
                $"boi chien dich '{campaignName}'. " +
                "Vui long go hoac chinh sua chien dich truoc.",
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
            "Khong xac dinh duoc danh tinh nguoi dung hien tai."
        );
}

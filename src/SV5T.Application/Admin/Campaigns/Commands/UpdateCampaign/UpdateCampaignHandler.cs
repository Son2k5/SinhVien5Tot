using FluentValidation;
using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Auth.Support;
using SV5T.Application.Campaigns.Abstractions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Campaigns.Enums;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Admin.Campaigns.Commands.UpdateCampaign;

public sealed class UpdateCampaignHandler(
    ICampaignRepository campaignRepository,
    IStandardSetRepository standardSetRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    IValidator<UpdateCampaignRequest> validator
) : IRequestHandler<UpdateCampaignCommand, CampaignDetailResponse>
{
    public async Task<CampaignDetailResponse> Handle(UpdateCampaignCommand request, CancellationToken cancellationToken)
    {
        await AuthServiceSupport.ValidateAsync(validator, request.Request, cancellationToken);

        var actorId = RequireAdminUserId();

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
        if (campaign.Status is CampaignStatus.Closed or CampaignStatus.Archived)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Khong the chinh sua chien dich da dong hoac da luu tru.",
                "campaign_not_editable"
            );
        }

        var isDuplicate = await campaignRepository.ExistsByNameAndSchoolYearAsync(
            request.Request.Name.Trim(),
            request.Request.SchoolYear.Trim(),
            excludeId: request.Id,
            cancellationToken: cancellationToken
        );

        if (isDuplicate)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Ten '{request.Request.Name.Trim()}' da ton tai trong '{request.Request.SchoolYear.Trim()}'.",
                "campaign_name_duplicate"
            );
        }

        var standardSet =
            await standardSetRepository.GetByIdAsync(
                request.Request.StandardSetId,
                cancellationToken: cancellationToken
            )
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Khong tim thay bo tieu chuan.",
                "standard_set_not_found"
            );

        if (standardSet.Status != StandardSetStatus.Published)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Bo tieu chuan phai Published.",
                "standard_set_not_published"
            );
        }

        if (standardSet.Level != request.Request.Level || standardSet.AwardType != request.Request.AwardType)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Cap/Loai danh hieu khong khop.",
                "standard_set_mismatch"
            );
        }

        await ValidateHierarchicalAsync(
            request.Request.Level,
            request.Request.PrerequisiteCampaignId,
            cancellationToken
        );

        campaign.Name = request.Request.Name.Trim();
        campaign.SchoolYear = request.Request.SchoolYear.Trim();
        campaign.Level = request.Request.Level;
        campaign.AwardType = request.Request.AwardType;
        campaign.StandardSetId = request.Request.StandardSetId;
        campaign.PrerequisiteCampaignId = request.Request.PrerequisiteCampaignId;
        campaign.CollectiveEligibilityRuleJson = request.Request.CollectiveEligibilityRuleJson;
        campaign.RegOpenAt = request.Request.RegOpenAt;
        campaign.RegCloseAt = request.Request.RegCloseAt;
        campaign.SubmitDeadline = request.Request.SubmitDeadline;
        campaign.ReviewDeadline = request.Request.ReviewDeadline;
        campaign.Description = request.Request.Description?.Trim();
        campaign.UpdatedAt = DateTime.UtcNow;
        campaign.UpdatedBy = actorId.ToString();

        await campaignRepository.UpdateAsync(campaign, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await campaignRepository.GetByIdAsync(
            request.Id,
            includeDetails: true,
            cancellationToken: cancellationToken
        );

        return MapToDetailResponse(updated ?? campaign);
    }

    async Task ValidateHierarchicalAsync(AwardLevel level, Guid? prerequisiteId, CancellationToken ct)
    {
        switch (level)
        {
            case AwardLevel.School:
                if (prerequisiteId.HasValue)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "School khong duoc gan prerequisite.",
                        "invalid_prerequisite_school"
                    );
                }

                break;

            case AwardLevel.City:
                if (!prerequisiteId.HasValue)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "City bat buoc co prerequisite School.",
                        "missing_prerequisite_city"
                    );
                }

                var cityPrereq =
                    await campaignRepository.GetByIdAsync(prerequisiteId.Value, cancellationToken: ct)
                    ?? throw new UseCaseException(
                        ApplicationErrorKind.NotFound,
                        "Khong tim thay prerequisite.",
                        "prerequisite_not_found"
                    );

                if (cityPrereq.Level != AwardLevel.School)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Prerequisite City phai la School.",
                        "invalid_prerequisite_level"
                    );
                }

                break;

            case AwardLevel.Central:
                if (!prerequisiteId.HasValue)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Central bat buoc co prerequisite City.",
                        "missing_prerequisite_central"
                    );
                }

                var centralPrereq =
                    await campaignRepository.GetByIdAsync(prerequisiteId.Value, cancellationToken: ct)
                    ?? throw new UseCaseException(
                        ApplicationErrorKind.NotFound,
                        "Khong tim thay prerequisite.",
                        "prerequisite_not_found"
                    );

                if (centralPrereq.Level != AwardLevel.City)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Prerequisite Central phai la City.",
                        "invalid_prerequisite_level"
                    );
                }

                break;
        }
    }

    static CampaignDetailResponse MapToDetailResponse(Campaign c) =>
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

    Guid RequireAdminUserId() =>
        currentUser.UserId
        ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized,
            "Khong xac dinh duoc danh tinh nguoi dung hien tai."
        );
}

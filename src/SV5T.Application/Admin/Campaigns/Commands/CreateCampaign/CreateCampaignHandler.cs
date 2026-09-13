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

namespace SV5T.Application.Admin.Campaigns.Commands.CreateCampaign;

public sealed class CreateCampaignHandler(
    ICampaignRepository campaignRepository,
    IStandardSetRepository standardSetRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    IValidator<CreateCampaignRequest> createCampaignValidator
) : IRequestHandler<CreateCampaignCommand, CampaignDetailResponse>
{
    public async Task<CampaignDetailResponse> Handle(CreateCampaignCommand request, CancellationToken cancellationToken)
    {
        await AuthServiceSupport.ValidateAsync(createCampaignValidator, request.Request, cancellationToken);

        var actorId = RequireAdminUserId();

        var nameExists = await campaignRepository.ExistsByNameAndSchoolYearAsync(
            request.Request.Name.Trim(),
            request.Request.SchoolYear.Trim(),
            cancellationToken: cancellationToken
        );
        if (nameExists)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Ten chien dich '{request.Request.Name.Trim()}' "
                    + $"da ton tai trong nam hoc '{request.Request.SchoolYear.Trim()}'.",
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
                "Khong tim thay bo tieu chuan duoc gan vao dot xet.",
                "standard_set_not_found"
            );

        if (standardSet.Status != StandardSetStatus.Published)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Bo tieu chuan gan vao dot xet bat buoc phai o trang thai da cong bo (Published).",
                "standard_set_not_published"
            );
        }

        if (standardSet.Level != request.Request.Level || standardSet.AwardType != request.Request.AwardType)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Cap xet duyet hoac Loai danh hieu cua bo tieu chuan khong khop voi chien dich.",
                "standard_set_mismatch"
            );
        }
        await ValidateHierarchicalRulesAsync(
            request.Request.Level,
            request.Request.PrerequisiteCampaignId,
            cancellationToken
        );

        var campaign = new Campaign
        {
            Name = request.Request.Name.Trim(),
            SchoolYear = request.Request.SchoolYear.Trim(),
            Level = request.Request.Level,
            AwardType = request.Request.AwardType,
            Status = CampaignStatus.Draft,
            StandardSetId = request.Request.StandardSetId,
            PrerequisiteCampaignId = request.Request.PrerequisiteCampaignId,
            CollectiveEligibilityRuleJson = request.Request.CollectiveEligibilityRuleJson,
            RegOpenAt = request.Request.RegOpenAt,
            RegCloseAt = request.Request.RegCloseAt,
            SubmitDeadline = request.Request.SubmitDeadline,
            ReviewDeadline = request.Request.ReviewDeadline,
            Description = request.Request.Description?.Trim(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = actorId.ToString(),
        };
        await campaignRepository.AddAsync(campaign, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var created = await campaignRepository.GetByIdAsync(
            campaign.Id,
            includeDetails: true,
            cancellationToken: cancellationToken
        );
        return MapToDetailResponse(created ?? campaign);
    }

    async Task ValidateHierarchicalRulesAsync(AwardLevel level, Guid? prerequisiteCampaignId, CancellationToken ct)
    {
        switch (level)
        {
            case AwardLevel.School:
                if (prerequisiteCampaignId.HasValue)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Chien dich cap Truong (School) la cap co so, " + "khong duoc gan chien dich tien quyet.",
                        "invalid_prerequisite_school"
                    );
                }
                break;
            case AwardLevel.City:
                if (!prerequisiteCampaignId.HasValue)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Chien dich cap Thanh pho/Tinh (City) bat buoc "
                            + "phai chon chien dich dieu kien tien quyet cap Truong (School).",
                        "missing_prerequisite_city"
                    );
                }
                var cityPrereq =
                    await campaignRepository.GetByIdAsync(prerequisiteCampaignId.Value, cancellationToken: ct)
                    ?? throw new UseCaseException(
                        ApplicationErrorKind.NotFound,
                        "Khong tim thay chien dich dieu kien tien quyet.",
                        "prerequisite_not_found"
                    );
                if (cityPrereq.Level != AwardLevel.School)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Chien dich dieu kien tien quyet cho cap Thanh pho/Tinh " + "phai la cap Truong (School).",
                        "invalid_prerequisite_level"
                    );
                }
                break;
            case AwardLevel.Central:
                if (!prerequisiteCampaignId.HasValue)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Chien dich cap Trung uong (Central) bat buoc "
                            + "phai chon chien dich dieu kien tien quyet cap Thanh pho/Tinh (City).",
                        "missing_prerequisite_central"
                    );
                }
                var centralPrereq =
                    await campaignRepository.GetByIdAsync(prerequisiteCampaignId.Value, cancellationToken: ct)
                    ?? throw new UseCaseException(
                        ApplicationErrorKind.NotFound,
                        "Khong tim thay chien dich dieu kien tien quyet.",
                        "prerequisite_not_found"
                    );
                if (centralPrereq.Level != AwardLevel.City)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Chien dich dieu kien tien quyet cho cap Trung uong " + "phai la cap Thanh pho/Tinh (City).",
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

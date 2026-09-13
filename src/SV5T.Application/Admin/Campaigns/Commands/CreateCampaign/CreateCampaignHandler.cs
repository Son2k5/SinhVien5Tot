using MediatR;
using SV5T.Application.Admin.Dtos;
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
    ICurrentUser currentUser
) : IRequestHandler<CreateCampaignCommand, CampaignDetailResponse>
{
    public async Task<CampaignDetailResponse> Handle(CreateCampaignCommand request, CancellationToken cancellationToken)
    {
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
                $"Tên chiến dịch '{request.Request.Name.Trim()}' đã tồn tại trong năm học '{request.Request.SchoolYear.Trim()}'.",
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
                "Không tìm thấy bộ tiêu chuẩn được gắn vào đợt xét.",
                "standard_set_not_found"
            );

        if (standardSet.Status != StandardSetStatus.Published)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Bộ tiêu chuẩn gắn vào đợt xét bắt buộc phải ở trạng thái đã công bố (Published).",
                "standard_set_not_published"
            );
        }

        if (standardSet.Level != request.Request.Level || standardSet.AwardType != request.Request.AwardType)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Cấp xét duyệt hoặc Loại danh hiệu của bộ tiêu chuẩn không khớp với chiến dịch.",
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
                        "Chiến dịch cấp Trường (School) là cấp cơ sở, không được gắn chiến dịch tiên quyết.",
                        "invalid_prerequisite_school"
                    );
                }
                break;
            case AwardLevel.City:
                if (!prerequisiteCampaignId.HasValue)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Chiến dịch cấp Thành phố/Tỉnh (City) bắt buộc phải chọn chiến dịch điều kiện tiên quyết cấp Trường (School).",
                        "missing_prerequisite_city"
                    );
                }
                var cityPrereq =
                    await campaignRepository.GetByIdAsync(prerequisiteCampaignId.Value, cancellationToken: ct)
                    ?? throw new UseCaseException(
                        ApplicationErrorKind.NotFound,
                        "Không tìm thấy chiến dịch điều kiện tiên quyết.",
                        "prerequisite_not_found"
                    );
                if (cityPrereq.Level != AwardLevel.School)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Chiến dịch điều kiện tiên quyết cho cấp Thành phố/Tỉnh phải là cấp Trường (School).",
                        "invalid_prerequisite_level"
                    );
                }
                break;
            case AwardLevel.Central:
                if (!prerequisiteCampaignId.HasValue)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Chiến dịch cấp Trung ương (Central) bắt buộc phải chọn chiến dịch điều kiện tiên quyết cấp Thành phố/Tỉnh (City).",
                        "missing_prerequisite_central"
                    );
                }
                var centralPrereq =
                    await campaignRepository.GetByIdAsync(prerequisiteCampaignId.Value, cancellationToken: ct)
                    ?? throw new UseCaseException(
                        ApplicationErrorKind.NotFound,
                        "Không tìm thấy chiến dịch điều kiện tiên quyết.",
                        "prerequisite_not_found"
                    );
                if (centralPrereq.Level != AwardLevel.City)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Chiến dịch điều kiện tiên quyết cho cấp Trung ương phải là cấp Thành phố/Tỉnh (City).",
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
            "Không xác định được danh tính người dùng hiện tại."
        );
}

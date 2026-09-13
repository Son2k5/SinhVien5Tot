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

namespace SV5T.Application.Admin.Campaigns.Commands.UpdateCampaign;

public sealed class UpdateCampaignHandler(
    ICampaignRepository campaignRepository,
    IStandardSetRepository standardSetRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser
) : IRequestHandler<UpdateCampaignCommand, CampaignDetailResponse>
{
    public async Task<CampaignDetailResponse> Handle(UpdateCampaignCommand request, CancellationToken cancellationToken)
    {
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
                "Không tìm thấy chiến dịch.",
                "campaign_not_found"
            );
        if (campaign.Status is CampaignStatus.Closed or CampaignStatus.Archived)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể chỉnh sửa chiến dịch đã đóng hoặc đã lưu trữ.",
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
                        "Chiến dịch cấp Trường (School) là cấp cơ sở, không được gắn chiến dịch tiên quyết.",
                        "invalid_prerequisite_school"
                    );
                }

                break;

            case AwardLevel.City:
                if (!prerequisiteId.HasValue)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Chiến dịch cấp Thành phố/Tỉnh (City) bắt buộc phải chọn chiến dịch điều kiện tiên quyết cấp Trường (School).",
                        "missing_prerequisite_city"
                    );
                }

                var cityPrereq =
                    await campaignRepository.GetByIdAsync(prerequisiteId.Value, cancellationToken: ct)
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
                if (!prerequisiteId.HasValue)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Chiến dịch cấp Trung ương (Central) bắt buộc phải chọn chiến dịch điều kiện tiên quyết cấp Thành phố/Tỉnh (City).",
                        "missing_prerequisite_central"
                    );
                }

                var centralPrereq =
                    await campaignRepository.GetByIdAsync(prerequisiteId.Value, cancellationToken: ct)
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

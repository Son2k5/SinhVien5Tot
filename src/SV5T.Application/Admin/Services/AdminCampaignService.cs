using FluentValidation;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Campaigns.Abstractions;
using SV5T.Application.Common;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Campaigns.Enums;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Admin.Services;

public interface IAdminCampaignService
{
    Task<IReadOnlyList<CampaignResponse>> GetAllAsync(
        AwardLevel? level = null,
        CampaignStatus? status = null,
        string? schoolYear = null,
        CancellationToken cancellationToken = default);

    Task<PagedResponse<CampaignResponse>> GetPagedAsync(
        AwardLevel? level,
        CampaignStatus? status,
        string? schoolYear,
        int pageIndex,
        int pageSize,
        CancellationToken cancellationToken = default);

    Task<CampaignDetailResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<CampaignDetailResponse> CreateAsync(
        CreateCampaignRequest request,
        CancellationToken cancellationToken = default);

    Task<CampaignDetailResponse> UpdateAsync(
        Guid id,
        UpdateCampaignRequest request,
        CancellationToken cancellationToken = default);

    Task<CampaignDetailResponse> UpdateStatusAsync(
        Guid id,
        UpdateCampaignStatusRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default);
}

public sealed class AdminCampaignService(
    ICampaignRepository campaignRepository,
    IStandardSetRepository standardSetRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    IValidator<CreateCampaignRequest> createCampaignValidator,
    IValidator<UpdateCampaignRequest> updateCampaignValidator)
    : IAdminCampaignService
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    public async Task<IReadOnlyList<CampaignResponse>> GetAllAsync(
        AwardLevel? level = null,
        CampaignStatus? status = null,
        string? schoolYear = null,
        CancellationToken cancellationToken = default)
    {
        var campaigns = await campaignRepository.GetAllAsync(level, status, schoolYear, cancellationToken);
        return campaigns.Select(MapToResponse).ToList();
    }

    public async Task<PagedResponse<CampaignResponse>> GetPagedAsync(
        AwardLevel? level,
        CampaignStatus? status,
        string? schoolYear,
        int pageIndex,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        pageIndex = pageIndex < 1 ? 1 : pageIndex;
        pageSize = pageSize is < 1 or > MaxPageSize ? DefaultPageSize : pageSize;

        var paged = await campaignRepository.GetPagedAsync(level, status, schoolYear, pageIndex, pageSize, cancellationToken);

        return new PagedResponse<CampaignResponse>(
            paged.Items.Select(MapToResponse).ToList(),
            paged.TotalCount,
            paged.PageIndex,
            paged.PageSize,
            paged.TotalPages);
    }

    public async Task<CampaignDetailResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var campaign = await campaignRepository.GetByIdAsync(
            id,
            includeDetails: true,
            cancellationToken: cancellationToken);

        return campaign is null ? null : MapToDetailResponse(campaign);
    }

    public async Task<CampaignDetailResponse> CreateAsync(
        CreateCampaignRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidationExecutor.ValidateAsync(createCampaignValidator, request, cancellationToken);

        var actorId = RequireAdminUserId();

        // 1. Kiểm tra trùng tên chiến dịch trong cùng năm học
        var nameExists = await campaignRepository.ExistsByNameAndSchoolYearAsync(
            request.Name.Trim(),
            request.SchoolYear.Trim(),
            cancellationToken: cancellationToken);

        if (nameExists)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Tên chiến dịch '{request.Name.Trim()}' đã tồn tại trong năm học '{request.SchoolYear.Trim()}'.",
                "campaign_name_duplicate");
        }

        // 2. Validate StandardSet hợp lệ & đã Published
        var standardSet = await standardSetRepository.GetByIdAsync(
            request.StandardSetId,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn được gắn vào đợt xét.",
                "standard_set_not_found");

        if (standardSet.Status != StandardSetStatus.Published)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Bộ tiêu chuẩn gắn vào đợt xét bắt buộc phải ở trạng thái đã công bố (Published).",
                "standard_set_not_published");
        }

        if (standardSet.Level != request.Level || standardSet.AwardType != request.AwardType)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Cấp xét duyệt hoặc Loại danh hiệu của bộ tiêu chuẩn không khớp với chiến dịch.",
                "standard_set_mismatch");
        }

        // 3. Validate quy tắc 3 cấp (School -> City -> Central)
        await ValidateHierarchicalRulesAsync(request.Level, request.PrerequisiteCampaignId, cancellationToken);

        var campaign = new Campaign
        {
            Name = request.Name.Trim(),
            SchoolYear = request.SchoolYear.Trim(),
            Level = request.Level,
            AwardType = request.AwardType,
            Status = CampaignStatus.Draft,
            StandardSetId = request.StandardSetId,
            PrerequisiteCampaignId = request.PrerequisiteCampaignId,
            CollectiveEligibilityRuleJson = request.CollectiveEligibilityRuleJson,
            RegOpenAt = request.RegOpenAt,
            RegCloseAt = request.RegCloseAt,
            SubmitDeadline = request.SubmitDeadline,
            ReviewDeadline = request.ReviewDeadline,
            Description = request.Description?.Trim(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = actorId.ToString()
        };

        await campaignRepository.AddAsync(campaign, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var created = await campaignRepository.GetByIdAsync(campaign.Id, includeDetails: true, cancellationToken: cancellationToken);
        return MapToDetailResponse(created ?? campaign);
    }

    public async Task<CampaignDetailResponse> UpdateAsync(
        Guid id,
        UpdateCampaignRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidationExecutor.ValidateAsync(updateCampaignValidator, request, cancellationToken);

        var actorId = RequireAdminUserId();

        var campaign = await campaignRepository.GetByIdAsync(
            id,
            includeDetails: true,
            tracking: true,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy chiến dịch.",
                "campaign_not_found");

        if (campaign.Status is CampaignStatus.Closed or CampaignStatus.Archived)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể chỉnh sửa chiến dịch đã đóng hoặc đã lưu trữ.",
                "campaign_not_editable");
        }

        var nameExists = await campaignRepository.ExistsByNameAndSchoolYearAsync(
            request.Name.Trim(),
            request.SchoolYear.Trim(),
            excludeId: id,
            cancellationToken: cancellationToken);

        if (nameExists)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Tên chiến dịch '{request.Name.Trim()}' đã tồn tại trong năm học '{request.SchoolYear.Trim()}'.",
                "campaign_name_duplicate");
        }

        var standardSet = await standardSetRepository.GetByIdAsync(
            request.StandardSetId,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn được gắn vào đợt xét.",
                "standard_set_not_found");

        if (standardSet.Status != StandardSetStatus.Published)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Bộ tiêu chuẩn gắn vào đợt xét bắt buộc phải ở trạng thái đã công bố (Published).",
                "standard_set_not_published");
        }

        if (standardSet.Level != request.Level || standardSet.AwardType != request.AwardType)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Cấp xét duyệt hoặc Loại danh hiệu của bộ tiêu chuẩn không khớp với chiến dịch.",
                "standard_set_mismatch");
        }

        await ValidateHierarchicalRulesAsync(request.Level, request.PrerequisiteCampaignId, cancellationToken);

        campaign.Name = request.Name.Trim();
        campaign.SchoolYear = request.SchoolYear.Trim();
        campaign.Level = request.Level;
        campaign.AwardType = request.AwardType;
        campaign.StandardSetId = request.StandardSetId;
        campaign.PrerequisiteCampaignId = request.PrerequisiteCampaignId;
        campaign.CollectiveEligibilityRuleJson = request.CollectiveEligibilityRuleJson;
        campaign.RegOpenAt = request.RegOpenAt;
        campaign.RegCloseAt = request.RegCloseAt;
        campaign.SubmitDeadline = request.SubmitDeadline;
        campaign.ReviewDeadline = request.ReviewDeadline;
        campaign.Description = request.Description?.Trim();
        campaign.UpdatedAt = DateTime.UtcNow;
        campaign.UpdatedBy = actorId.ToString();

        await campaignRepository.UpdateAsync(campaign, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var updated = await campaignRepository.GetByIdAsync(id, includeDetails: true, cancellationToken: cancellationToken);
        return MapToDetailResponse(updated ?? campaign);
    }

    public async Task<CampaignDetailResponse> UpdateStatusAsync(
        Guid id,
        UpdateCampaignStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var actorId = RequireAdminUserId();

        var campaign = await campaignRepository.GetByIdAsync(
            id,
            includeDetails: true,
            tracking: true,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy chiến dịch.",
                "campaign_not_found");

        campaign.Status = request.Status;
        campaign.UpdatedAt = DateTime.UtcNow;
        campaign.UpdatedBy = actorId.ToString();

        await campaignRepository.UpdateAsync(campaign, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToDetailResponse(campaign);
    }

    public async Task DeleteAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var campaign = await campaignRepository.GetByIdAsync(
            id,
            includeDetails: true,
            tracking: true,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy chiến dịch.",
                "campaign_not_found");

        if (campaign.Status != CampaignStatus.Draft)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Chỉ có thể xóa chiến dịch đang ở trạng thái Nháp (Draft).",
                "campaign_not_deletable");
        }

        if (campaign.Applications.Count > 0)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể xóa chiến dịch đã có hồ sơ đăng ký.",
                "campaign_has_applications");
        }

        await campaignRepository.RemoveAsync(campaign, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private async Task ValidateHierarchicalRulesAsync(
        AwardLevel level,
        Guid? prerequisiteCampaignId,
        CancellationToken cancellationToken)
    {
        switch (level)
        {
            case AwardLevel.School:
                if (prerequisiteCampaignId.HasValue)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Chiến dịch cấp Trường (School) là cấp cơ sở, không được gắn chiến dịch tiên quyết (PrerequisiteCampaign).",
                        "invalid_prerequisite_school");
                }
                break;

            case AwardLevel.City:
                if (!prerequisiteCampaignId.HasValue)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Chiến dịch cấp Thành phố/Tỉnh (City) bắt buộc phải chọn chiến dịch điều kiện tiên quyết cấp Trường (School).",
                        "missing_prerequisite_city");
                }

                var cityPrereq = await campaignRepository.GetByIdAsync(prerequisiteCampaignId.Value, cancellationToken: cancellationToken)
                    ?? throw new UseCaseException(
                        ApplicationErrorKind.NotFound,
                        "Không tìm thấy chiến dịch điều kiện tiên quyết.",
                        "prerequisite_not_found");

                if (cityPrereq.Level != AwardLevel.School)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Chiến dịch điều kiện tiên quyết cho cấp Thành phố/Tỉnh phải là cấp Trường (School).",
                        "invalid_prerequisite_level");
                }
                break;

            case AwardLevel.Central:
                if (!prerequisiteCampaignId.HasValue)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Chiến dịch cấp Trung ương (Central) bắt buộc phải chọn chiến dịch điều kiện tiên quyết cấp Thành phố/Tỉnh (City).",
                        "missing_prerequisite_central");
                }

                var centralPrereq = await campaignRepository.GetByIdAsync(prerequisiteCampaignId.Value, cancellationToken: cancellationToken)
                    ?? throw new UseCaseException(
                        ApplicationErrorKind.NotFound,
                        "Không tìm thấy chiến dịch điều kiện tiên quyết.",
                        "prerequisite_not_found");

                if (centralPrereq.Level != AwardLevel.City)
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Validation,
                        "Chiến dịch điều kiện tiên quyết cho cấp Trung ương phải là cấp Thành phố/Tỉnh (City).",
                        "invalid_prerequisite_level");
                }
                break;
        }
    }

    private static CampaignResponse MapToResponse(Campaign campaign) =>
        new(
            campaign.Id,
            campaign.Name,
            campaign.SchoolYear,
            campaign.Level,
            campaign.AwardType,
            campaign.Status,
            campaign.StandardSetId,
            campaign.StandardSet?.AcademicYear,
            campaign.PrerequisiteCampaignId,
            campaign.PrerequisiteCampaign?.Name,
            campaign.RegOpenAt,
            campaign.RegCloseAt,
            campaign.SubmitDeadline,
            campaign.ReviewDeadline,
            campaign.Description,
            campaign.CreatedAt);

    private static CampaignDetailResponse MapToDetailResponse(Campaign campaign) =>
        new(
            campaign.Id,
            campaign.Name,
            campaign.SchoolYear,
            campaign.Level,
            campaign.AwardType,
            campaign.Status,
            campaign.StandardSetId,
            campaign.StandardSet?.AcademicYear,
            campaign.PrerequisiteCampaignId,
            campaign.PrerequisiteCampaign?.Name,
            campaign.CollectiveEligibilityRuleJson,
            campaign.RegOpenAt,
            campaign.RegCloseAt,
            campaign.SubmitDeadline,
            campaign.ReviewDeadline,
            campaign.Description,
            campaign.Applications.Count,
            campaign.CreatedAt);

    private Guid RequireAdminUserId() =>
        currentUser.UserId ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized,
            "Không xác định được danh tính người dùng hiện tại.");
}

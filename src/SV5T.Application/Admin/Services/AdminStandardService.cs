using FluentValidation;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Campaigns.Abstractions;
using SV5T.Application.Common;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Criteria;
using SV5T.Domain.Standards;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Admin.Services;

public interface IAdminStandardService
{
    Task<IReadOnlyList<StandardSetResponse>> GetAllAsync(
        CancellationToken cancellationToken = default);

    Task<StandardSetResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default);

    Task<StandardSetResponse> CreateAsync(
        CreateStandardSetRequest request,
        CancellationToken cancellationToken = default);

    Task<StandardSetResponse> UpdateAsync(
        Guid standardSetId,
        UpdateStandardSetRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid standardSetId,
        CancellationToken cancellationToken = default);

    Task<StandardSetResponse> PublishAsync(
        Guid standardSetId,
        CancellationToken cancellationToken = default);

    Task<StandardSetResponse> UnpublishAsync(
        Guid standardSetId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StandardResponse>> GetStandardsAsync(
        Guid standardSetId,
        CancellationToken cancellationToken = default);

    Task<StandardResponse> AddStandardAsync(
        Guid standardSetId,
        CreateStandardRequest request,
        CancellationToken cancellationToken = default);

    Task<StandardResponse> UpdateStandardAsync(
        Guid standardSetId,
        Guid standardId,
        UpdateStandardRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteStandardAsync(
        Guid standardSetId,
        Guid standardId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<StandardResponse>> InitDefaultStandardsAsync(
        Guid standardSetId,
        CancellationToken cancellationToken = default);
}

public sealed class AdminStandardService(
    IStandardSetRepository standardSetRepository,
    IStandardRepository standardRepository,
    ICampaignRepository campaignRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    IValidator<CreateStandardSetRequest> createStandardSetValidator,
    IValidator<UpdateStandardSetRequest> updateStandardSetValidator,
    IValidator<CreateStandardRequest> createStandardValidator,
    IValidator<UpdateStandardRequest> updateStandardValidator)
    : IAdminStandardService
{
    private static readonly (StandardGroupCode GroupCode, string Code, string Title, string Description, int DisplayOrder)[] DefaultIndividualStandards =
    [
        (StandardGroupCode.Ethics, "TC_DAODUC", "Đạo đức tốt", "Đánh giá về tư tưởng chính trị, đạo đức, lối sống và ý thức chấp hành pháp luật, nội quy nhà trường.", 1),
        (StandardGroupCode.Study, "TC_HOCTAP", "Học tập tốt", "Đánh giá về kết quả học tập, nghiên cứu khoa học và tinh thần học hỏi sáng tạo.", 2),
        (StandardGroupCode.Fitness, "TC_THELUC", "Thể lực tốt", "Đánh giá về rèn luyện thể chất, thể dục thể thao và chứng nhận thể lực.", 3),
        (StandardGroupCode.Volunteer, "TC_TINHNGUYEN", "Tình nguyện tốt", "Đánh giá về việc tham gia các hoạt động tình nguyện vì cộng đồng, an sinh xã hội.", 4),
        (StandardGroupCode.Integration, "TC_HOINHAP", "Hội nhập tốt", "Đánh giá về trình độ ngoại ngữ, kỹ năng mềm và các hoạt động giao lưu quốc tế.", 5)
    ];

    public async Task<IReadOnlyList<StandardSetResponse>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        var standardSets = await standardSetRepository.GetAllAsync(cancellationToken);
        return standardSets.Select(x => MapToSetResponse(x, includeStandards: false)).ToList();
    }

    public async Task<StandardSetResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var standardSet = await standardSetRepository.GetByIdAsync(
            id,
            includeStandards: true,
            includeCriteria: true,
            cancellationToken: cancellationToken);

        return standardSet is null ? null : MapToSetResponse(standardSet, includeStandards: true);
    }

    public async Task<StandardSetResponse> CreateAsync(
        CreateStandardSetRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidationExecutor.ValidateAsync(createStandardSetValidator, request, cancellationToken);

        var actorId = RequireAdminUserId();

        var exists = await standardSetRepository.ExistsByAcademicYearAndLevelAsync(
            request.AcademicYear.Trim(),
            request.Level,
            request.AwardType,
            version: 1,
            cancellationToken: cancellationToken);

        if (exists && !request.TemplateStandardSetId.HasValue)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Bộ tiêu chuẩn cho năm học '{request.AcademicYear}', cấp '{request.Level}' và loại '{request.AwardType}' đã tồn tại.",
                "standard_set_duplicate");
        }

        var standardSet = new StandardSet
        {
            AcademicYear = request.AcademicYear.Trim(),
            Level = request.Level,
            AwardType = request.AwardType,
            Status = StandardSetStatus.Draft,
            Version = 1,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = actorId.ToString()
        };

        if (request.TemplateStandardSetId.HasValue)
        {
            var source = await standardSetRepository.GetByIdAsync(
                request.TemplateStandardSetId.Value,
                includeStandards: true,
                includeCriteria: true,
                cancellationToken: cancellationToken)
                ?? throw new UseCaseException(
                    ApplicationErrorKind.NotFound,
                    "Không tìm thấy bộ tiêu chuẩn mẫu để sao chép.",
                    "standard_template_not_found");

            if (source.Level != request.Level || source.AwardType != request.AwardType)
            {
                throw new UseCaseException(
                    ApplicationErrorKind.Validation,
                    "Bộ tiêu chuẩn mẫu phải có cùng Cấp xét duyệt (Level) và Loại danh hiệu (AwardType).",
                    "invalid_standard_template");
            }

            standardSet.PreviousVersionId = source.Id;
            standardSet.Standards = CloneStandards(source.Standards, standardSet.Id, actorId);
        }
        else if (request.AwardType == AwardType.Individual)
        {
            // Tự động tạo 5 tiêu chuẩn chuẩn cho danh hiệu cá nhân
            var now = DateTime.UtcNow;
            standardSet.Standards = DefaultIndividualStandards.Select(def => new Standard
            {
                StandardSetId = standardSet.Id,
                GroupCode = def.GroupCode,
                Code = def.Code,
                Title = def.Title,
                Description = def.Description,
                DisplayOrder = def.DisplayOrder,
                Operator = CriterionOperator.All,
                CreatedAt = now,
                CreatedBy = actorId.ToString()
            }).ToList();
        }

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            await standardSetRepository.AddAsync(standardSet, ct);
            await unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return MapToSetResponse(standardSet, includeStandards: true);
    }

    public async Task<StandardSetResponse> UpdateAsync(
        Guid standardSetId,
        UpdateStandardSetRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidationExecutor.ValidateAsync(updateStandardSetValidator, request, cancellationToken);

        var actorId = RequireAdminUserId();

        var standardSet = await standardSetRepository.GetByIdAsync(
            standardSetId,
            includeStandards: true,
            includeCriteria: true,
            tracking: true,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn.",
                "standard_set_not_found");

        if (standardSet.Status != StandardSetStatus.Draft)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Chỉ có thể chỉnh sửa thông tin bộ tiêu chuẩn đang ở trạng thái Nháp (Draft).",
                "standard_set_not_editable");
        }

        var exists = await standardSetRepository.ExistsByAcademicYearAndLevelAsync(
            request.AcademicYear.Trim(),
            request.Level,
            request.AwardType,
            standardSet.Version,
            excludeId: standardSet.Id,
            cancellationToken: cancellationToken);

        if (exists)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Đã tồn tại bộ tiêu chuẩn cho năm học '{request.AcademicYear}', cấp '{request.Level}' và loại '{request.AwardType}'.",
                "standard_set_duplicate");
        }

        standardSet.AcademicYear = request.AcademicYear.Trim();
        standardSet.Level = request.Level;
        standardSet.AwardType = request.AwardType;
        standardSet.UpdatedAt = DateTime.UtcNow;
        standardSet.UpdatedBy = actorId.ToString();

        await standardSetRepository.UpdateAsync(standardSet, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToSetResponse(standardSet, includeStandards: true);
    }

    public async Task DeleteAsync(
        Guid standardSetId,
        CancellationToken cancellationToken = default)
    {
        var standardSet = await standardSetRepository.GetByIdAsync(
            standardSetId,
            includeStandards: true,
            includeCriteria: true,
            tracking: true,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn.",
                "standard_set_not_found");

        if (standardSet.Status != StandardSetStatus.Draft)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể xóa bộ tiêu chuẩn đã công bố hoặc đang sử dụng.",
                "standard_set_not_deletable");
        }

        await standardSetRepository.RemoveAsync(standardSet, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<StandardSetResponse> PublishAsync(
        Guid standardSetId,
        CancellationToken cancellationToken = default)
    {
        var standardSet = await standardSetRepository.GetByIdAsync(
            standardSetId,
            includeStandards: true,
            includeCriteria: true,
            tracking: true,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn.",
                "standard_set_not_found");

        if (standardSet.Status != StandardSetStatus.Draft)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Chỉ có thể công bố bộ tiêu chuẩn đang ở trạng thái Nháp (Draft).",
                "standard_set_not_draft");
        }

        if (standardSet.AwardType == AwardType.Individual)
        {
            var requiredGroups = new[]
            {
                StandardGroupCode.Ethics,
                StandardGroupCode.Study,
                StandardGroupCode.Fitness,
                StandardGroupCode.Volunteer,
                StandardGroupCode.Integration
            };

            if (requiredGroups.Any(group => !standardSet.Standards.Any(x => x.GroupCode == group)))
            {
                throw new UseCaseException(
                    ApplicationErrorKind.Validation,
                    "Bộ tiêu chuẩn cá nhân phải có đầy đủ 5 tiêu chuẩn gốc (Đạo đức, Học tập, Thể lực, Tình nguyện, Hội nhập).",
                    "missing_standard_groups");
            }
        }

        var actorId = RequireAdminUserId();
        var now = DateTime.UtcNow;

        standardSet.Status = StandardSetStatus.Published;
        standardSet.PublishedAt = now;
        standardSet.UpdatedAt = now;
        standardSet.UpdatedBy = actorId.ToString();

        await standardSetRepository.UpdateAsync(standardSet, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToSetResponse(standardSet, includeStandards: true);
    }

    public async Task<StandardSetResponse> UnpublishAsync(
        Guid standardSetId,
        CancellationToken cancellationToken = default)
    {
        var standardSet = await standardSetRepository.GetByIdAsync(
            standardSetId,
            includeStandards: true,
            includeCriteria: true,
            tracking: true,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn.",
                "standard_set_not_found");

        if (standardSet.Status != StandardSetStatus.Published)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Chỉ có thể hoàn lại bộ tiêu chuẩn đang ở trạng thái Đã công bố (Published).",
                "standard_set_not_published");
        }

        // Check if any campaign is currently using this standard set
        var allCampaigns = await campaignRepository.GetAllAsync(cancellationToken: cancellationToken);
        var usingCampaign = allCampaigns.FirstOrDefault(c => c.StandardSetId == standardSetId);
        if (usingCampaign is not null)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Không thể hủy công bố vì bộ tiêu chuẩn đang được sử dụng bởi chiến dịch '{usingCampaign.Name}'. Vui lòng gỡ hoặc chỉnh sửa chiến dịch trước.",
                "standard_set_in_use");
        }

        var actorId = RequireAdminUserId();
        var now = DateTime.UtcNow;

        standardSet.Status = StandardSetStatus.Draft;
        standardSet.PublishedAt = null;
        standardSet.UpdatedAt = now;
        standardSet.UpdatedBy = actorId.ToString();

        await standardSetRepository.UpdateAsync(standardSet, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToSetResponse(standardSet, includeStandards: true);
    }

    // ==========================================
    // Standard Management Operations
    // ==========================================

    public async Task<IReadOnlyList<StandardResponse>> GetStandardsAsync(
        Guid standardSetId,
        CancellationToken cancellationToken = default)
    {
        var standards = await standardRepository.GetByStandardSetIdAsync(
            standardSetId,
            includeCriteria: true,
            cancellationToken: cancellationToken);

        return standards.Select(MapToStandardResponse).ToList();
    }

    public async Task<StandardResponse> AddStandardAsync(
        Guid standardSetId,
        CreateStandardRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidationExecutor.ValidateAsync(createStandardValidator, request, cancellationToken);

        var standardSet = await standardSetRepository.GetByIdAsync(
            standardSetId,
            tracking: false,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn.",
                "standard_set_not_found");

        if (standardSet.Status != StandardSetStatus.Draft)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể thêm tiêu chuẩn vào bộ tiêu chuẩn đã công bố (Published).",
                "standard_set_not_editable");
        }

        string finalCode = request.Code?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(finalCode))
        {
            finalCode = request.GroupCode switch
            {
                StandardGroupCode.Ethics => "TC_DAODUC",
                StandardGroupCode.Study => "TC_HOCTAP",
                StandardGroupCode.Fitness => "TC_THELUC",
                StandardGroupCode.Volunteer => "TC_TINHNGUYEN",
                StandardGroupCode.Integration => "TC_HOINHAP",
                _ => $"TC_STD_{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}"
            };
        }

        var codeExists = await standardRepository.ExistsCodeInStandardSetAsync(
            standardSetId,
            finalCode,
            cancellationToken: cancellationToken);

        if (codeExists)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Mã tiêu chuẩn '{finalCode}' đã tồn tại trong bộ tiêu chuẩn này.",
                "standard_code_duplicate");
        }

        var actorId = RequireAdminUserId();
        var standard = new Standard
        {
            StandardSetId = standardSetId,
            GroupCode = request.GroupCode,
            Code = finalCode,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            DisplayOrder = request.DisplayOrder,
            Operator = request.Operator,
            MinimumSatisfied = request.MinimumSatisfied,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = actorId.ToString()
        };

        await standardRepository.AddAsync(standard, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToStandardResponse(standard);
    }

    public async Task<StandardResponse> UpdateStandardAsync(
        Guid standardSetId,
        Guid standardId,
        UpdateStandardRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidationExecutor.ValidateAsync(updateStandardValidator, request, cancellationToken);

        var standardSet = await standardSetRepository.GetByIdAsync(
            standardSetId,
            tracking: false,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn.",
                "standard_set_not_found");

        if (standardSet.Status != StandardSetStatus.Draft)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể chỉnh sửa tiêu chuẩn của bộ tiêu chuẩn đã công bố (Published).",
                "standard_set_not_editable");
        }

        var standard = await standardRepository.GetByIdAsync(
            standardId,
            includeCriteria: true,
            tracking: true,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy tiêu chuẩn.",
                "standard_not_found");

        if (standard.StandardSetId != standardSetId)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Tiêu chuẩn không thuộc bộ tiêu chuẩn được chỉ định.",
                "invalid_standard_scope");
        }

        if (!string.IsNullOrWhiteSpace(request.Code) &&
            !string.Equals(standard.Code, request.Code.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            var codeExists = await standardRepository.ExistsCodeInStandardSetAsync(
                standardSetId,
                request.Code.Trim(),
                excludeId: standardId,
                cancellationToken: cancellationToken);

            if (codeExists)
            {
                throw new UseCaseException(
                    ApplicationErrorKind.Conflict,
                    $"Mã tiêu chuẩn '{request.Code.Trim()}' đã tồn tại trong bộ tiêu chuẩn này.",
                    "standard_code_duplicate");
            }

            standard.Code = request.Code.Trim();
        }

        var actorId = RequireAdminUserId();
        standard.GroupCode = request.GroupCode;
        standard.Title = request.Title.Trim();
        standard.Description = request.Description?.Trim();
        standard.DisplayOrder = request.DisplayOrder;
        standard.Operator = request.Operator;
        standard.MinimumSatisfied = request.MinimumSatisfied;
        standard.UpdatedAt = DateTime.UtcNow;
        standard.UpdatedBy = actorId.ToString();

        await standardRepository.UpdateAsync(standard, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToStandardResponse(standard);
    }

    public async Task DeleteStandardAsync(
        Guid standardSetId,
        Guid standardId,
        CancellationToken cancellationToken = default)
    {
        var standardSet = await standardSetRepository.GetByIdAsync(
            standardSetId,
            tracking: false,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn.",
                "standard_set_not_found");

        if (standardSet.Status != StandardSetStatus.Draft)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể xóa tiêu chuẩn của bộ tiêu chuẩn đã công bố (Published).",
                "standard_set_not_editable");
        }

        var standard = await standardRepository.GetByIdAsync(
            standardId,
            tracking: true,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy tiêu chuẩn.",
                "standard_not_found");

        if (standard.StandardSetId != standardSetId)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Tiêu chuẩn không thuộc bộ tiêu chuẩn được chỉ định.",
                "invalid_standard_scope");
        }

        await standardRepository.RemoveAsync(standard, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<StandardResponse>> InitDefaultStandardsAsync(
        Guid standardSetId,
        CancellationToken cancellationToken = default)
    {
        var standardSet = await standardSetRepository.GetByIdAsync(
            standardSetId,
            includeStandards: true,
            tracking: true,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn.",
                "standard_set_not_found");

        if (standardSet.Status != StandardSetStatus.Draft)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể khởi tạo tiêu chuẩn cho bộ tiêu chuẩn đã công bố.",
                "standard_set_not_editable");
        }

        var existingGroupCodes = standardSet.Standards
            .Where(s => s.GroupCode.HasValue)
            .Select(s => s.GroupCode!.Value)
            .ToHashSet();

        var actorId = RequireAdminUserId();
        var now = DateTime.UtcNow;
        var createdList = new List<Standard>();

        foreach (var def in DefaultIndividualStandards)
        {
            if (!existingGroupCodes.Contains(def.GroupCode))
            {
                var std = new Standard
                {
                    StandardSetId = standardSetId,
                    GroupCode = def.GroupCode,
                    Code = def.Code,
                    Title = def.Title,
                    Description = def.Description,
                    DisplayOrder = def.DisplayOrder,
                    Operator = CriterionOperator.All,
                    CreatedAt = now,
                    CreatedBy = actorId.ToString()
                };

                await standardRepository.AddAsync(std, cancellationToken);
                createdList.Add(std);
            }
        }

        await unitOfWork.SaveChangesAsync(cancellationToken);

        var allStandards = await standardRepository.GetByStandardSetIdAsync(
            standardSetId,
            includeCriteria: true,
            cancellationToken: cancellationToken);

        return allStandards.Select(MapToStandardResponse).ToList();
    }

    // ==========================================
    // Helper Methods & Mappings
    // ==========================================

    private static List<Standard> CloneStandards(
        IEnumerable<Standard> sourceStandards,
        Guid newStandardSetId,
        Guid actorId)
    {
        var now = DateTime.UtcNow;
        var result = new List<Standard>();

        foreach (var sourceStd in sourceStandards)
        {
            var newStdId = Guid.NewGuid();
            var std = new Standard
            {
                Id = newStdId,
                StandardSetId = newStandardSetId,
                GroupCode = sourceStd.GroupCode,
                Code = sourceStd.Code,
                Title = sourceStd.Title,
                Description = sourceStd.Description,
                DisplayOrder = sourceStd.DisplayOrder,
                Operator = sourceStd.Operator,
                MinimumSatisfied = sourceStd.MinimumSatisfied,
                CreatedAt = now,
                CreatedBy = actorId.ToString()
            };

            var idMap = sourceStd.Criteria.ToDictionary(x => x.Id, _ => Guid.NewGuid());
            std.Criteria = sourceStd.Criteria.Select(x =>
            {
                Guid? mappedParentId = null;
                if (x.ParentCriterionId.HasValue)
                {
                    if (idMap.TryGetValue(x.ParentCriterionId.Value, out var parentNewId))
                    {
                        mappedParentId = parentNewId;
                    }
                }

                return new Criterion
                {
                    Id = idMap[x.Id],
                    StandardId = newStdId,
                    ParentCriterionId = mappedParentId,
                    Type = x.Type,
                    Code = x.Code,
                    Title = x.Title,
                    Description = x.Description,
                    DisplayOrder = x.DisplayOrder,
                    Operator = x.Operator,
                    MinimumSatisfied = x.MinimumSatisfied,
                    EvaluationType = x.EvaluationType,
                    DefinitionJson = x.DefinitionJson,
                    ReviewGuidance = x.ReviewGuidance,
                    CreatedAt = now,
                    CreatedBy = actorId.ToString()
                };
            }).ToList();

            result.Add(std);
        }

        return result;
    }

    public static StandardSetResponse MapToSetResponse(StandardSet standardSet, bool includeStandards) =>
        new(
            standardSet.Id,
            standardSet.AcademicYear,
            standardSet.Level,
            standardSet.AwardType,
            standardSet.Status,
            standardSet.Version,
            standardSet.PreviousVersionId,
            standardSet.CreatedAt,
            standardSet.PublishedAt,
            includeStandards ? standardSet.Standards.OrderBy(x => x.DisplayOrder).Select(MapToStandardResponse).ToList() : null);

    public static StandardResponse MapToStandardResponse(Standard standard) =>
        new(
            standard.Id,
            standard.StandardSetId,
            standard.GroupCode,
            standard.Code,
            standard.Title,
            standard.Description,
            standard.DisplayOrder,
            standard.Operator,
            standard.MinimumSatisfied,
            standard.Criteria?.OrderBy(x => x.DisplayOrder).Select(MapToCriterionResponse).ToList());

    public static CriterionResponse MapToCriterionResponse(Criterion criterion) =>
        new(
            criterion.Id,
            criterion.StandardId,
            criterion.ParentCriterionId,
            criterion.Type,
            criterion.Code,
            criterion.Title,
            criterion.Description,
            criterion.DisplayOrder,
            criterion.Operator,
            criterion.MinimumSatisfied,
            criterion.EvaluationType,
            criterion.DefinitionJson,
            criterion.ReviewGuidance);

    private Guid RequireAdminUserId() =>
        currentUser.UserId ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized,
            "Không xác định được danh tính người dùng hiện tại.");
}

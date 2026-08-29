using FluentValidation;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Common;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Criteria.Abstractions;
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

    Task<IReadOnlyList<CriterionResponse>> GetCriteriaAsync(
        Guid standardSetId,
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

    Task<CriterionResponse> AddCriterionAsync(
        Guid standardSetId,
        CreateCriterionRequest request,
        CancellationToken cancellationToken = default);

    Task<CriterionResponse> UpdateCriterionAsync(
        Guid standardSetId,
        Guid criterionId,
        UpdateCriterionRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteCriterionAsync(
        Guid standardSetId,
        Guid criterionId,
        CancellationToken cancellationToken = default);
}

public sealed class AdminStandardService(
    IStandardSetRepository standardSetRepository,
    ICriterionRepository criterionRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    IValidator<CreateStandardSetRequest> createStandardSetValidator,
    IValidator<UpdateStandardSetRequest> updateStandardSetValidator,
    IValidator<CreateCriterionRequest> createCriterionValidator,
    IValidator<UpdateCriterionRequest> updateCriterionValidator)
    : IAdminStandardService
{
    public async Task<IReadOnlyList<StandardSetResponse>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        var standardSets = await standardSetRepository.GetAllAsync(cancellationToken);
        return standardSets.Select(x => MapToResponse(x, includeCriteria: false)).ToList();
    }

    public async Task<StandardSetResponse?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var standardSet = await standardSetRepository.GetByIdAsync(
            id,
            includeCriteria: true,
            cancellationToken: cancellationToken);

        return standardSet is null ? null : MapToResponse(standardSet, includeCriteria: true);
    }

    public async Task<IReadOnlyList<CriterionResponse>> GetCriteriaAsync(
        Guid standardSetId,
        CancellationToken cancellationToken = default)
    {
        var criteria = await criterionRepository.GetByStandardSetIdAsync(standardSetId, cancellationToken);
        return criteria.Select(MapToResponse).ToList();
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
            standardSet.Criteria = CloneCriteria(source.Criteria, standardSet.Id, actorId);
        }

        await unitOfWork.ExecuteInTransactionAsync(async ct =>
        {
            await standardSetRepository.AddAsync(standardSet, ct);
            await unitOfWork.SaveChangesAsync(ct);
        }, cancellationToken);

        return MapToResponse(standardSet, includeCriteria: true);
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

        return MapToResponse(standardSet, includeCriteria: true);
    }

    public async Task DeleteAsync(
        Guid standardSetId,
        CancellationToken cancellationToken = default)
    {
        var standardSet = await standardSetRepository.GetByIdAsync(
            standardSetId,
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

            if (requiredGroups.Any(group =>
                !standardSet.Criteria.Any(x =>
                    x.Type == CriterionType.Group &&
                    x.ParentCriterionId == null &&
                    x.GroupCode == group)))
            {
                throw new UseCaseException(
                    ApplicationErrorKind.Validation,
                    "Bộ tiêu chuẩn cá nhân phải có đầy đủ 5 nhóm tiêu chuẩn gốc (Đạo đức, Học tập, Thể lực, Tình nguyện, Hội nhập).",
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

        return MapToResponse(standardSet, includeCriteria: true);
    }

    public async Task<CriterionResponse> AddCriterionAsync(
        Guid standardSetId,
        CreateCriterionRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidationExecutor.ValidateAsync(createCriterionValidator, request, cancellationToken);

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
                "Không thể thêm tiêu chí vào bộ tiêu chuẩn đã công bố (Published).",
                "standard_set_not_editable");
        }

        var codeExists = await criterionRepository.ExistsCodeInStandardSetAsync(
            standardSetId,
            request.Code.Trim(),
            cancellationToken: cancellationToken);

        if (codeExists)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Mã tiêu chí '{request.Code.Trim()}' đã tồn tại trong bộ tiêu chuẩn này.",
                "criterion_code_duplicate");
        }

        if (request.ParentCriterionId.HasValue)
        {
            var parent = await criterionRepository.GetByIdAsync(
                request.ParentCriterionId.Value,
                cancellationToken: cancellationToken);

            if (parent is null || parent.StandardSetId != standardSetId || parent.Type != CriterionType.Group)
            {
                throw new UseCaseException(
                    ApplicationErrorKind.Validation,
                    "Tiêu chí cha không hợp lệ hoặc không thuộc loại Nhóm (Group).",
                    "invalid_parent_criterion");
            }
        }

        var actorId = RequireAdminUserId();

        var criterion = new Criterion
        {
            StandardSetId = standardSetId,
            ParentCriterionId = request.ParentCriterionId,
            Type = request.Type,
            GroupCode = request.GroupCode,
            Code = request.Code.Trim(),
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            DisplayOrder = request.DisplayOrder,
            Operator = request.Operator,
            MinimumSatisfied = request.MinimumSatisfied,
            EvaluationType = request.EvaluationType,
            DefinitionJson = request.DefinitionJson,
            ReviewGuidance = request.ReviewGuidance?.Trim(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = actorId.ToString()
        };

        await criterionRepository.AddAsync(criterion, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(criterion);
    }

    public async Task<CriterionResponse> UpdateCriterionAsync(
        Guid standardSetId,
        Guid criterionId,
        UpdateCriterionRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidationExecutor.ValidateAsync(updateCriterionValidator, request, cancellationToken);

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
                "Không thể chỉnh sửa tiêu chí của bộ tiêu chuẩn đã công bố (Published).",
                "standard_set_not_editable");
        }

        var criterion = await criterionRepository.GetByIdAsync(
            criterionId,
            tracking: true,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy tiêu chí.",
                "criterion_not_found");

        if (criterion.StandardSetId != standardSetId)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Tiêu chí không thuộc bộ tiêu chuẩn được chỉ định.",
                "invalid_criterion_scope");
        }

        var codeExists = await criterionRepository.ExistsCodeInStandardSetAsync(
            standardSetId,
            request.Code.Trim(),
            excludeId: criterionId,
            cancellationToken: cancellationToken);

        if (codeExists)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Mã tiêu chí '{request.Code.Trim()}' đã được sử dụng bởi tiêu chí khác.",
                "criterion_code_duplicate");
        }

        if (request.ParentCriterionId.HasValue)
        {
            if (request.ParentCriterionId.Value == criterionId)
            {
                throw new UseCaseException(
                    ApplicationErrorKind.Validation,
                    "Tiêu chí không thể tự làm cha của chính mình.",
                    "self_referencing_criterion");
            }

            var parent = await criterionRepository.GetByIdAsync(
                request.ParentCriterionId.Value,
                cancellationToken: cancellationToken);

            if (parent is null || parent.StandardSetId != standardSetId || parent.Type != CriterionType.Group)
            {
                throw new UseCaseException(
                    ApplicationErrorKind.Validation,
                    "Tiêu chí cha không hợp lệ hoặc không thuộc loại Nhóm (Group).",
                    "invalid_parent_criterion");
            }
        }

        var actorId = RequireAdminUserId();

        criterion.ParentCriterionId = request.ParentCriterionId;
        criterion.Type = request.Type;
        criterion.GroupCode = request.GroupCode;
        criterion.Code = request.Code.Trim();
        criterion.Title = request.Title.Trim();
        criterion.Description = request.Description?.Trim();
        criterion.DisplayOrder = request.DisplayOrder;
        criterion.Operator = request.Operator;
        criterion.MinimumSatisfied = request.MinimumSatisfied;
        criterion.EvaluationType = request.EvaluationType;
        criterion.DefinitionJson = request.DefinitionJson;
        criterion.ReviewGuidance = request.ReviewGuidance?.Trim();
        criterion.UpdatedAt = DateTime.UtcNow;
        criterion.UpdatedBy = actorId.ToString();

        await criterionRepository.UpdateAsync(criterion, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return MapToResponse(criterion);
    }

    public async Task DeleteCriterionAsync(
        Guid standardSetId,
        Guid criterionId,
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
                "Không thể xóa tiêu chí của bộ tiêu chuẩn đã công bố (Published).",
                "standard_set_not_editable");
        }

        var criterion = await criterionRepository.GetByIdAsync(
            criterionId,
            tracking: true,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy tiêu chí.",
                "criterion_not_found");

        if (criterion.StandardSetId != standardSetId)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Tiêu chí không thuộc bộ tiêu chuẩn được chỉ định.",
                "invalid_criterion_scope");
        }

        // Lấy tất cả tiêu chí của StandardSet để xóa đệ quy cây con nếu có
        var allCriteria = await criterionRepository.GetByStandardSetIdAsync(standardSetId, cancellationToken);
        var toDeleteIds = new HashSet<Guid> { criterionId };

        void CollectDescendantIds(Guid parentId)
        {
            foreach (var child in allCriteria.Where(x => x.ParentCriterionId == parentId))
            {
                if (toDeleteIds.Add(child.Id))
                {
                    CollectDescendantIds(child.Id);
                }
            }
        }

        CollectDescendantIds(criterionId);
        var criteriaToDelete = allCriteria.Where(x => toDeleteIds.Contains(x.Id)).ToList();

        await criterionRepository.RemoveRangeAsync(criteriaToDelete, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static List<Criterion> CloneCriteria(
        IEnumerable<Criterion> sourceCriteria,
        Guid newStandardSetId,
        Guid actorId)
    {
        var idMap = sourceCriteria.ToDictionary(x => x.Id, _ => Guid.NewGuid());
        var now = DateTime.UtcNow;

        return sourceCriteria.Select(x =>
        {
            Guid? mappedParentId = null;

            if (x.ParentCriterionId.HasValue)
            {
                if (!idMap.TryGetValue(x.ParentCriterionId.Value, out var parentNewId))
                {
                    throw new UseCaseException(
                        ApplicationErrorKind.Conflict,
                        "Dữ liệu cây tiêu chí của bộ mẫu không hợp lệ (tiêu chí cha không tồn tại trong bộ mẫu).",
                        "invalid_template_criteria_tree");
                }

                mappedParentId = parentNewId;
            }

            return new Criterion
            {
                Id = idMap[x.Id],
                StandardSetId = newStandardSetId,
                ParentCriterionId = mappedParentId,
                Type = x.Type,
                GroupCode = x.GroupCode,
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
    }

    public static StandardSetResponse MapToResponse(StandardSet standardSet, bool includeCriteria) =>
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
            includeCriteria ? standardSet.Criteria.OrderBy(x => x.DisplayOrder).Select(MapToResponse).ToList() : null);

    public static CriterionResponse MapToResponse(Criterion criterion) =>
        new(
            criterion.Id,
            criterion.StandardSetId,
            criterion.ParentCriterionId,
            criterion.Type,
            criterion.GroupCode,
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

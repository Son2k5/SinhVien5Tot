using FluentValidation;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Services;
using SV5T.Application.Common;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Criteria.Abstractions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Criteria;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Criteria.Services;

public sealed class CriterionService(
    IStandardRepository standardRepository,
    IStandardSetRepository standardSetRepository,
    ICriterionRepository criterionRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    IValidator<CreateCriterionRequest> createCriterionValidator,
    IValidator<UpdateCriterionRequest> updateCriterionValidator)
    : ICriterionService
{
    public async Task<IReadOnlyList<CriterionResponse>> GetCriteriaAsync(
        Guid standardId,
        CancellationToken cancellationToken = default)
    {
        var criteria = await criterionRepository.GetByStandardIdAsync(standardId, cancellationToken);
        return criteria.Select(AdminStandardService.MapToCriterionResponse).ToList();
    }

    public async Task<CriterionResponse> AddCriterionAsync(
        Guid standardId,
        CreateCriterionRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidationExecutor.ValidateAsync(createCriterionValidator, request, cancellationToken);

        var standard = await standardRepository.GetByIdAsync(
            standardId,
            tracking: false,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy tiêu chuẩn.",
                "standard_not_found");

        var standardSet = await standardSetRepository.GetByIdAsync(
            standard.StandardSetId,
            tracking: false,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn tương ứng.",
                "standard_set_not_found");

        if (standardSet.Status != StandardSetStatus.Draft)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể thêm tiêu chí vào bộ tiêu chuẩn đã công bố (Published).",
                "standard_set_not_editable");
        }

        string finalCode = request.Code?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(finalCode))
        {
            finalCode = await GenerateAutoCriterionCodeAsync(standardId, standard.Code, request, cancellationToken);
        }
        else
        {
            var codeExists = await criterionRepository.ExistsCodeInStandardAsync(
                standardId,
                finalCode,
                cancellationToken: cancellationToken);

            if (codeExists)
            {
                throw new UseCaseException(
                    ApplicationErrorKind.Conflict,
                    $"Mã tiêu chí '{finalCode}' đã tồn tại trong tiêu chuẩn này.",
                    "criterion_code_duplicate");
            }
        }

        if (request.ParentCriterionId.HasValue)
        {
            var parent = await criterionRepository.GetByIdAsync(
                request.ParentCriterionId.Value,
                cancellationToken: cancellationToken);

            if (parent is null || parent.StandardId != standardId || parent.Type != CriterionType.Group)
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
            StandardId = standardId,
            ParentCriterionId = request.ParentCriterionId,
            Type = request.Type,
            Code = finalCode,
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

        return AdminStandardService.MapToCriterionResponse(criterion);
    }

    public async Task<CriterionResponse> UpdateCriterionAsync(
        Guid standardId,
        Guid criterionId,
        UpdateCriterionRequest request,
        CancellationToken cancellationToken = default)
    {
        await ValidationExecutor.ValidateAsync(updateCriterionValidator, request, cancellationToken);

        var standard = await standardRepository.GetByIdAsync(
            standardId,
            tracking: false,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy tiêu chuẩn.",
                "standard_not_found");

        var standardSet = await standardSetRepository.GetByIdAsync(
            standard.StandardSetId,
            tracking: false,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn tương ứng.",
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

        if (criterion.StandardId != standardId)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Tiêu chí không thuộc tiêu chuẩn được chỉ định.",
                "invalid_criterion_scope");
        }

        if (!string.IsNullOrWhiteSpace(request.Code) &&
            !string.Equals(criterion.Code, request.Code.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            var codeExists = await criterionRepository.ExistsCodeInStandardAsync(
                standardId,
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

            criterion.Code = request.Code.Trim();
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

            if (parent is null || parent.StandardId != standardId || parent.Type != CriterionType.Group)
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
        if (!string.IsNullOrWhiteSpace(request.Code))
        {
            criterion.Code = request.Code.Trim();
        }
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

        return AdminStandardService.MapToCriterionResponse(criterion);
    }

    private async Task<string> GenerateAutoCriterionCodeAsync(
        Guid standardId,
        string standardCode,
        CreateCriterionRequest request,
        CancellationToken cancellationToken)
    {
        var allCriteria = await criterionRepository.GetByStandardIdAsync(standardId, cancellationToken);
        var existingCodes = allCriteria.Select(c => c.Code.ToUpperInvariant()).ToHashSet();

        var basePrefix = string.IsNullOrWhiteSpace(standardCode) ? "TC" : standardCode;

        if (!request.ParentCriterionId.HasValue)
        {
            if (request.Type == CriterionType.Group)
            {
                var optCandidate = $"{basePrefix}_GRP";
                int optIndex = 1;
                while (existingCodes.Contains(optCandidate.ToUpperInvariant()))
                {
                    optIndex++;
                    optCandidate = $"{basePrefix}_GRP{optIndex}";
                }
                return optCandidate;
            }

            int rootIndex = 1;
            while (rootIndex < 500)
            {
                var candidate = $"{basePrefix}.{rootIndex}";
                if (!existingCodes.Contains(candidate.ToUpperInvariant()))
                {
                    return candidate;
                }
                rootIndex++;
            }

            return $"{basePrefix}.{Guid.NewGuid().ToString("N")[..4]}";
        }

        var parent = allCriteria.FirstOrDefault(c => c.Id == request.ParentCriterionId.Value);
        var parentCode = parent?.Code ?? basePrefix;

        if (request.Type == CriterionType.Group)
        {
            var optCandidate = $"{parentCode}_OPT";
            int optIndex = 1;
            while (existingCodes.Contains(optCandidate.ToUpperInvariant()))
            {
                optIndex++;
                optCandidate = $"{parentCode}_OPT{optIndex}";
            }
            return optCandidate;
        }

        // Leaf criterion: Generate TC1.1, TC1.2, etc.
        int index = 1;
        while (index < 500)
        {
            var candidate = parentCode.Contains("_OPT", StringComparison.OrdinalIgnoreCase)
                ? $"{parentCode.Replace("_OPT", "")}.TC.{index}"
                : $"{parentCode}.{index}";

            if (!existingCodes.Contains(candidate.ToUpperInvariant()))
            {
                return candidate;
            }
            index++;
        }

        return $"{parentCode}.{Guid.NewGuid().ToString("N")[..4]}";
    }

    public async Task DeleteCriterionAsync(
        Guid standardId,
        Guid criterionId,
        CancellationToken cancellationToken = default)
    {
        var standard = await standardRepository.GetByIdAsync(
            standardId,
            tracking: false,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy tiêu chuẩn.",
                "standard_not_found");

        var standardSet = await standardSetRepository.GetByIdAsync(
            standard.StandardSetId,
            tracking: false,
            cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn tương ứng.",
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

        if (criterion.StandardId != standardId)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Tiêu chí không thuộc tiêu chuẩn được chỉ định.",
                "invalid_criterion_scope");
        }

        var allCriteria = await criterionRepository.GetByStandardIdAsync(standardId, cancellationToken);
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

    private Guid RequireAdminUserId() =>
        currentUser.UserId ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized,
            "Không xác định được danh tính người dùng hiện tại.");
}

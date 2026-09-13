using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Criteria.Abstractions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Criteria;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Criteria.Commands.UpdateCriterion;

public sealed class UpdateCriterionHandler(
    IStandardRepository standardRepository,
    IStandardSetRepository standardSetRepository,
    ICriterionRepository criterionRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser
) : IRequestHandler<UpdateCriterionCommand, CriterionResponse>
{
    public async Task<CriterionResponse> Handle(UpdateCriterionCommand request, CancellationToken cancellationToken)
    {
        var standard =
            await standardRepository.GetByIdAsync(request.StandardId, tracking: false, cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy tiêu chuẩn.",
                "standard_not_found");

        var standardSet =
            await standardSetRepository.GetByIdAsync(standard.StandardSetId, tracking: false, cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn tương ứng.",
                "standard_set_not_found");

        if (standardSet.Status != StandardSetStatus.Draft)
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể chỉnh sửa tiêu chí của bộ tiêu chuẩn đã công bố (Published).",
                "standard_set_not_editable");

        var criterion =
            await criterionRepository.GetByIdAsync(request.CriterionId, tracking: true, cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy tiêu chí.",
                "criterion_not_found");

        if (criterion.StandardId != request.StandardId)
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Tiêu chí không thuộc tiêu chuẩn được chỉ định.",
                "invalid_criterion_scope");

        if (!string.IsNullOrWhiteSpace(request.Request.Code) &&
            !string.Equals(criterion.Code, request.Request.Code.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            var codeExists = await criterionRepository.ExistsCodeInStandardAsync(
                request.StandardId,
                request.Request.Code.Trim(),
                excludeId: request.CriterionId,
                cancellationToken: cancellationToken);

            if (codeExists)
                throw new UseCaseException(
                    ApplicationErrorKind.Conflict,
                    $"Mã tiêu chí '{request.Request.Code.Trim()}' đã được sử dụng bởi tiêu chí khác.",
                    "criterion_code_duplicate");

            criterion.Code = request.Request.Code.Trim();
        }

        if (request.Request.ParentCriterionId.HasValue)
        {
            if (request.Request.ParentCriterionId.Value == request.CriterionId)
                throw new UseCaseException(
                    ApplicationErrorKind.Validation,
                    "Tiêu chí không thể tự làm cha của chính mình.",
                    "self_referencing_criterion");

            var parent = await criterionRepository.GetByIdAsync(
                request.Request.ParentCriterionId.Value,
                cancellationToken: cancellationToken);

            if (parent is null || parent.StandardId != request.StandardId || parent.Type != CriterionType.Group)
                throw new UseCaseException(
                    ApplicationErrorKind.Validation,
                    "Tiêu chí cha không hợp lệ hoặc không thuộc loại Nhóm (Group).",
                    "invalid_parent_criterion");
        }

        var actorId = currentUser.UserId ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized,
            "Không xác định được danh tính người dùng hiện tại.");

        criterion.ParentCriterionId = request.Request.ParentCriterionId;
        criterion.Type = request.Request.Type;
        if (!string.IsNullOrWhiteSpace(request.Request.Code))
            criterion.Code = request.Request.Code.Trim();
        criterion.Title = request.Request.Title.Trim();
        criterion.Description = request.Request.Description?.Trim();
        criterion.DisplayOrder = request.Request.DisplayOrder;
        criterion.Operator = request.Request.Operator;
        criterion.MinimumSatisfied = request.Request.MinimumSatisfied;
        criterion.EvaluationType = request.Request.EvaluationType;
        criterion.DefinitionJson = request.Request.DefinitionJson;
        criterion.ReviewGuidance = request.Request.ReviewGuidance?.Trim();
        criterion.UpdatedAt = DateTime.UtcNow;
        criterion.UpdatedBy = actorId.ToString();

        await criterionRepository.UpdateAsync(criterion, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return AdminStandardMappings.MapToCriterionResponse(criterion);
    }
}


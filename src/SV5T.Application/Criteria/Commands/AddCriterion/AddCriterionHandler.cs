using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Criteria.Abstractions;
using SV5T.Application.Criteria.Support;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Criteria;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Criteria.Commands.AddCriterion;

public sealed class AddCriterionHandler(
    IStandardRepository standardRepository,
    IStandardSetRepository standardSetRepository,
    ICriterionRepository criterionRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser
) : IRequestHandler<AddCriterionCommand, CriterionResponse>
{
    public async Task<CriterionResponse> Handle(AddCriterionCommand request, CancellationToken cancellationToken)
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
                "Không thể thêm tiêu chí vào bộ tiêu chuẩn đã công bố (Published).",
                "standard_set_not_editable");

        var finalCode = request.Request.Code?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(finalCode))
        {
            var allCriteria = await criterionRepository.GetByStandardIdAsync(request.StandardId, cancellationToken);
            var allCodes = allCriteria.Select(x => x.Code).ToList();
            string? ResolveParentCode(Guid parentId) =>
                allCriteria.FirstOrDefault(x => x.Id == parentId)?.Code;
            finalCode = CriterionCodeGenerator.GenerateAutoCode(
                standard.Code,
                new CriterionCodeGenerator.CreateCodeRequest(request.Request.ParentCriterionId, request.Request.Type),
                allCodes,
                ResolveParentCode);
        }
        else
        {
            var codeExists = await criterionRepository.ExistsCodeInStandardAsync(
                request.StandardId,
                finalCode,
                cancellationToken: cancellationToken);

            if (codeExists)
                throw new UseCaseException(
                    ApplicationErrorKind.Conflict,
                    $"Mã tiêu chí '{finalCode}' đã tồn tại trong tiêu chuẩn này.",
                    "criterion_code_duplicate");
        }

        if (request.Request.ParentCriterionId.HasValue)
        {
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

        var criterion = new Criterion
        {
            StandardId = request.StandardId,
            ParentCriterionId = request.Request.ParentCriterionId,
            Type = request.Request.Type,
            Code = finalCode,
            Title = request.Request.Title.Trim(),
            Description = request.Request.Description?.Trim(),
            DisplayOrder = request.Request.DisplayOrder,
            Operator = request.Request.Operator,
            MinimumSatisfied = request.Request.MinimumSatisfied,
            EvaluationType = request.Request.EvaluationType,
            DefinitionJson = request.Request.DefinitionJson,
            ReviewGuidance = request.Request.ReviewGuidance?.Trim(),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = actorId.ToString(),
        };

        await criterionRepository.AddAsync(criterion, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return AdminStandardMappings.MapToCriterionResponse(criterion);
    }
}


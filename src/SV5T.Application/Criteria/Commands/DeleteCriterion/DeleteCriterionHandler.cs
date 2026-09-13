using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Criteria.Abstractions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Criteria.Commands.DeleteCriterion;

public sealed class DeleteCriterionHandler(
    IStandardRepository standardRepository,
    IStandardSetRepository standardSetRepository,
    ICriterionRepository criterionRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<DeleteCriterionCommand, MediatR.Unit>
{
    public async Task<MediatR.Unit> Handle(DeleteCriterionCommand request, CancellationToken cancellationToken)
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
                "Không thể xóa tiêu chí của bộ tiêu chuẩn đã công bố (Published).",
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

        var allCriteria = await criterionRepository.GetByStandardIdAsync(request.StandardId, cancellationToken);
        var toDeleteIds = new HashSet<Guid> { request.CriterionId };

        void CollectDescendantIds(Guid parentId)
        {
            foreach (var child in allCriteria.Where(x => x.ParentCriterionId == parentId))
            {
                if (toDeleteIds.Add(child.Id))
                    CollectDescendantIds(child.Id);
            }
        }

        CollectDescendantIds(request.CriterionId);
        var criteriaToDelete = allCriteria.Where(x => toDeleteIds.Contains(x.Id)).ToList();

        await criterionRepository.RemoveRangeAsync(criteriaToDelete, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return MediatR.Unit.Value;
    }
}


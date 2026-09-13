using FluentValidation;

namespace SV5T.Application.Criteria.Commands.DeleteCriterion;

public sealed class DeleteCriterionCommandValidator : AbstractValidator<DeleteCriterionCommand>
{
    public DeleteCriterionCommandValidator()
    {
        RuleFor(x => x.StandardId).NotEmpty().WithMessage("Thiếu định danh tiêu chuẩn.");
        RuleFor(x => x.CriterionId).NotEmpty().WithMessage("Thiếu định danh tiêu chí.");
    }
}

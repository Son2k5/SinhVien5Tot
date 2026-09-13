using FluentValidation;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Criteria.Commands.UpdateCriterion;

public sealed class UpdateCriterionCommandValidator : AbstractValidator<UpdateCriterionCommand>
{
    public UpdateCriterionCommandValidator(IValidator<UpdateCriterionRequest> requestValidator)
    {
        RuleFor(x => x.StandardId).NotEmpty().WithMessage("Thiếu định danh tiêu chuẩn.");
        RuleFor(x => x.CriterionId).NotEmpty().WithMessage("Thiếu định danh tiêu chí.");
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu nội dung tiêu chí.");
        RuleFor(x => x.Request).SetValidator(requestValidator!);
    }
}

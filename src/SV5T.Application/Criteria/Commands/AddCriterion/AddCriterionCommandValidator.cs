using FluentValidation;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Criteria.Commands.AddCriterion;

public sealed class AddCriterionCommandValidator : AbstractValidator<AddCriterionCommand>
{
    public AddCriterionCommandValidator(IValidator<CreateCriterionRequest> requestValidator)
    {
        RuleFor(x => x.StandardId).NotEmpty().WithMessage("Thiếu định danh tiêu chuẩn.");
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu nội dung tiêu chí.");
        RuleFor(x => x.Request).SetValidator(requestValidator!);
    }
}

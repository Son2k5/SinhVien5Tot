using FluentValidation;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.StandardSets.Commands.AddStandard;

public sealed class AddStandardCommandValidator : AbstractValidator<AddStandardCommand>
{
    public AddStandardCommandValidator(IValidator<CreateStandardRequest> requestValidator)
    {
        RuleFor(x => x.StandardSetId).NotEmpty().WithMessage("Thiếu định danh bộ tiêu chuẩn.");
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu nội dung tiêu chuẩn.");
        RuleFor(x => x.Request).SetValidator(requestValidator!);
    }
}

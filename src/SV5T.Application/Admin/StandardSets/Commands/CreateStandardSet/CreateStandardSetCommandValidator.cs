using FluentValidation;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.StandardSets.Commands.CreateStandardSet;

public sealed class CreateStandardSetCommandValidator : AbstractValidator<CreateStandardSetCommand>
{
    public CreateStandardSetCommandValidator(IValidator<CreateStandardSetRequest> requestValidator)
    {
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu nội dung bộ tiêu chuẩn.");
        RuleFor(x => x.Request).SetValidator(requestValidator!);
    }
}

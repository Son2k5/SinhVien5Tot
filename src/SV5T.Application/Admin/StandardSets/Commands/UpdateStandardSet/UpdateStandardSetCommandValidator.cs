using FluentValidation;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.StandardSets.Commands.UpdateStandardSet;

public sealed class UpdateStandardSetCommandValidator : AbstractValidator<UpdateStandardSetCommand>
{
    public UpdateStandardSetCommandValidator(IValidator<UpdateStandardSetRequest> requestValidator)
    {
        RuleFor(x => x.StandardSetId).NotEmpty().WithMessage("Thiếu định danh bộ tiêu chuẩn.");
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu nội dung bộ tiêu chuẩn.");
        RuleFor(x => x.Request).SetValidator(requestValidator!);
    }
}

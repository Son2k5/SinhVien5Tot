using FluentValidation;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.StandardSets.Commands.UpdateStandard;

public sealed class UpdateStandardCommandValidator : AbstractValidator<UpdateStandardCommand>
{
    public UpdateStandardCommandValidator(IValidator<UpdateStandardRequest> requestValidator)
    {
        RuleFor(x => x.StandardSetId).NotEmpty().WithMessage("Thiếu định danh bộ tiêu chuẩn.");
        RuleFor(x => x.StandardId).NotEmpty().WithMessage("Thiếu định danh tiêu chuẩn.");
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu nội dung tiêu chuẩn.");
        RuleFor(x => x.Request).SetValidator(requestValidator!);
    }
}

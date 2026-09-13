using FluentValidation;

namespace SV5T.Application.Admin.StandardSets.Commands.DeleteStandard;

public sealed class DeleteStandardCommandValidator : AbstractValidator<DeleteStandardCommand>
{
    public DeleteStandardCommandValidator()
    {
        RuleFor(x => x.StandardSetId).NotEmpty().WithMessage("Thiếu định danh bộ tiêu chuẩn.");
        RuleFor(x => x.StandardId).NotEmpty().WithMessage("Thiếu định danh tiêu chuẩn.");
    }
}

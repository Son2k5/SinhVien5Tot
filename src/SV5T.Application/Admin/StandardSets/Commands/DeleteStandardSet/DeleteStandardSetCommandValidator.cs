using FluentValidation;

namespace SV5T.Application.Admin.StandardSets.Commands.DeleteStandardSet;

public sealed class DeleteStandardSetCommandValidator : AbstractValidator<DeleteStandardSetCommand>
{
    public DeleteStandardSetCommandValidator()
    {
        RuleFor(x => x.StandardSetId).NotEmpty().WithMessage("Thiếu định danh bộ tiêu chuẩn.");
    }
}

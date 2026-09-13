using FluentValidation;

namespace SV5T.Application.Admin.StandardSets.Commands.UnpublishStandardSet;

public sealed class UnpublishStandardSetCommandValidator : AbstractValidator<UnpublishStandardSetCommand>
{
    public UnpublishStandardSetCommandValidator()
    {
        RuleFor(x => x.StandardSetId).NotEmpty().WithMessage("Thiếu định danh bộ tiêu chuẩn.");
    }
}

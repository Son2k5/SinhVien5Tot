using FluentValidation;

namespace SV5T.Application.Admin.StandardSets.Commands.PublishStandardSet;

public sealed class PublishStandardSetCommandValidator : AbstractValidator<PublishStandardSetCommand>
{
    public PublishStandardSetCommandValidator()
    {
        RuleFor(x => x.StandardSetId).NotEmpty().WithMessage("Thiếu định danh bộ tiêu chuẩn.");
    }
}

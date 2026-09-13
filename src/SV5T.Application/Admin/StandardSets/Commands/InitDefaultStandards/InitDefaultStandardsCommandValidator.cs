using FluentValidation;

namespace SV5T.Application.Admin.StandardSets.Commands.InitDefaultStandards;

public sealed class InitDefaultStandardsCommandValidator : AbstractValidator<InitDefaultStandardsCommand>
{
    public InitDefaultStandardsCommandValidator()
    {
        RuleFor(x => x.StandardSetId).NotEmpty().WithMessage("Thiếu định danh bộ tiêu chuẩn.");
    }
}

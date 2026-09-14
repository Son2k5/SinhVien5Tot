using FluentValidation;

namespace SV5T.Application.Student.Applications.Commands.CreateApplication;

public sealed class CreateApplicationCommandValidator : AbstractValidator<CreateApplicationCommand>
{
    public CreateApplicationCommandValidator()
    {
        RuleFor(x => x.CampaignId).NotEmpty().WithMessage("Thieu dinh danh dot xet.");
    }
}

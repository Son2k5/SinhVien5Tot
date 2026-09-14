using FluentValidation;

namespace SV5T.Application.Student.Applications.Commands.SubmitApplication;

public sealed class SubmitApplicationCommandValidator : AbstractValidator<SubmitApplicationCommand>
{
    public SubmitApplicationCommandValidator()
    {
        RuleFor(x => x.ApplicationId).NotEmpty().WithMessage("Thieu dinh danh ho so.");
        RuleFor(x => x.RowVersion).NotEmpty().WithMessage("Thieu RowVersion de kiem soat dong thoi.");
    }
}

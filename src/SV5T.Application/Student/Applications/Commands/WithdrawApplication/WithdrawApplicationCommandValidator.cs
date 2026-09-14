using FluentValidation;

namespace SV5T.Application.Student.Applications.Commands.WithdrawApplication;

public sealed class WithdrawApplicationCommandValidator : AbstractValidator<WithdrawApplicationCommand>
{
    public WithdrawApplicationCommandValidator()
    {
        RuleFor(x => x.ApplicationId).NotEmpty().WithMessage("Thieu dinh danh ho so.");
        RuleFor(x => x.RowVersion).NotEmpty().WithMessage("Thieu RowVersion de kiem soat dong thoi.");
        RuleFor(x => x.Reason).MaximumLength(500).WithMessage("Ly do toi da 500 ky tu.");
    }
}

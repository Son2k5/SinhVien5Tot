using FluentValidation;

namespace SV5T.Application.Student.Applications.Commands.WithdrawApplication;

public sealed class WithdrawApplicationCommandValidator : AbstractValidator<WithdrawApplicationCommand>
{
    public WithdrawApplicationCommandValidator()
    {
        RuleFor(x => x.ApplicationId).NotEmpty().WithMessage("Thiếu định danh hồ sơ.");
        RuleFor(x => x.RowVersion).NotEmpty().WithMessage("Thiếu thông tin phiên bản. Vui lòng tải lại và thử lại.");
        RuleFor(x => x.Reason).MaximumLength(500).WithMessage("Lý do tối đa 500 ký tự.");
    }
}

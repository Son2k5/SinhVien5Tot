using FluentValidation;

namespace SV5T.Application.Student.Applications.Commands.SubmitApplication;

public sealed class SubmitApplicationCommandValidator : AbstractValidator<SubmitApplicationCommand>
{
    public SubmitApplicationCommandValidator()
    {
        RuleFor(x => x.ApplicationId).NotEmpty().WithMessage("Thiếu định danh hồ sơ.");
        RuleFor(x => x.RowVersion).NotEmpty().WithMessage("Thiếu thông tin phiên bản. Vui lòng tải lại và thử lại.");
    }
}

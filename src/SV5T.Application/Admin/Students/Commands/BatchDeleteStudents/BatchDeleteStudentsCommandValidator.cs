using FluentValidation;

namespace SV5T.Application.Admin.Students.Commands.BatchDeleteStudents;

public sealed class BatchDeleteStudentsCommandValidator : AbstractValidator<BatchDeleteStudentsCommand>
{
    public BatchDeleteStudentsCommandValidator()
    {
        RuleFor(x => x.Ids)
            .NotEmpty()
            .WithMessage("Danh sách ID sinh viên không được rỗng.");

        RuleFor(x => x.Confirm)
            .Equal(true)
            .WithMessage("Vui lòng xác nhận xóa sinh viên trước khi thực hiện.");

        RuleFor(x => x.Reason)
            .MaximumLength(500)
            .WithMessage("Lý do xóa không được quá 500 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Reason));
    }
}

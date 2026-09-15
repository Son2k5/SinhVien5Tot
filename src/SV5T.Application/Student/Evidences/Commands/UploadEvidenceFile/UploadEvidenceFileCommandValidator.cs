using FluentValidation;

namespace SV5T.Application.Student.Evidences.Commands.UploadEvidenceFile;

public sealed class UploadEvidenceFileCommandValidator : AbstractValidator<UploadEvidenceFileCommand>
{
    public UploadEvidenceFileCommandValidator()
    {
        RuleFor(x => x.EvidenceId).NotEmpty().WithMessage("Thiếu định danh minh chứng.");
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu tập tin minh chứng.");
        RuleFor(x => x.Request.FileName).NotEmpty().WithMessage("Thiếu tên tập tin.");
        RuleFor(x => x.Request.Length).GreaterThan(0).WithMessage("Tập tin rỗng.");
    }
}

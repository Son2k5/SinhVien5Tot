using FluentValidation;

namespace SV5T.Application.Student.Evidences.Commands.UploadEvidenceFile;

public sealed class UploadEvidenceFileCommandValidator : AbstractValidator<UploadEvidenceFileCommand>
{
    public UploadEvidenceFileCommandValidator()
    {
        RuleFor(x => x.EvidenceId).NotEmpty().WithMessage("Thieu dinh danh minh chung.");
        RuleFor(x => x.Request).NotNull().WithMessage("Thieu file minh chung.");
        RuleFor(x => x.Request.FileName).NotEmpty().WithMessage("Thieu ten file.");
        RuleFor(x => x.Request.Length).GreaterThan(0).WithMessage("File rong.");
    }
}

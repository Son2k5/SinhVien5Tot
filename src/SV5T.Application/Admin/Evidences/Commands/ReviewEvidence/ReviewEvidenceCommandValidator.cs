using FluentValidation;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.Evidences.Commands.ReviewEvidence;

public sealed class ReviewEvidenceCommandValidator : AbstractValidator<ReviewEvidenceCommand>
{
    public ReviewEvidenceCommandValidator(IValidator<ReviewEvidenceRequest> requestValidator)
    {
        RuleFor(x => x.EvidenceId).NotEmpty().WithMessage("Thiếu định danh minh chứng.");
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu thông tin kết quả đánh giá.");
        RuleFor(x => x.Request).SetValidator(requestValidator!);
    }
}

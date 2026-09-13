using FluentValidation;

namespace SV5T.Application.Admin.Evidences.Queries.GetEvidenceById;

public sealed class GetEvidenceByIdQueryValidator : AbstractValidator<GetEvidenceByIdQuery>
{
    public GetEvidenceByIdQueryValidator()
    {
        RuleFor(x => x.EvidenceId).NotEmpty().WithMessage("Thiếu định danh minh chứng.");
    }
}

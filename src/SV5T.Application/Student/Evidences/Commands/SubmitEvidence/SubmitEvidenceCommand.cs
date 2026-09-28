using FluentValidation;
using MediatR;
using SV5T.Application.Student.Dtos;

namespace SV5T.Application.Student.Evidences.Commands.SubmitEvidence;

public sealed record SubmitEvidenceCommand(Guid EvidenceId, string RowVersion) : IRequest<StudentEvidenceItemResponse>;

public sealed class SubmitEvidenceCommandValidator : AbstractValidator<SubmitEvidenceCommand>
{
    public SubmitEvidenceCommandValidator()
    {
        RuleFor(x => x.EvidenceId).NotEmpty();
        RuleFor(x => x.RowVersion).NotEmpty();
    }
}

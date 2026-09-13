using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Evidences.Common;
using SV5T.Application.Evidences.Abstractions;

namespace SV5T.Application.Admin.Evidences.Queries.GetEvidenceById;

public sealed class GetEvidenceByIdHandler(IEvidenceRepository evidenceRepository)
    : IRequestHandler<GetEvidenceByIdQuery, EvidenceResponse?>
{
    public async Task<EvidenceResponse?> Handle(GetEvidenceByIdQuery request, CancellationToken cancellationToken)
    {
        var evidence = await evidenceRepository.GetByIdAsync(request.EvidenceId, cancellationToken: cancellationToken);
        return evidence is null ? null : EvidenceReviewMappings.MapToResponse(evidence);
    }
}

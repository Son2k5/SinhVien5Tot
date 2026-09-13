using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.Evidences.Commands.ReviewEvidence;

public sealed record ReviewEvidenceCommand(
    Guid EvidenceId,
    ReviewEvidenceRequest Request
) : IRequest<EvidenceResponse>;

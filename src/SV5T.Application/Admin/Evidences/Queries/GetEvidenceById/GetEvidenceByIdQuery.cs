using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.Evidences.Queries.GetEvidenceById;

public sealed record GetEvidenceByIdQuery(Guid EvidenceId) : IRequest<EvidenceResponse?>;

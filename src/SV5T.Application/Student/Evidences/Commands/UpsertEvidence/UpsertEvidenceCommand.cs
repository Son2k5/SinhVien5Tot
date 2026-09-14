using MediatR;
using SV5T.Application.Student.Dtos;

namespace SV5T.Application.Student.Evidences.Commands.UpsertEvidence;

public sealed record UpsertEvidenceRequest(
    string DataJson,
    string? RowVersion);

public sealed record UpsertEvidenceCommand(
    Guid ApplicationId,
    Guid CriterionId,
    UpsertEvidenceRequest Request) : IRequest<StudentEvidenceItemResponse>;

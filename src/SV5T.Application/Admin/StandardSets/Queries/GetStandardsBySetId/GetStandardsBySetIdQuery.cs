using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.StandardSets.Queries.GetStandardsBySetId;

public sealed record GetStandardsBySetIdQuery(Guid StandardSetId) : IRequest<IReadOnlyList<StandardResponse>>;

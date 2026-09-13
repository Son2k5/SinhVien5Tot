using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.StandardSets.Queries.GetAllStandardSets;

public sealed record GetAllStandardSetsQuery : IRequest<IReadOnlyList<StandardSetResponse>>;

using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.StandardSets.Queries.GetStandardSetById;

public sealed record GetStandardSetByIdQuery(Guid Id) : IRequest<StandardSetResponse?>;

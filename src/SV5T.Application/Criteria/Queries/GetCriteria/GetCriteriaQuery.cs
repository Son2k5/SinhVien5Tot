using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Criteria.Queries.GetCriteria;

public sealed record GetCriteriaQuery(Guid StandardId) : IRequest<IReadOnlyList<CriterionResponse>>;

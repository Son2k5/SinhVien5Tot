using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Criteria.Commands.AddCriterion;

public sealed record AddCriterionCommand(Guid StandardId, CreateCriterionRequest Request) : IRequest<CriterionResponse>;

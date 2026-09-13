using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Criteria.Commands.UpdateCriterion;

public sealed record UpdateCriterionCommand(Guid StandardId, Guid CriterionId, UpdateCriterionRequest Request)
    : IRequest<CriterionResponse>;

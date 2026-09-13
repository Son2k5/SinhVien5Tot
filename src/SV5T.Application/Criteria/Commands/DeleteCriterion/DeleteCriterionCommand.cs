using MediatR;

namespace SV5T.Application.Criteria.Commands.DeleteCriterion;

public sealed record DeleteCriterionCommand(Guid StandardId, Guid CriterionId) : IRequest<MediatR.Unit>;

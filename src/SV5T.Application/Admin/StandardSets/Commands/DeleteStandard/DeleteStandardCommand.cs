using MediatR;

namespace SV5T.Application.Admin.StandardSets.Commands.DeleteStandard;

public sealed record DeleteStandardCommand(Guid StandardSetId, Guid StandardId) : IRequest<Unit>;

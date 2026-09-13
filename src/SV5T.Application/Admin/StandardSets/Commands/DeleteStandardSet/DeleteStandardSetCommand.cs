using MediatR;

namespace SV5T.Application.Admin.StandardSets.Commands.DeleteStandardSet;

public sealed record DeleteStandardSetCommand(Guid StandardSetId) : IRequest<Unit>;

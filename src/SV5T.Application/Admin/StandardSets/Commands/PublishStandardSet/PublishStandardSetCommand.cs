using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.StandardSets.Commands.PublishStandardSet;

public sealed record PublishStandardSetCommand(Guid StandardSetId) : IRequest<StandardSetResponse>;

using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.StandardSets.Commands.UpdateStandardSet;

public sealed record UpdateStandardSetCommand(Guid StandardSetId, UpdateStandardSetRequest Request)
    : IRequest<StandardSetResponse>;

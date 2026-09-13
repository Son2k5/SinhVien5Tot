using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.StandardSets.Commands.UnpublishStandardSet;

public sealed record UnpublishStandardSetCommand(Guid StandardSetId) : IRequest<StandardSetResponse>;

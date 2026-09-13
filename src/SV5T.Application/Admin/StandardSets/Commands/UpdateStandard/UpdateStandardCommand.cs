using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.StandardSets.Commands.UpdateStandard;

public sealed record UpdateStandardCommand(Guid StandardSetId, Guid StandardId, UpdateStandardRequest Request)
    : IRequest<StandardResponse>;

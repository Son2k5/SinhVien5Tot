using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.StandardSets.Commands.AddStandard;

public sealed record AddStandardCommand(Guid StandardSetId, CreateStandardRequest Request) : IRequest<StandardResponse>;

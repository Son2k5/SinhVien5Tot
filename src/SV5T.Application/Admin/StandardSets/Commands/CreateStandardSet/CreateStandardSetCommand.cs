using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.StandardSets.Commands.CreateStandardSet;

public sealed record CreateStandardSetCommand(CreateStandardSetRequest Request) : IRequest<StandardSetResponse>;

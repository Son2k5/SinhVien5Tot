using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.StandardSets.Commands.InitDefaultStandards;

public sealed record InitDefaultStandardsCommand(Guid StandardSetId) : IRequest<IReadOnlyList<StandardResponse>>;

using MediatR;

namespace SV5T.Application.Admin.Campaigns.Commands.DeleteCampaign;

public sealed record DeleteCampaignCommand(Guid Id) : IRequest<MediatR.Unit>;

using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.Campaigns.Commands.UpdateCampaign;

public sealed record UpdateCampaignCommand(Guid Id, UpdateCampaignRequest Request) : IRequest<CampaignDetailResponse>;

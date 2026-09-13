using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.Campaigns.Commands.CreateCampaign;

public sealed record CreateCampaignCommand(CreateCampaignRequest Request) : IRequest<CampaignDetailResponse>;

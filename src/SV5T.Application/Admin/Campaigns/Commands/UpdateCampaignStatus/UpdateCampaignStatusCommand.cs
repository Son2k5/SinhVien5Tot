using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.Campaigns.Commands.UpdateCampaignStatus;

public sealed record UpdateCampaignStatusCommand(Guid Id, UpdateCampaignStatusRequest Request)
    : IRequest<CampaignDetailResponse>;

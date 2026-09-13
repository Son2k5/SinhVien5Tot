using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Campaigns.Enums;

namespace SV5T.Application.Admin.Campaigns.Queries.GetAllCampaigns;

public sealed record GetAllCampaignsQuery(AwardLevel? Level, CampaignStatus? Status, string? SchoolYear)
    : IRequest<IReadOnlyList<CampaignResponse>>;

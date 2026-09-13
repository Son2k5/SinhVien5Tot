using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Common.Models;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Campaigns.Enums;

namespace SV5T.Application.Admin.Campaigns.Queries.GetCampaignsPaged;

public sealed record GetCampaignsPagedQuery(
    AwardLevel? Level,
    CampaignStatus? Status,
    string? SchoolYear,
    int PageIndex,
    int PageSize
) : IRequest<PagedResult<CampaignResponse>>;

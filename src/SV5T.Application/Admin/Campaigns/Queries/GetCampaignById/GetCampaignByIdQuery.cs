using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.Campaigns.Queries.GetCampaignById;

public sealed record GetCampaignByIdQuery(Guid Id) : IRequest<CampaignDetailResponse?>;

using MediatR;

namespace SV5T.Application.Admin.Campaigns.Commands.BatchDeleteCampaigns;

public sealed record BatchDeleteCampaignsCommand(IReadOnlyList<Guid> Ids) : IRequest<BatchDeleteCampaignsResult>;

public sealed record BatchDeleteCampaignsResult(int DeletedCount);

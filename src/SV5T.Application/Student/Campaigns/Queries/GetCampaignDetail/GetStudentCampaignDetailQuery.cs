using MediatR;
using SV5T.Application.Student.Dtos;

namespace SV5T.Application.Student.Campaigns.Queries.GetCampaignDetail;

public sealed record GetStudentCampaignDetailQuery(Guid CampaignId)
    : IRequest<StudentCampaignDetailResponse?>;

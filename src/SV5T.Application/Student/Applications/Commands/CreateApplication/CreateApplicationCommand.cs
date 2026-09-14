using MediatR;
using SV5T.Application.Student.Dtos;

namespace SV5T.Application.Student.Applications.Commands.CreateApplication;

public sealed record CreateApplicationCommand(Guid CampaignId)
    : IRequest<StudentApplicationDetailResponse>;

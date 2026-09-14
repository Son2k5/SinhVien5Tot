using MediatR;
using SV5T.Application.Student.Dtos;

namespace SV5T.Application.Student.Applications.Commands.SubmitApplication;

public sealed record SubmitApplicationCommand(
    Guid ApplicationId,
    string RowVersion) : IRequest<StudentApplicationDetailResponse>;

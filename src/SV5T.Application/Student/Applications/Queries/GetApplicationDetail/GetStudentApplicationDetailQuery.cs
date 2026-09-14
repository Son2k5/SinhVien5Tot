using MediatR;
using SV5T.Application.Student.Dtos;

namespace SV5T.Application.Student.Applications.Queries.GetApplicationDetail;

public sealed record GetStudentApplicationDetailQuery(Guid ApplicationId)
    : IRequest<StudentApplicationDetailResponse?>;

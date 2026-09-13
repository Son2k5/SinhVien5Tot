using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.Students.Queries.GetStudentById;

public sealed record GetStudentByIdQuery(Guid Id) : IRequest<AdminStudentDetailResponse?>;

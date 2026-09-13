using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.Students.Commands.DeleteStudent;

public sealed record DeleteStudentCommand(Guid Id, DeleteStudentRequest Request) : IRequest<MediatR.Unit>;

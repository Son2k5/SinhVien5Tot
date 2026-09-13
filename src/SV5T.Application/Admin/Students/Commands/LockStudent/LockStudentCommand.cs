using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.Students.Commands.LockStudent;

public sealed record LockStudentCommand(Guid Id, LockStudentRequest Request) : IRequest<MediatR.Unit>;

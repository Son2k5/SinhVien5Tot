using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.Students.Commands.UnlockStudent;

public sealed record UnlockStudentCommand(Guid Id, UnlockStudentRequest Request) : IRequest<MediatR.Unit>;

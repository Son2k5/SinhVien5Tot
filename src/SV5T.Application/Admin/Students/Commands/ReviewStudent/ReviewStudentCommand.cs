using MediatR;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.Students.Commands.ReviewStudent;

public sealed record ReviewStudentCommand(Guid Id, ReviewStudentEvidenceRequest Request)
    : IRequest<AdminStudentEvidenceItemResponse>;

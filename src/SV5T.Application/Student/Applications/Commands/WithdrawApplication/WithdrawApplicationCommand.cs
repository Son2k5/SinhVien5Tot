using MediatR;
using SV5T.Application.Student.Dtos;

namespace SV5T.Application.Student.Applications.Commands.WithdrawApplication;

public sealed record WithdrawApplicationCommand(
    Guid ApplicationId,
    string RowVersion,
    string? Reason) : IRequest<StudentApplicationDetailResponse>;

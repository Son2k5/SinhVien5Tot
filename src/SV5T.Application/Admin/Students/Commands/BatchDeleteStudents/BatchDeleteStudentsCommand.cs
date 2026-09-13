using MediatR;

namespace SV5T.Application.Admin.Students.Commands.BatchDeleteStudents;

public sealed record BatchDeleteStudentsCommand(
    IReadOnlyList<Guid> Ids,
    string? Reason = null,
    bool Confirm = true
) : IRequest<BatchDeleteStudentsResult>;

public sealed record BatchDeleteStudentsResult(int DeletedCount);

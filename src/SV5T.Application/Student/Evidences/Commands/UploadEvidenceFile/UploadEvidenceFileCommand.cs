using MediatR;
using SV5T.Application.Student.Dtos;

namespace SV5T.Application.Student.Evidences.Commands.UploadEvidenceFile;

public sealed record UploadEvidenceFileRequest(
    Stream Content,
    string FileName,
    long Length);

public sealed record UploadEvidenceFileCommand(
    Guid EvidenceId,
    UploadEvidenceFileRequest Request) : IRequest<StudentEvidenceItemResponse>;

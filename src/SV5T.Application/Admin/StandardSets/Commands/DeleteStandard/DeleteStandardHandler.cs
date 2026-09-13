using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Admin.StandardSets.Commands.DeleteStandard;

public sealed class DeleteStandardHandler(
    IStandardSetRepository standardSetRepository,
    IStandardRepository standardRepository,
    IUnitOfWork unitOfWork
) : IRequestHandler<DeleteStandardCommand, Unit>
{
    public async Task<Unit> Handle(DeleteStandardCommand request, CancellationToken cancellationToken)
    {
        var standardSet =
            await standardSetRepository.GetByIdAsync(
                request.StandardSetId,
                tracking: false,
                cancellationToken: cancellationToken
            )
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Khong tim thay bo tieu chuan.",
                "standard_set_not_found"
            );
        if (standardSet.Status != StandardSetStatus.Draft)
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Khong the xoa tieu chuan cua bo tieu chuan da cong bo (Published).",
                "standard_set_not_editable"
            );
        var standard =
            await standardRepository.GetByIdAsync(
                request.StandardId,
                tracking: true,
                cancellationToken: cancellationToken
            )
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Khong tim thay tieu chuan.",
                "standard_not_found"
            );
        if (standard.StandardSetId != request.StandardSetId)
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Tieu chuan khong thuoc bo tieu chuan duoc chi dinh.",
                "invalid_standard_scope"
            );
        await standardRepository.RemoveAsync(standard, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

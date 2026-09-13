using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Admin.StandardSets.Commands.DeleteStandardSet;

public sealed class DeleteStandardSetHandler(IStandardSetRepository standardSetRepository, IUnitOfWork unitOfWork)
    : IRequestHandler<DeleteStandardSetCommand, Unit>
{
    public async Task<Unit> Handle(DeleteStandardSetCommand request, CancellationToken cancellationToken)
    {
        var standardSet =
            await standardSetRepository.GetByIdAsync(request.StandardSetId, true, true, true, cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Khong tim thay bo tieu chuan.",
                "standard_set_not_found"
            );
        if (standardSet.Status != StandardSetStatus.Draft)
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Khong the xoa bo tieu chuan da cong bo hoac dang su dung.",
                "standard_set_not_deletable"
            );
        await standardSetRepository.RemoveAsync(standardSet, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}

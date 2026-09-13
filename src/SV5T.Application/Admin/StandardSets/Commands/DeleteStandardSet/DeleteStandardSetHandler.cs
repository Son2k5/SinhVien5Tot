using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Admin.StandardSets.Commands.DeleteStandardSet;

public sealed class DeleteStandardSetHandler(IStandardSetRepository standardSetRepository, IUnitOfWork unitOfWork)
    : IRequestHandler<DeleteStandardSetCommand, Unit>
{
    public async Task<Unit> Handle(DeleteStandardSetCommand command, CancellationToken cancellationToken)
    {
        var standardSet =
            await standardSetRepository.GetByIdAsync(command.StandardSetId, true, true, true, cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn.",
                "standard_set_not_found"
            );
        if (standardSet.Status != StandardSetStatus.Draft)
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể xóa bộ tiêu chuẩn đã công bố hoặc đang sử dụng.",
                "standard_set_not_deletable"
            );
        await standardSetRepository.RemoveAsync(standardSet, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}


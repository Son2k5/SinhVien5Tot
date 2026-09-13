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
    public async Task<Unit> Handle(DeleteStandardCommand command, CancellationToken cancellationToken)
    {
        var standardSet =
            await standardSetRepository.GetByIdAsync(
                command.StandardSetId,
                tracking: false,
                cancellationToken: cancellationToken
            )
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn.",
                "standard_set_not_found"
            );
        if (standardSet.Status != StandardSetStatus.Draft)
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể xóa tiêu chuẩn của bộ tiêu chuẩn đã công bố (Published).",
                "standard_set_not_editable"
            );
        var standard =
            await standardRepository.GetByIdAsync(
                command.StandardId,
                tracking: true,
                cancellationToken: cancellationToken
            )
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy tiêu chuẩn.",
                "standard_not_found"
            );
        if (standard.StandardSetId != command.StandardSetId)
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Tiêu chuẩn không thuộc bộ tiêu chuẩn được chỉ định.",
                "invalid_standard_scope"
            );
        await standardRepository.RemoveAsync(standard, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return Unit.Value;
    }
}


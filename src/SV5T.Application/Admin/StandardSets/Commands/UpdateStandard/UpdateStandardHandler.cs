using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Admin.StandardSets.Commands.UpdateStandard;

public sealed class UpdateStandardHandler(
    IStandardSetRepository standardSetRepository,
    IStandardRepository standardRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser
) : IRequestHandler<UpdateStandardCommand, StandardResponse>
{
    public async Task<StandardResponse> Handle(UpdateStandardCommand command, CancellationToken cancellationToken)
    {
        var updateRequest = command.Request;
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
                "Không thể chỉnh sửa tiêu chuẩn của bộ tiêu chuẩn đã công bố (Published).",
                "standard_set_not_editable"
            );
        var standard =
            await standardRepository.GetByIdAsync(command.StandardId, true, true, cancellationToken)
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
        if (
            !string.IsNullOrWhiteSpace(updateRequest.Code)
            && !string.Equals(standard.Code, updateRequest.Code.Trim(), StringComparison.OrdinalIgnoreCase)
        )
        {
            var codeExists = await standardRepository.ExistsCodeInStandardSetAsync(
                command.StandardSetId,
                updateRequest.Code.Trim(),
                excludeId: command.StandardId,
                cancellationToken: cancellationToken
            );
            if (codeExists)
                throw new UseCaseException(
                    ApplicationErrorKind.Conflict,
                    $"Mã tiêu chuẩn '{updateRequest.Code.Trim()}' đã tồn tại trong bộ tiêu chuẩn này.",
                    "standard_code_duplicate"
                );
            standard.Code = updateRequest.Code.Trim();
        }
        var actorId = RequireAdminUserId();
        standard.GroupCode = updateRequest.GroupCode;
        standard.Title = updateRequest.Title.Trim();
        standard.Description = updateRequest.Description?.Trim();
        standard.DisplayOrder = updateRequest.DisplayOrder;
        standard.Operator = updateRequest.Operator;
        standard.MinimumSatisfied = updateRequest.MinimumSatisfied;
        standard.UpdatedAt = DateTime.UtcNow;
        standard.UpdatedBy = actorId.ToString();
        await standardRepository.UpdateAsync(standard, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return AdminStandardMappings.MapToStandardResponse(standard);
    }

    private Guid RequireAdminUserId() =>
        currentUser.UserId
        ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized,
            "Không xác định được danh tính người dùng hiện tại."
        );
}


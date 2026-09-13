using FluentValidation;
using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Auth.Support;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Admin.StandardSets.Commands.UpdateStandard;

public sealed class UpdateStandardHandler(
    IStandardSetRepository standardSetRepository,
    IStandardRepository standardRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    IValidator<UpdateStandardRequest> validator
) : IRequestHandler<UpdateStandardCommand, StandardResponse>
{
    public async Task<StandardResponse> Handle(UpdateStandardCommand request, CancellationToken cancellationToken)
    {
        await AuthServiceSupport.ValidateAsync(validator, request.Request, cancellationToken);
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
                "Khong the chinh sua tieu chuan cua bo tieu chuan da cong bo (Published).",
                "standard_set_not_editable"
            );
        var standard =
            await standardRepository.GetByIdAsync(request.StandardId, true, true, cancellationToken)
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
        if (
            !string.IsNullOrWhiteSpace(request.Request.Code)
            && !string.Equals(standard.Code, request.Request.Code.Trim(), StringComparison.OrdinalIgnoreCase)
        )
        {
            var codeExists = await standardRepository.ExistsCodeInStandardSetAsync(
                request.StandardSetId,
                request.Request.Code.Trim(),
                excludeId: request.StandardId,
                cancellationToken: cancellationToken
            );
            if (codeExists)
                throw new UseCaseException(
                    ApplicationErrorKind.Conflict,
                    $"Ma tieu chuan '{request.Request.Code.Trim()}' da ton tai trong bo tieu chuan nay.",
                    "standard_code_duplicate"
                );
            standard.Code = request.Request.Code.Trim();
        }
        var actorId = RequireAdminUserId();
        standard.GroupCode = request.Request.GroupCode;
        standard.Title = request.Request.Title.Trim();
        standard.Description = request.Request.Description?.Trim();
        standard.DisplayOrder = request.Request.DisplayOrder;
        standard.Operator = request.Request.Operator;
        standard.MinimumSatisfied = request.Request.MinimumSatisfied;
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
            "Khong xac dinh duoc danh tinh nguoi dung hien tai."
        );
}

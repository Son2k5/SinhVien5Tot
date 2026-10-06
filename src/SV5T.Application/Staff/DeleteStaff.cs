using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using SV5T.Application.Admin.Students.Abstractions;
using SV5T.Application.Auth.Abstractions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Admin;

namespace SV5T.Application.Staff;

public sealed record DeleteStaffCommand(Guid Id, string RowVersion) : IRequest;

public sealed class DeleteStaffCommandValidator : AbstractValidator<DeleteStaffCommand>
{
    public DeleteStaffCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Mã nhân sự không hợp lệ.");
        RuleFor(x => x.RowVersion).NotEmpty().MaximumLength(64)
            .WithMessage("Phiên bản dữ liệu không hợp lệ.");
    }
}

public sealed class DeleteStaffHandler(
    IUserRepository userRepository,
    IAdminAuditLogRepository auditLogRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    ILogger<DeleteStaffHandler> logger)
    : IRequestHandler<DeleteStaffCommand>
{
    public async Task Handle(
        DeleteStaffCommand request,
        CancellationToken cancellationToken)
    {
        var actorUserId = StaffRules.EnsureAdmin(currentUser);
        StaffRules.EnsureNotSelf(actorUserId, request.Id);
        var user = await userRepository.GetManageableStaffForUpdateAsync(
            request.Id,
            cancellationToken) ?? throw StaffRules.StaffNotFound();
        StaffRules.EnsureRowVersion(user, request.RowVersion);

        if (await userRepository.HasStaffWorkHistoryAsync(user.Id, cancellationToken))
        {
            throw HasWorkHistory();
        }

        var now = DateTime.UtcNow;
        await auditLogRepository.AddAsync(
            new AdminAuditLog
            {
                Action = "StaffDeleted",
                ActorId = actorUserId,
                TargetUserId = user.Id,
                MetadataJson = "{\"changedFields\":[\"User\"]}",
                CreatedAt = now
            },
            cancellationToken);
        userRepository.Remove(user);
        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (UseCaseException exception) when (exception.ErrorCode == "concurrency_conflict")
        {
            throw StaffRules.ConcurrencyConflict();
        }
        catch (Exception exception) when (
            string.Equals(exception.GetType().Name, "DbUpdateException", StringComparison.Ordinal))
        {
            throw HasWorkHistory();
        }

        try
        {
            await refreshTokenRepository.RevokeAllActiveAsync(
                user.Id,
                DateTime.UtcNow,
                cancellationToken);
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogWarning(
                "StaffManagement event={EventName} targetUserId={TargetUserId} action={Action} failureType={FailureType}",
                "StaffSessionRevocationFailed",
                user.Id,
                "delete",
                exception.GetType().Name);
        }

        logger.LogInformation(
            "StaffManagement event={EventName} actorUserId={ActorUserId} targetUserId={TargetUserId} action={Action} changedFields={ChangedFields}",
            "StaffDeleted",
            actorUserId,
            user.Id,
            "delete",
            "User");
    }

    private static UseCaseException HasWorkHistory() => new(
        ApplicationErrorKind.Conflict,
        "Nhân sự đã có lịch sử công việc, hãy khoá tài khoản thay vì xoá.",
        "staff_has_work_history");
}

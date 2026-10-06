using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using SV5T.Application.Admin.Students.Abstractions;
using SV5T.Application.Auth.Abstractions;
using SV5T.Application.Common.Abstractions;
using SV5T.Domain.Admin;

namespace SV5T.Application.Staff;

public sealed record LockStaffCommand(Guid Id, string RowVersion) : IRequest<StaffResponse>;

public sealed record UnlockStaffCommand(Guid Id, string RowVersion) : IRequest<StaffResponse>;

public sealed class LockStaffCommandValidator : AbstractValidator<LockStaffCommand>
{
    public LockStaffCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Mã nhân sự không hợp lệ.");
        RuleFor(x => x.RowVersion).NotEmpty().MaximumLength(64)
            .WithMessage("Phiên bản dữ liệu không hợp lệ.");
    }
}

public sealed class UnlockStaffCommandValidator : AbstractValidator<UnlockStaffCommand>
{
    public UnlockStaffCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Mã nhân sự không hợp lệ.");
        RuleFor(x => x.RowVersion).NotEmpty().MaximumLength(64)
            .WithMessage("Phiên bản dữ liệu không hợp lệ.");
    }
}

public sealed class LockStaffHandler(
    IUserRepository userRepository,
    IAdminAuditLogRepository auditLogRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    ILogger<LockStaffHandler> logger)
    : IRequestHandler<LockStaffCommand, StaffResponse>
{
    public async Task<StaffResponse> Handle(
        LockStaffCommand request,
        CancellationToken cancellationToken)
    {
        var actorUserId = StaffRules.EnsureAdmin(currentUser);
        StaffRules.EnsureNotSelf(actorUserId, request.Id);
        var user = await userRepository.GetManageableStaffForUpdateAsync(
            request.Id,
            cancellationToken) ?? throw StaffRules.StaffNotFound();
        StaffRules.EnsureRowVersion(user, request.RowVersion);
        if (!user.IsActive)
        {
            return StaffRules.ToResponse(user);
        }

        var now = StaffRules.NextUpdatedAt(user.UpdatedAt);
        user.IsActive = false;
        user.UpdatedAt = now;
        user.UpdatedBy = actorUserId.ToString("D");
        await auditLogRepository.AddAsync(
            new AdminAuditLog
            {
                Action = "StaffLocked",
                ActorId = actorUserId,
                TargetUserId = user.Id,
                MetadataJson = "{\"changedFields\":[\"IsActive\"]}",
                CreatedAt = now
            },
            cancellationToken);
        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (SV5T.Application.Common.Exceptions.UseCaseException exception)
            when (exception.ErrorCode == "concurrency_conflict")
        {
            throw StaffRules.ConcurrencyConflict();
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
                "lock",
                exception.GetType().Name);
        }

        logger.LogInformation(
            "StaffManagement event={EventName} actorUserId={ActorUserId} targetUserId={TargetUserId} action={Action} changedFields={ChangedFields}",
            "StaffLocked",
            actorUserId,
            user.Id,
            "lock",
            "IsActive");
        return StaffRules.ToResponse(user);
    }
}

public sealed class UnlockStaffHandler(
    IUserRepository userRepository,
    IAdminAuditLogRepository auditLogRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    ILogger<UnlockStaffHandler> logger)
    : IRequestHandler<UnlockStaffCommand, StaffResponse>
{
    public async Task<StaffResponse> Handle(
        UnlockStaffCommand request,
        CancellationToken cancellationToken)
    {
        var actorUserId = StaffRules.EnsureAdmin(currentUser);
        StaffRules.EnsureNotSelf(actorUserId, request.Id);
        var user = await userRepository.GetManageableStaffForUpdateAsync(
            request.Id,
            cancellationToken) ?? throw StaffRules.StaffNotFound();
        StaffRules.EnsureRowVersion(user, request.RowVersion);
        if (user.IsActive)
        {
            return StaffRules.ToResponse(user);
        }

        var now = StaffRules.NextUpdatedAt(user.UpdatedAt);
        user.IsActive = true;
        user.UpdatedAt = now;
        user.UpdatedBy = actorUserId.ToString("D");
        await auditLogRepository.AddAsync(
            new AdminAuditLog
            {
                Action = "StaffUnlocked",
                ActorId = actorUserId,
                TargetUserId = user.Id,
                MetadataJson = "{\"changedFields\":[\"IsActive\"]}",
                CreatedAt = now
            },
            cancellationToken);
        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (SV5T.Application.Common.Exceptions.UseCaseException exception)
            when (exception.ErrorCode == "concurrency_conflict")
        {
            throw StaffRules.ConcurrencyConflict();
        }

        logger.LogInformation(
            "StaffManagement event={EventName} actorUserId={ActorUserId} targetUserId={TargetUserId} action={Action} changedFields={ChangedFields}",
            "StaffUnlocked",
            actorUserId,
            user.Id,
            "unlock",
            "IsActive");
        return StaffRules.ToResponse(user);
    }
}

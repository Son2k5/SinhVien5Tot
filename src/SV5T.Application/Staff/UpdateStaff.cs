using System.Text.Json;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using SV5T.Application.Admin.Students.Abstractions;
using SV5T.Application.Auth.Abstractions;
using SV5T.Application.Common.Abstractions;
using SV5T.Domain.Admin;
using SV5T.Domain.Users.Enums;

namespace SV5T.Application.Staff;

public sealed record UpdateStaffCommand(
    Guid Id,
    string FullName,
    string? Phone,
    Role Role,
    string RowVersion) : IRequest<StaffResponse>;

public sealed class UpdateStaffCommandValidator : AbstractValidator<UpdateStaffCommand>
{
    public UpdateStaffCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Mã nhân sự không hợp lệ.");
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ và tên không được để trống.")
            .MaximumLength(100).WithMessage("Họ và tên không được vượt quá 100 ký tự.");
        RuleFor(x => x.Phone)
            .MaximumLength(20).WithMessage("Số điện thoại không hợp lệ.")
            .Must(StaffRules.IsValidVietnamesePhone)
            .WithMessage("Số điện thoại không hợp lệ.");
        RuleFor(x => x.Role)
            .Must(StaffRules.IsManageable)
            .WithMessage("Vai trò nhân sự không hợp lệ.");
        RuleFor(x => x.RowVersion)
            .NotEmpty().WithMessage("Phiên bản dữ liệu không được để trống.")
            .MaximumLength(64).WithMessage("Phiên bản dữ liệu không hợp lệ.");
    }
}

public sealed class UpdateStaffHandler(
    IUserRepository userRepository,
    IAdminAuditLogRepository auditLogRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    ILogger<UpdateStaffHandler> logger)
    : IRequestHandler<UpdateStaffCommand, StaffResponse>
{
    public async Task<StaffResponse> Handle(
        UpdateStaffCommand request,
        CancellationToken cancellationToken)
    {
        var actorUserId = StaffRules.EnsureAdmin(currentUser);
        StaffRules.EnsureNotSelf(actorUserId, request.Id);
        var user = await userRepository.GetManageableStaffForUpdateAsync(
            request.Id,
            cancellationToken) ?? throw StaffRules.StaffNotFound();
        StaffRules.EnsureRowVersion(user, request.RowVersion);

        var changedFields = new List<string>();
        var fullName = request.FullName.Trim();
        var phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
        var roleChanged = user.Role != request.Role;

        if (!string.Equals(user.DisplayName, fullName, StringComparison.Ordinal))
        {
            user.DisplayName = fullName;
            changedFields.Add("FullName");
        }
        if (!string.Equals(user.PhoneNumber, phone, StringComparison.Ordinal))
        {
            user.PhoneNumber = phone;
            changedFields.Add("Phone");
        }
        if (roleChanged)
        {
            user.Role = request.Role;
            changedFields.Add("Role");
        }

        if (changedFields.Count == 0)
        {
            return StaffRules.ToResponse(user);
        }

        var now = StaffRules.NextUpdatedAt(user.UpdatedAt);
        user.UpdatedAt = now;
        user.UpdatedBy = actorUserId.ToString("D");
        await auditLogRepository.AddAsync(
            new AdminAuditLog
            {
                Action = roleChanged ? "StaffRoleChanged" : "StaffUpdated",
                ActorId = actorUserId,
                TargetUserId = user.Id,
                MetadataJson = JsonSerializer.Serialize(new { changedFields }),
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

        if (roleChanged)
        {
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
                    "change-role",
                    exception.GetType().Name);
            }
        }

        logger.LogInformation(
            "StaffManagement event={EventName} actorUserId={ActorUserId} targetUserId={TargetUserId} action={Action} changedFields={ChangedFields}",
            roleChanged ? "StaffRoleChanged" : "StaffUpdated",
            actorUserId,
            user.Id,
            roleChanged ? "change-role" : "update",
            string.Join(',', changedFields));
        return StaffRules.ToResponse(user);
    }
}

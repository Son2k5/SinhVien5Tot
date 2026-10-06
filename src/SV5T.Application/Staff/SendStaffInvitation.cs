using FluentValidation;
using MediatR;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using SV5T.Application.Admin.Students.Abstractions;
using SV5T.Application.Auth.Commands.ForgotPassword;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Admin;

namespace SV5T.Application.Staff;

public sealed record SendStaffInvitationCommand(Guid Id) : IRequest;

public sealed class SendStaffInvitationCommandValidator
    : AbstractValidator<SendStaffInvitationCommand>
{
    public SendStaffInvitationCommandValidator() =>
        RuleFor(x => x.Id).NotEmpty().WithMessage("Mã nhân sự không hợp lệ.");
}

public sealed class SendStaffInvitationHandler(
    IUserRepository userRepository,
    IAdminAuditLogRepository auditLogRepository,
    IUnitOfWork unitOfWork,
    IAuthChallengeStore challengeStore,
    IMemoryCache memoryCache,
    ISender sender,
    ICurrentUser currentUser,
    ILogger<SendStaffInvitationHandler> logger)
    : IRequestHandler<SendStaffInvitationCommand>
{
    public async Task Handle(
        SendStaffInvitationCommand request,
        CancellationToken cancellationToken)
    {
        var actorUserId = StaffRules.EnsureAdmin(currentUser);
        StaffRules.EnsureNotSelf(actorUserId, request.Id);
        var staff = await userRepository.GetStaffResponseAsync(
            request.Id,
            cancellationToken) ?? throw StaffRules.StaffNotFound();
        if (!staff.IsActive)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Chỉ có thể gửi lời mời cho tài khoản đang hoạt động.",
                "staff_inactive");
        }

        var cooldownKey = $"staff-invitation:{staff.Id:N}";
        if (memoryCache.TryGetValue(cooldownKey, out _))
        {
            throw CannotSendInvitation();
        }

        var now = DateTime.UtcNow;
        await auditLogRepository.AddAsync(
            new AdminAuditLog
            {
                Action = "StaffInvitationRequested",
                ActorId = actorUserId,
                TargetUserId = staff.Id,
                MetadataJson = "{\"changedFields\":[]}",
                CreatedAt = now
            },
            cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        memoryCache.Set(cooldownKey, true, TimeSpan.FromSeconds(60));

        var sent = false;
        string? failureType = null;
        try
        {
            var invitationId = await sender.Send(
                new ForgotPasswordCommand(staff.Email),
                cancellationToken);
            sent = await challengeStore.GetAsync(invitationId, cancellationToken) is not null;
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            failureType = exception.GetType().Name;
        }

        if (!sent)
        {
            logger.LogWarning(
                "StaffManagement event={EventName} actorUserId={ActorUserId} targetUserId={TargetUserId} action={Action} failureType={FailureType}",
                "StaffInvitationFailed",
                actorUserId,
                staff.Id,
                "send-invitation",
                failureType ?? "NotQueued");
            throw CannotSendInvitation();
        }

        logger.LogInformation(
            "StaffManagement event={EventName} actorUserId={ActorUserId} targetUserId={TargetUserId} action={Action} changedFields={ChangedFields}",
            "StaffInvitationSent",
            actorUserId,
            staff.Id,
            "send-invitation",
            string.Empty);
    }

    private static UseCaseException CannotSendInvitation() => new(
        ApplicationErrorKind.Conflict,
        "Không gửi được email, thử lại sau.",
        "staff_invitation_failed");
}

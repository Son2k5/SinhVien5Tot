using System.Security.Cryptography;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using SV5T.Application.Admin.Students.Abstractions;
using SV5T.Application.Auth.Commands.ForgotPassword;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Admin;
using SV5T.Domain.Users;
using SV5T.Domain.Users.Enums;

namespace SV5T.Application.Staff;

public sealed record CreateStaffCommand(
    string Email,
    string FullName,
    string? Phone,
    Role Role) : IRequest<CreateStaffResponse>;

public sealed class CreateStaffCommandValidator : AbstractValidator<CreateStaffCommand>
{
    public CreateStaffCommandValidator(ISchoolEmailValidator schoolEmailValidator)
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .MaximumLength(254).WithMessage("Email không được vượt quá 254 ký tự.")
            .EmailAddress().WithMessage("Định dạng email không hợp lệ.")
            .Must(schoolEmailValidator.IsAllowed)
            .WithMessage("Email phải thuộc tên miền của trường.");
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
    }
}

public sealed class CreateStaffHandler(
    IUserRepository userRepository,
    IAdminAuditLogRepository auditLogRepository,
    IUnitOfWork unitOfWork,
    IPasswordHasher passwordHasher,
    IAuthChallengeStore challengeStore,
    ISender sender,
    ICurrentUser currentUser,
    ILogger<CreateStaffHandler> logger)
    : IRequestHandler<CreateStaffCommand, CreateStaffResponse>
{
    public async Task<CreateStaffResponse> Handle(
        CreateStaffCommand request,
        CancellationToken cancellationToken)
    {
        var actorUserId = StaffRules.EnsureAdmin(currentUser);
        var email = StaffRules.NormalizeEmail(request.Email);
        var normalizedEmail = StaffRules.NormalizeEmailKey(email);

        if (await userRepository.StaffEmailExistsAsync(normalizedEmail, cancellationToken))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Email này đã được sử dụng.",
                "email_taken");
        }

        var now = StaffRules.NextUpdatedAt(null);
        var user = new User
        {
            Email = email,
            NormalizedEmail = normalizedEmail,
            DisplayName = request.FullName.Trim(),
            PhoneNumber = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim(),
            PasswordHash = passwordHasher.Hash(
                Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))),
            Role = request.Role,
            IsActive = true,
            IsVerified = true,
            IsDeleted = false,
            SecurityVersion = 1,
            CreatedAt = now,
            CreatedBy = actorUserId.ToString("D"),
            UpdatedAt = now,
            UpdatedBy = actorUserId.ToString("D")
        };

        await userRepository.AddAsync(user, cancellationToken);
        await auditLogRepository.AddAsync(
            new AdminAuditLog
            {
                Action = "StaffCreated",
                ActorId = actorUserId,
                TargetUserId = user.Id,
                MetadataJson = "{\"changedFields\":[\"Email\",\"FullName\",\"Phone\",\"Role\",\"IsActive\",\"IsVerified\"]}",
                CreatedAt = now
            },
            cancellationToken);
        try
        {
            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (UseCaseException exception) when (
            exception.ErrorCode is "email_taken" or "unique_constraint_violation")
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Email này đã được sử dụng.",
                "email_taken");
        }

        var invitationSent = await TrySendInvitationAsync(email, user.Id, cancellationToken);
        logger.LogInformation(
            "StaffManagement event={EventName} actorUserId={ActorUserId} targetUserId={TargetUserId} action={Action} changedFields={ChangedFields} invitationSent={InvitationSent}",
            "StaffCreated",
            actorUserId,
            user.Id,
            "create",
            "Email,FullName,Phone,Role,IsActive,IsVerified",
            invitationSent);

        return new CreateStaffResponse(StaffRules.ToResponse(user), invitationSent);
    }

    private async Task<bool> TrySendInvitationAsync(
        string email,
        Guid targetUserId,
        CancellationToken cancellationToken)
    {
        try
        {
            var invitationId = await sender.Send(
                new ForgotPasswordCommand(email),
                cancellationToken);
            return await challengeStore.GetAsync(invitationId, cancellationToken) is not null;
        }
        catch (Exception exception) when (exception is not OperationCanceledException)
        {
            logger.LogWarning(
                "StaffManagement event={EventName} targetUserId={TargetUserId} action={Action} failureType={FailureType}",
                "StaffInvitationFailed",
                targetUserId,
                "send-invitation",
                exception.GetType().Name);
            return false;
        }
    }
}

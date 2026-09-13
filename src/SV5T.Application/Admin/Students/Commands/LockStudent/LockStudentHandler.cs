using FluentValidation;
using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Students.Abstractions;
using SV5T.Application.Auth.Abstractions;
using SV5T.Application.Auth.Support;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Admin;

namespace SV5T.Application.Admin.Students.Commands.LockStudent;

public sealed class LockStudentHandler(
    IAdminStudentRepository repository,
    IAdminAuditLogRepository auditLogRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IAuthRedisStore authRedisStore,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    IValidator<LockStudentRequest> validator
) : IRequestHandler<LockStudentCommand, MediatR.Unit>
{
    public async Task<MediatR.Unit> Handle(LockStudentCommand request, CancellationToken cancellationToken)
    {
        await AuthServiceSupport.ValidateAsync(validator, request.Request, cancellationToken);

        var actorId =
            currentUser.UserId
            ?? throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Không xác định được danh tính quản trị viên.",
                "invalid_session");

        if (actorId == request.Id)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Forbidden,
                "Không thể khóa chính tài khoản của bạn.",
                "cannot_lock_self");
        }

        var user =
            await repository.GetByIdAsync(request.Id, tracking: true, includeDeleted: true, cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy sinh viên.",
                "student_not_found");

        if (user.Role != SV5T.Domain.Users.Enums.Role.User)
        {
            throw new UseCaseException(ApplicationErrorKind.NotFound, "Không tìm thấy sinh viên.", "student_not_found");
        }

        if (user.IsDeleted)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Sinh viên đã bị xóa, không thể khóa tài khoản.",
                "student_already_deleted");
        }

        if (!user.IsActive)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Tài khoản sinh viên đã bị khóa trước đó.",
                "student_already_locked");
        }

        var now = DateTime.UtcNow;
        var reason = string.IsNullOrWhiteSpace(request.Request.Reason) ? null : request.Request.Reason.Trim();

        await unitOfWork.ExecuteInTransactionAsync(
            async ct =>
            {
                user.IsActive = false;
                user.SecurityVersion++;
                user.UpdatedAt = now;
                user.UpdatedBy = actorId.ToString();

                await refreshTokenRepository.RevokeAllActiveAsync(user.Id, now, ct);

                await auditLogRepository.AddAsync(
                    new AdminAuditLog
                    {
                        Action = "StudentLocked",
                        TargetUserId = user.Id,
                        ActorId = actorId,
                        Reason = reason,
                        MetadataJson = """{"source":"admin-students"}""",
                        CreatedAt = now,
                    },
                    ct);

                await unitOfWork.SaveChangesAsync(ct);
            },
            cancellationToken);

        // Bump cached security version so existing access tokens are rejected immediately.
        await authRedisStore.SetUserSecurityVersionAsync(user.Id, user.SecurityVersion);

        return MediatR.Unit.Value;
    }
}

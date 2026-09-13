using FluentValidation;
using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Students.Abstractions;
using SV5T.Application.Auth.Abstractions;
using SV5T.Application.Auth.Support;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Admin;

namespace SV5T.Application.Admin.Students.Commands.UnlockStudent;

public sealed class UnlockStudentHandler(
    IAdminStudentRepository repository,
    IAdminAuditLogRepository auditLogRepository,
    IAuthRedisStore authRedisStore,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    IValidator<UnlockStudentRequest> validator
) : IRequestHandler<UnlockStudentCommand, MediatR.Unit>
{
    public async Task<MediatR.Unit> Handle(UnlockStudentCommand request, CancellationToken cancellationToken)
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
                "Không thể mở khóa chính tài khoản của bạn.",
                "cannot_unlock_self");
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
                "Sinh viên đã bị xóa, không thể mở khóa tài khoản.",
                "student_already_deleted");
        }

        if (user.IsActive)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Tài khoản sinh viên đang hoạt động, không cần mở khóa.",
                "student_already_active");
        }

        var now = DateTime.UtcNow;
        var reason = string.IsNullOrWhiteSpace(request.Request.Reason) ? null : request.Request.Reason.Trim();

        await unitOfWork.ExecuteInTransactionAsync(
            async ct =>
            {
                user.IsActive = true;
                user.SecurityVersion++;
                user.UpdatedAt = now;
                user.UpdatedBy = actorId.ToString();

                await auditLogRepository.AddAsync(
                    new AdminAuditLog
                    {
                        Action = "StudentUnlocked",
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

        // Refresh cached security version (unlock also bumps sv to invalidate old tokens issued before lock).
        await authRedisStore.SetUserSecurityVersionAsync(user.Id, user.SecurityVersion);

        return MediatR.Unit.Value;
    }
}

using MediatR;
using SV5T.Application.Admin.Students.Abstractions;
using SV5T.Application.Auth.Abstractions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Domain.Admin;
using SV5T.Domain.Users.Enums;

namespace SV5T.Application.Admin.Students.Commands.BatchDeleteStudents;

public sealed class BatchDeleteStudentsHandler(
    IAdminStudentRepository repository,
    IAdminAuditLogRepository auditLogRepository,
    IRefreshTokenRepository refreshTokenRepository,
    IAuthRedisStore authRedisStore,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser
) : IRequestHandler<BatchDeleteStudentsCommand, BatchDeleteStudentsResult>
{
    public async Task<BatchDeleteStudentsResult> Handle(
        BatchDeleteStudentsCommand request,
        CancellationToken cancellationToken)
    {
        if (!request.Confirm)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Vui lòng xác nhận xóa sinh viên trước khi thực hiện.",
                "confirmation_required"
            );
        }

        var uniqueIds = request.Ids.Distinct().ToList();
        if (uniqueIds.Count == 0)
        {
            return new BatchDeleteStudentsResult(0);
        }

        var actorId =
            currentUser.UserId
            ?? throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Không xác định được danh tính quản trị viên.",
                "invalid_session"
            );

        var users = await repository.GetByIdsAsync(
            uniqueIds,
            tracking: true,
            includeDeleted: true,
            cancellationToken: cancellationToken
        );

        var eligibleUsers = users
            .Where(u => u.Role == Role.User && !u.IsDeleted)
            .ToList();

        if (eligibleUsers.Count == 0)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không có sinh viên hợp lệ nào để xóa hoặc các tài khoản đã được xóa trước đó.",
                "no_students_to_delete"
            );
        }

        var now = DateTime.UtcNow;
        var reason = string.IsNullOrWhiteSpace(request.Reason) ? null : request.Reason.Trim();

        await unitOfWork.ExecuteInTransactionAsync(
            async ct =>
            {
                foreach (var user in eligibleUsers)
                {
                    user.IsDeleted = true;
                    user.DeletedAt = now;
                    user.DeletedBy = actorId;
                    user.DeleteReason = reason;
                    user.IsActive = false;
                    user.SecurityVersion++;
                    user.UpdatedAt = now;
                    user.UpdatedBy = actorId.ToString();

                    await refreshTokenRepository.RevokeAllActiveAsync(user.Id, now, ct);

                    await auditLogRepository.AddAsync(
                        new AdminAuditLog
                        {
                            Action = "StudentDeleted",
                            TargetUserId = user.Id,
                            ActorId = actorId,
                            Reason = reason,
                            MetadataJson = """{"source":"admin-students-batch"}""",
                            CreatedAt = now,
                        },
                        ct
                    );
                }

                await unitOfWork.SaveChangesAsync(ct);
            },
            cancellationToken
        );

        foreach (var user in eligibleUsers)
        {
            await authRedisStore.SetUserSecurityVersionAsync(user.Id, user.SecurityVersion);
        }

        return new BatchDeleteStudentsResult(eligibleUsers.Count);
    }
}

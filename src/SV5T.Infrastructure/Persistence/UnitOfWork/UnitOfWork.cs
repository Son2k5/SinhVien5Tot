using Microsoft.EntityFrameworkCore;
using MySqlConnector;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Abstractions;
using SV5T.Infrastructure.Persistence.Context;

namespace SV5T.Infrastructure.Persistence.UnitOfWork;

public sealed class UnitOfWork(ApplicationDbContext dbContext) : IUnitOfWork
{
    public async Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        try
        {
            return await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Dữ liệu đã bị thay đổi bởi thao tác khác trong lúc bạn đang thực hiện. Vui lòng tải lại trang và thử lại.",
                "concurrency_conflict");
        }
        catch (DbUpdateException exception) when (IsStudentCodeConflict(exception))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Mã sinh viên đã được sử dụng.",
                "student_code_taken");
        }
    }

    public async Task ExecuteInTransactionAsync(
        Func<CancellationToken, Task> operation,
        CancellationToken cancellationToken = default)
    {
        await using var transaction =
            await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            await operation(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static bool IsStudentCodeConflict(DbUpdateException exception) =>
        exception.InnerException is MySqlException { Number: 1062 } mysql &&
        mysql.Message.Contains(
            "IX_user_profiles_StudentCode",
            StringComparison.OrdinalIgnoreCase);
}


using SV5T.Application.Admin.Students.Abstractions;
using SV5T.Domain.Admin;
using SV5T.Infrastructure.Persistence.Context;

namespace SV5T.Infrastructure.Persistence.Repositories.Admin;

public sealed class AdminAuditLogRepository(ApplicationDbContext dbContext) : IAdminAuditLogRepository
{
    public Task AddAsync(AdminAuditLog log, CancellationToken cancellationToken = default) =>
        dbContext.AdminAuditLogs.AddAsync(log, cancellationToken).AsTask();
}

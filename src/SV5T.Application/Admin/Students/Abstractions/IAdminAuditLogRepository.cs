using SV5T.Domain.Admin;

namespace SV5T.Application.Admin.Students.Abstractions;

public interface IAdminAuditLogRepository
{
    Task AddAsync(AdminAuditLog log, CancellationToken cancellationToken = default);
}

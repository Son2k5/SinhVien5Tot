using Microsoft.EntityFrameworkCore;
using SV5T.Application.Interfaces.Repositories;
using SV5T.Domain.Entities;
using SV5T.Infrastructure.Persistence;

namespace SV5T.Infrastructure.Repositories;

public sealed class UserRepository(ApplicationDbContext dbContext) : IUserRepository
{
    public Task<User?> GetByIdAsync(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        return dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(user => user.Id == id, cancellationToken);
    }

    public Task<User?> GetByNormalizedEmailAsync(
        string normalizedEmail,
        bool tracking = false,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.Users.AsQueryable();
        if (!tracking)
        {
            query = query.AsNoTracking();
        }
        return query.FirstOrDefaultAsync(
            user => user.NormalizedEmail == normalizedEmail,
            cancellationToken);
    }

    public Task AddAsync(
        User user,
        CancellationToken cancellationToken = default)
    {
        return dbContext.Users.AddAsync(user, cancellationToken).AsTask();
    }
}

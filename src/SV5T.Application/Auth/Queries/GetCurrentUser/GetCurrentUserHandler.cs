using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Abstractions;
using SV5T.Domain.Users;

namespace SV5T.Application.Auth.Queries.GetCurrentUser;

public sealed record GetCurrentUserQuery;

public sealed record CurrentUserDto(
    Guid Id,
    string Email,
    string? DisplayName,
    string Role,
    string? AvatarUrl);

public sealed class GetCurrentUserHandler(
    ICurrentUser currentUser,
    IUserRepository userRepository) : IQueryHandler<GetCurrentUserQuery, CurrentUserDto>
{
    public async Task<CurrentUserDto> HandleAsync(GetCurrentUserQuery query, CancellationToken cancellationToken = default)
    {
        if (!currentUser.UserId.HasValue)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phiên đăng nhập không hợp lệ.",
                "invalid_session");
        }

        var user = await userRepository.GetByIdAsync(currentUser.UserId.Value, cancellationToken);
        if (user is null || !user.IsActive || !user.IsVerified)
        {
            throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy người dùng.",
                "user_not_found");
        }

        return new CurrentUserDto(
            user.Id,
            user.Email,
            user.DisplayName,
            user.Role.ToString(),
            user.AvatarUrl);
    }
}

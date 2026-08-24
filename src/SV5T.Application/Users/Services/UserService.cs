using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using SV5T.Application.Common.Interfaces;
using SV5T.Application.Users.Commands.UpdateAvatar;
using SV5T.Application.Users.Commands.UpdateProfile;
using SV5T.Application.Users.Dtos;
using SV5T.Application.Users.Queries.GetMyProfile;
using SV5T.Application.Users.Queries.GetUserById;
using SV5T.Domain.Users;

namespace SV5T.Application.Users.Services;

public interface IUserService
{
    Task<UserDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<UserProfileDto?> GetMyProfileAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<UserProfileDto> UpdateMyProfileAsync(Guid userId, UpdateUserProfileRequest request, CancellationToken cancellationToken = default);
    Task<UserDto> UpdateMyAvatarAsync(Guid userId, UpdateUserAvatarRequest request, CancellationToken cancellationToken = default);
}

public sealed class UserService : IUserService
{
    private readonly GetUserByIdHandler _getUserByIdHandler;
    private readonly GetMyProfileHandler _getMyProfileHandler;
    private readonly UpdateProfileHandler _updateProfileHandler;
    private readonly UpdateAvatarHandler _updateAvatarHandler;

    public UserService(
        GetUserByIdHandler getUserByIdHandler,
        GetMyProfileHandler getMyProfileHandler,
        UpdateProfileHandler updateProfileHandler,
        UpdateAvatarHandler updateAvatarHandler)
    {
        _getUserByIdHandler = getUserByIdHandler;
        _getMyProfileHandler = getMyProfileHandler;
        _updateProfileHandler = updateProfileHandler;
        _updateAvatarHandler = updateAvatarHandler;
    }

    public Task<UserDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _getUserByIdHandler.HandleAsync(new GetUserByIdQuery(id), cancellationToken);

    public Task<UserProfileDto?> GetMyProfileAsync(Guid userId, CancellationToken cancellationToken = default) =>
        _getMyProfileHandler.HandleAsync(new GetMyProfileQuery(userId), cancellationToken);

    public Task<UserProfileDto> UpdateMyProfileAsync(Guid userId, UpdateUserProfileRequest request, CancellationToken cancellationToken = default) =>
        _updateProfileHandler.HandleAsync(new UpdateProfileCommand(userId, request), cancellationToken);

    public Task<UserDto> UpdateMyAvatarAsync(Guid userId, UpdateUserAvatarRequest request, CancellationToken cancellationToken = default) =>
        _updateAvatarHandler.HandleAsync(new UpdateAvatarCommand(userId, request), cancellationToken);
}

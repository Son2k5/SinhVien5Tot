using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Users.Commands.UpdateAvatar;
using SV5T.Application.Users.Commands.UpdateProfile;
using SV5T.Application.Users.Dtos;
using SV5T.Application.Users.Queries.GetMyProfile;
using SV5T.Application.Users.Queries.GetUserById;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/users")]
public sealed class UsersController(
    ISender sender,
    ICurrentUser currentUser) : ControllerBase
{
    private const long MaxAvatarBytes = 5 * 1024 * 1024;
    private const long MaxAvatarRequestBytes = MaxAvatarBytes + 64 * 1024;

    [HttpGet("me")]
    [ProducesResponseType<UserDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserDto>> GetMe(CancellationToken cancellationToken)
    {
        if (!currentUser.UserId.HasValue)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phiên đăng nhập không hợp lệ.",
                "invalid_session");
        }

        var user = await sender.Send(
            new GetUserByIdQuery(currentUser.UserId.Value),
            cancellationToken);

        if (user is null)
        {
            throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy người dùng.",
                "user_not_found");
        }

        return Ok(user);
    }

    [HttpGet("me/profile")]
    [ProducesResponseType<UserProfileDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<UserProfileDto>> GetMyProfile(
        CancellationToken cancellationToken)
    {
        var profile = await sender.Send(
            new GetMyProfileQuery(RequireUserId()), cancellationToken);
        if (profile is null)
        {
            throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Hồ sơ cá nhân chưa được tạo.",
                "profile_not_found");
        }

        return Ok(profile);
    }

    [HttpPut("me/profile")]
    [ProducesResponseType<UserProfileDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UserProfileDto>> UpdateMyProfile(
        UpdateUserProfileRequest request,
        CancellationToken cancellationToken)
    {
        var profile = await sender.Send(
            new UpdateProfileCommand(RequireUserId(), request), cancellationToken);
        return Ok(profile);
    }

    [HttpPut("me/avatar")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxAvatarRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxAvatarRequestBytes)]
    [ProducesResponseType<UserDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<UserDto>> UpdateMyAvatar(
        [FromForm] UpdateMyAvatarForm form,
        CancellationToken cancellationToken)
    {
        var avatar = form.Avatar;
        if (avatar is null || avatar.Length == 0 || avatar.Length > MaxAvatarBytes)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Ảnh đại diện phải có dung lượng từ 1 byte đến 5 MB.",
                "invalid_avatar_size");
        }

        await using var content = new MemoryStream((int)avatar.Length);
        await avatar.CopyToAsync(content, cancellationToken);
        content.Position = 0;
        var user = await sender.Send(
            new UpdateAvatarCommand(
                RequireUserId(),
                new UpdateUserAvatarRequest(content, avatar.FileName, avatar.Length)),
            cancellationToken);
        return Ok(user);
    }

    private Guid RequireUserId()
    {
        if (currentUser.UserId.HasValue)
        {
            return currentUser.UserId.Value;
        }

        throw new UseCaseException(
            ApplicationErrorKind.Unauthorized,
            "Phiên đăng nhập không hợp lệ.",
            "invalid_session");
    }

    public sealed class UpdateMyAvatarForm
    {
        [FromForm(Name = "avatar")]
        public IFormFile? Avatar { get; set; }
    }
}

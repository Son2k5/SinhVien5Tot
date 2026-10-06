using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Me;
using SV5T.Application.Users.Commands.UpdateAvatar;
using SV5T.Application.Users.Dtos;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,Mentor")]
[Route("api/staff/me")]
public sealed class StaffMeController(
    ISender sender,
    ICurrentUser currentUser) : ControllerBase
{
    private const long MaxAvatarBytes = 5 * 1024 * 1024;
    private const long MaxAvatarRequestBytes = MaxAvatarBytes + 64 * 1024;

    [HttpGet]
    [ProducesResponseType<MyStaffProfileResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<MyStaffProfileResponse>> Get(
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(new GetMyStaffProfileQuery(), cancellationToken));

    [HttpPut]
    [EnableRateLimiting("profile-write")]
    [ProducesResponseType<MyStaffProfileResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<MyStaffProfileResponse>> Update(
        UpdateMyStaffProfileRequest request,
        CancellationToken cancellationToken) =>
        Ok(await sender.Send(
            new UpdateMyStaffProfileCommand(
                request.FullName,
                request.Phone,
                request.RowVersion),
            cancellationToken));

    [HttpPost("avatar")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxAvatarRequestBytes)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxAvatarRequestBytes)]
    [EnableRateLimiting("profile-write")]
    [ProducesResponseType<MyStaffAvatarResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<MyStaffAvatarResponse>> UploadAvatar(
        [FromForm] UploadMyAvatarForm form,
        CancellationToken cancellationToken)
    {
        var file = form.File;
        if (file is null || file.Length <= 0 || file.Length > MaxAvatarBytes)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Validation,
                "Ảnh đại diện phải có dung lượng từ 1 byte đến 5 MB.",
                "invalid_avatar_size");
        }

        await using var content = file.OpenReadStream();
        var user = await sender.Send(
            new UpdateAvatarCommand(
                RequireUserId(),
                new UpdateUserAvatarRequest(
                    content,
                    file.FileName,
                    file.Length)),
            cancellationToken);
        return Ok(new MyStaffAvatarResponse(user.AvatarUrl));
    }

    [HttpDelete("avatar")]
    [EnableRateLimiting("profile-write")]
    [ProducesResponseType<MyStaffAvatarResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status429TooManyRequests)]
    public async Task<ActionResult<MyStaffAvatarResponse>> RemoveAvatar(
        CancellationToken cancellationToken)
    {
        var user = await sender.Send(
            new RemoveAvatarCommand(RequireUserId()),
            cancellationToken);
        return Ok(new MyStaffAvatarResponse(user.AvatarUrl));
    }

    private Guid RequireUserId() =>
        currentUser.UserId ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized,
            "Phiên đăng nhập không hợp lệ.",
            "invalid_session");

    public sealed class UploadMyAvatarForm
    {
        [FromForm(Name = "file")]
        public IFormFile? File { get; set; }
    }
}

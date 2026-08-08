using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Interfaces.Services.Commons;
using SV5T.Application.DTOs.Users;
using SV5T.Application.Interfaces.Services.Users;

namespace SV5T.Presentation.Controllers;

[ApiController]
[Authorize]
[Route("api/users")]
public sealed class UsersController(
    IUserService userService,
    ICurrentUser currentUser) : ControllerBase
{
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

        var user = await userService.GetByIdAsync(
            currentUser.UserId.Value,
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
}

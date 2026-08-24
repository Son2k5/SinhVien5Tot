using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize(Roles = "Admin,Mentor")]
[Route("api/admin/capabilities")]
public sealed class AdminCapabilitiesController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<AdminCapabilitiesResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public ActionResult<AdminCapabilitiesResponse> Get() =>
        Ok(new AdminCapabilitiesResponse(
            true,
            User.IsInRole("Admin"),
            User.IsInRole("Admin")));

    [HttpGet("role-management")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType<AdminModuleAccessResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public ActionResult<AdminModuleAccessResponse> GetRoleManagementAccess() =>
        Ok(new AdminModuleAccessResponse("role-management", true));

    [HttpGet("standard-configuration")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType<AdminModuleAccessResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public ActionResult<AdminModuleAccessResponse> GetStandardConfigurationAccess() =>
        Ok(new AdminModuleAccessResponse("standard-configuration", true));
}

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Welcome.Dtos;
using SV5T.Application.Welcome.Queries;

namespace SV5T.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/welcome")]
public sealed class WelcomeController(IWelcomeDashboardService welcomeService)
    : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<WelcomeDashboardResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WelcomeDashboardResponse>> Get(
        CancellationToken cancellationToken)
    {
        var response = await welcomeService.GetAsync(cancellationToken);
        return Ok(response);
    }
}

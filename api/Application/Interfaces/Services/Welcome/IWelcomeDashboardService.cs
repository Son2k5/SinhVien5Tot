using SV5T.Application.DTOs.Welcome;

namespace SV5T.Application.Interfaces.Services.Welcome;

public interface IWelcomeDashboardService
{
    Task<WelcomeDashboardResponse> GetAsync(
        CancellationToken cancellationToken = default);
}

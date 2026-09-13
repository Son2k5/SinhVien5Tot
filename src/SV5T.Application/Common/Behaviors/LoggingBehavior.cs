using System.Diagnostics;
using MediatR;
using Microsoft.Extensions.Logging;

namespace SV5T.Application.Common.Behaviors;

public sealed class LoggingBehavior<TRequest, TResponse>(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken
    )
    {
        var name = typeof(TRequest).Name;
        var stopwatch = Stopwatch.StartNew();
        try
        {
            logger.LogInformation("Handling {RequestName} {@Request}", name, request);
            var response = await next();
            stopwatch.Stop();
            logger.LogInformation("Handled {RequestName} in {ElapsedMs}ms", name, stopwatch.ElapsedMilliseconds);
            return response;
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            logger.LogWarning(ex, "Failed {RequestName} after {ElapsedMs}ms", name, stopwatch.ElapsedMilliseconds);
            throw;
        }
    }
}

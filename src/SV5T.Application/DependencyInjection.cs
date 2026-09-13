using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SV5T.Application.Common.Behaviors;

namespace SV5T.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Validators
        services.AddValidatorsFromAssemblyContaining(typeof(DependencyInjection));

        // MediatR & Pipeline Behaviors
        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly);
            cfg.AddOpenBehavior(typeof(LoggingBehavior<,>));
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
        });

        return services;
    }
}

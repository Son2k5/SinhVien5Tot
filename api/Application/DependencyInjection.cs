using Microsoft.Extensions.DependencyInjection;
using FluentValidation;
using SV5T.Application.DTOs.Auth;
using SV5T.Application.Interfaces.Services.Auth;
using SV5T.Application.Services;
using SV5T.Application.Validators;
using SV5T.Application.Interfaces.Services.Users;

namespace SV5T.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IValidator<RegisterRequest>, RegisterRequestValidator>();
        services.AddScoped<IValidator<LoginRequest>, LoginRequestValidator>();
        services.AddScoped<IValidator<VerifyOtpRequest>, VerifyOtpRequestValidator>();
        services.AddScoped<IValidator<ResendOtpRequest>, ResendOtpRequestValidator>();
        services.AddScoped<IValidator<ForgotPasswordRequest>, ForgotPasswordRequestValidator>();
        services.AddScoped<IValidator<VerifyResetOtpRequest>, VerifyResetOtpRequestValidator>();
        services.AddScoped<IValidator<ResetPasswordRequest>, ResetPasswordRequestValidator>();

        return services;
    }
}

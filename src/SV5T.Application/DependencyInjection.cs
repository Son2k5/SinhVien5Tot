using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Queries;
using SV5T.Application.Admin.Validators;
using SV5T.Application.Auth.Commands.ForgotPassword;
using SV5T.Application.Auth.Commands.Login;
using SV5T.Application.Auth.Commands.Logout;
using SV5T.Application.Auth.Commands.RefreshToken;
using SV5T.Application.Auth.Commands.Register;
using SV5T.Application.Auth.Commands.ResendOtp;
using SV5T.Application.Auth.Commands.ResetPassword;
using SV5T.Application.Auth.Commands.VerifyOtp;
using SV5T.Application.Auth.Commands.VerifyResetOtp;
using SV5T.Application.Auth.Dtos;
using SV5T.Application.Auth.Queries.GetCurrentUser;
using SV5T.Application.Auth.Services;
using SV5T.Application.Auth.Validators;
using SV5T.Application.Users.Commands.UpdateAvatar;
using SV5T.Application.Users.Commands.UpdateProfile;
using SV5T.Application.Users.Dtos;
using SV5T.Application.Users.Queries.GetMyProfile;
using SV5T.Application.Users.Queries.GetUserById;
using SV5T.Application.Users.Services;
using SV5T.Application.Users.Validators;
using SV5T.Application.Welcome.Queries;

namespace SV5T.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        // Users Handlers & Services
        services.AddScoped<GetUserByIdHandler>();
        services.AddScoped<GetMyProfileHandler>();
        services.AddScoped<UpdateProfileHandler>();
        services.AddScoped<UpdateAvatarHandler>();
        services.AddScoped<IUserService, UserService>();

        // Auth Handlers & Services
        services.AddScoped<RegisterHandler>();
        services.AddScoped<VerifyOtpHandler>();
        services.AddScoped<ResendOtpHandler>();
        services.AddScoped<LoginHandler>();
        services.AddScoped<RefreshTokenHandler>();
        services.AddScoped<LogoutHandler>();
        services.AddScoped<ForgotPasswordHandler>();
        services.AddScoped<VerifyResetOtpHandler>();
        services.AddScoped<ResetPasswordHandler>();
        services.AddScoped<GetCurrentUserHandler>();
        services.AddScoped<IAuthService, AuthService>();

        // Admin & Welcome
        services.AddScoped<AdminDashboardService>();
        services.AddScoped<IAdminDashboardService>(sp => sp.GetRequiredService<AdminDashboardService>());
        services.AddScoped<WelcomeDashboardService>();
        services.AddScoped<IWelcomeDashboardService>(sp => sp.GetRequiredService<WelcomeDashboardService>());

        // Validators
        services.AddScoped<IValidator<RegisterRequest>, RegisterRequestValidator>();
        services.AddScoped<IValidator<LoginRequest>, LoginRequestValidator>();
        services.AddScoped<IValidator<VerifyOtpRequest>, VerifyOtpRequestValidator>();
        services.AddScoped<IValidator<ResendOtpRequest>, ResendOtpRequestValidator>();
        services.AddScoped<IValidator<ForgotPasswordRequest>, ForgotPasswordRequestValidator>();
        services.AddScoped<IValidator<VerifyResetOtpRequest>, VerifyResetOtpRequestValidator>();
        services.AddScoped<IValidator<ResetPasswordRequest>, ResetPasswordRequestValidator>();
        services.AddScoped<IValidator<UpdateUserProfileRequest>, UpdateUserProfileRequestValidator>();
        services.AddScoped<IValidator<UpdateUserAddressRequest>, UpdateUserAddressRequestValidator>();
        services.AddScoped<IValidator<AdminDashboardFilterRequest>, AdminDashboardFilterRequestValidator>();

        return services;
    }
}

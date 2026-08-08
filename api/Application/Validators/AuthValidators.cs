using FluentValidation;
using SV5T.Application.DTOs.Auth;
using SV5T.Application.Interfaces.Services.Auth;

namespace SV5T.Application.Validators;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator(ISchoolEmailValidator schoolEmailValidator)
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .MaximumLength(255)
            .EmailAddress()
            .Must(schoolEmailValidator.IsAllowed)
            .WithMessage("Email phải thuộc tên miền của trường.");

        RuleFor(x => x.Password)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(128)
            .Matches("[A-Za-z]").WithMessage("Mật khẩu phải có chữ.")
            .Matches("[0-9]").WithMessage("Mật khẩu phải có số.");
    }
}

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().MaximumLength(255).EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MaximumLength(128);
    }
}

public sealed class VerifyOtpRequestValidator : AbstractValidator<VerifyOtpRequest>
{
    public VerifyOtpRequestValidator()
    {
        RuleFor(x => x.RegistrationId).NotEmpty();
        RuleFor(x => x.Otp).NotEmpty().Matches("^\\d{6}$");
    }
}

public sealed class ResendOtpRequestValidator : AbstractValidator<ResendOtpRequest>
{
    public ResendOtpRequestValidator()
    {
        RuleFor(x => x.RegistrationId).NotEmpty();
    }
}

public sealed class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().MaximumLength(255).EmailAddress();
    }
}

public sealed class VerifyResetOtpRequestValidator : AbstractValidator<VerifyResetOtpRequest>
{
    public VerifyResetOtpRequestValidator()
    {
        RuleFor(x => x.ResetId).NotEmpty();
        RuleFor(x => x.Otp).NotEmpty().Matches("^\\d{6}$");
    }
}

public sealed class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.ResetId).NotEmpty();
        RuleFor(x => x.Otp).NotEmpty().Matches("^\\d{6}$");
        RuleFor(x => x.NewPassword)
            .NotEmpty()
            .MinimumLength(8)
            .MaximumLength(128)
            .Matches("[A-Za-z]")
            .Matches("[0-9]");
    }
}

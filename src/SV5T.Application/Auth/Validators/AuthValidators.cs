using FluentValidation;
using SV5T.Application.Auth.Dtos;
using SV5T.Application.Common.Abstractions;

namespace SV5T.Application.Auth.Validators;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator(ISchoolEmailValidator schoolEmailValidator)
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Họ và tên không được để trống.")
            .MaximumLength(100).WithMessage("Họ và tên không được vượt quá 100 ký tự.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .MaximumLength(255).WithMessage("Email không được vượt quá 255 ký tự.")
            .EmailAddress().WithMessage("Định dạng email không hợp lệ.")
            .Must(schoolEmailValidator.IsAllowed)
            .WithMessage("Email phải thuộc tên miền của trường.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.")
            .MinimumLength(8).WithMessage("Mật khẩu phải có ít nhất 8 ký tự.")
            .MaximumLength(128).WithMessage("Mật khẩu không được vượt quá 128 ký tự.")
            .Matches("[A-Za-z]").WithMessage("Mật khẩu phải chứa ít nhất một chữ cái.")
            .Matches("[0-9]").WithMessage("Mật khẩu phải chứa ít nhất một chữ số.");
    }
}

public sealed class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .MaximumLength(255).WithMessage("Email không được vượt quá 255 ký tự.")
            .EmailAddress().WithMessage("Định dạng email không hợp lệ.");
        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.")
            .MaximumLength(128).WithMessage("Mật khẩu không được vượt quá 128 ký tự.");
    }
}

public sealed class VerifyOtpRequestValidator : AbstractValidator<VerifyOtpRequest>
{
    public VerifyOtpRequestValidator()
    {
        RuleFor(x => x.RegistrationId)
            .NotEmpty().WithMessage("Mã đăng ký không hợp lệ.");
        RuleFor(x => x.Otp)
            .NotEmpty().WithMessage("Mã OTP không được để trống.")
            .Matches("^\\d{6}$").WithMessage("Mã OTP phải gồm đúng 6 chữ số.");
    }
}

public sealed class ResendOtpRequestValidator : AbstractValidator<ResendOtpRequest>
{
    public ResendOtpRequestValidator()
    {
        RuleFor(x => x.RegistrationId)
            .NotEmpty().WithMessage("Mã đăng ký không hợp lệ.");
    }
}

public sealed class ForgotPasswordRequestValidator : AbstractValidator<ForgotPasswordRequest>
{
    public ForgotPasswordRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .MaximumLength(255).WithMessage("Email không được vượt quá 255 ký tự.")
            .EmailAddress().WithMessage("Định dạng email không hợp lệ.");
    }
}

public sealed class VerifyResetOtpRequestValidator : AbstractValidator<VerifyResetOtpRequest>
{
    public VerifyResetOtpRequestValidator()
    {
        RuleFor(x => x.ResetId)
            .NotEmpty().WithMessage("Mã yêu cầu không hợp lệ.");
        RuleFor(x => x.Otp)
            .NotEmpty().WithMessage("Mã OTP không được để trống.")
            .Matches("^\\d{6}$").WithMessage("Mã OTP phải gồm đúng 6 chữ số.");
    }
}

public sealed class ResetPasswordRequestValidator : AbstractValidator<ResetPasswordRequest>
{
    public ResetPasswordRequestValidator()
    {
        RuleFor(x => x.ResetId)
            .NotEmpty().WithMessage("Mã yêu cầu không hợp lệ.");
        RuleFor(x => x.Otp)
            .NotEmpty().WithMessage("Mã OTP không được để trống.")
            .Matches("^\\d{6}$").WithMessage("Mã OTP phải gồm đúng 6 chữ số.");
        RuleFor(x => x.NewPassword)
            .NotEmpty().WithMessage("Mật khẩu mới không được để trống.")
            .MinimumLength(8).WithMessage("Mật khẩu mới phải có ít nhất 8 ký tự.")
            .MaximumLength(128).WithMessage("Mật khẩu mới không được vượt quá 128 ký tự.")
            .Matches("[A-Za-z]").WithMessage("Mật khẩu phải chứa ít nhất một chữ cái.")
            .Matches("[0-9]").WithMessage("Mật khẩu phải chứa ít nhất một chữ số.");
    }
}

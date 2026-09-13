using FluentValidation;
using SV5T.Application.Users.Dtos;

namespace SV5T.Application.Users.Commands.UpdateProfile;

public sealed class UpdateProfileCommandValidator : AbstractValidator<UpdateProfileCommand>
{
    public UpdateProfileCommandValidator(IValidator<UpdateUserProfileRequest> requestValidator)
    {
        RuleFor(x => x.UserId).NotEmpty().WithMessage("Thiếu định danh người dùng.");
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu thông tin cập nhật hồ sơ.");
        RuleFor(x => x.Request).SetValidator(requestValidator!);
    }
}

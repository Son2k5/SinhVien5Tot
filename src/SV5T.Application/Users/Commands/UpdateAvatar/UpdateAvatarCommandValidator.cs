using FluentValidation;

namespace SV5T.Application.Users.Commands.UpdateAvatar;

public sealed class UpdateAvatarCommandValidator : AbstractValidator<UpdateAvatarCommand>
{
    private const long MaxAvatarBytes = 5 * 1024 * 1024;

    public UpdateAvatarCommandValidator()
    {
        RuleFor(x => x.UserId).NotEmpty().WithMessage("Thiếu định danh người dùng.");
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu thông tin ảnh đại diện.");
        RuleFor(x => x.Request.Length)
            .GreaterThan(0).WithMessage("Kích thước ảnh đại diện không hợp lệ.")
            .LessThanOrEqualTo(MaxAvatarBytes).WithMessage("Kích thước ảnh đại diện không được vượt quá 5MB.");
    }
}

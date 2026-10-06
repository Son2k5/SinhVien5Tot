using System.Text.RegularExpressions;
using FluentValidation;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Users.Abstractions;

namespace SV5T.Application.Me;

public sealed record UpdateMyStaffProfileCommand(
    string FullName,
    string? Phone,
    string RowVersion) : IRequest<MyStaffProfileResponse>;

public sealed class UpdateMyStaffProfileCommandValidator
    : AbstractValidator<UpdateMyStaffProfileCommand>
{
    private static readonly Regex PhonePattern = new(
        @"^(0|\+84)\d{9,10}$",
        RegexOptions.CultureInvariant,
        TimeSpan.FromMilliseconds(100));

    public UpdateMyStaffProfileCommandValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ tên không được để trống.")
            .Must(value => value is not null && value.Trim().Length is >= 2 and <= 100)
            .WithMessage("Họ tên phải có từ 2 đến 100 ký tự.")
            .Must(value => value is not null && !value.Any(char.IsControl))
            .WithMessage("Họ tên chứa ký tự không hợp lệ.");

        RuleFor(x => x.Phone)
            .Must(value => string.IsNullOrWhiteSpace(value) || PhonePattern.IsMatch(value.Trim()))
            .WithMessage("Số điện thoại không đúng định dạng.");

        RuleFor(x => x.RowVersion)
            .Must(value => MyStaffProfileVersion.TryDecode(value, out _))
            .WithMessage("Phiên bản hồ sơ không hợp lệ.");
    }
}

public sealed class UpdateMyStaffProfileHandler(
    ICurrentUser currentUser,
    IUserRepository users,
    IUnitOfWork unitOfWork)
    : IRequestHandler<UpdateMyStaffProfileCommand, MyStaffProfileResponse>
{
    public async Task<MyStaffProfileResponse> Handle(
        UpdateMyStaffProfileCommand command,
        CancellationToken cancellationToken)
    {
        var userId = MyStaffProfileSupport.RequireStaffUserId(currentUser);
        var user = await users.GetStaffUserForUpdateAsync(userId, cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy hồ sơ nhân sự.",
                "staff_profile_not_found");

        if (!MyStaffProfileVersion.TryDecode(command.RowVersion, out var expectedVersion) ||
            !MyStaffProfileVersion.Matches(user.UpdatedAt, expectedVersion))
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Hồ sơ đã được thay đổi. Vui lòng tải lại và thử lại.",
                "concurrency_conflict");
        }

        user.DisplayName = command.FullName.Trim();
        user.PhoneNumber = string.IsNullOrWhiteSpace(command.Phone)
            ? null
            : command.Phone.Trim();
        user.UpdatedAt = MyStaffProfileVersion.UtcNowForDatabase();
        user.UpdatedBy = userId.ToString("D");

        await unitOfWork.SaveChangesAsync(cancellationToken);
        return MyStaffProfileSupport.ToResponse(user);
    }
}

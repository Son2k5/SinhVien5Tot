using FluentValidation;
using SV5T.Application.Users.Dtos;

namespace SV5T.Application.Users.Validators;

public sealed class UpdateUserAddressRequestValidator : AbstractValidator<UpdateUserAddressRequest>
{
    public UpdateUserAddressRequestValidator()
    {
        RuleFor(x => x.AddressType)
            .IsInEnum().WithMessage("Loại địa chỉ không hợp lệ.");
        RuleFor(x => x.ProvinceOrCity)
            .NotEmpty().WithMessage("Tỉnh/Thành phố không được để trống.")
            .MaximumLength(255).WithMessage("Tỉnh/Thành phố không được vượt quá 255 ký tự.");
        RuleFor(x => x.District)
            .NotEmpty().WithMessage("Quận/Huyện không được để trống.")
            .MaximumLength(255).WithMessage("Quận/Huyện không được vượt quá 255 ký tự.");
        RuleFor(x => x.StreetAddress)
            .NotEmpty().WithMessage("Địa chỉ chi tiết không được để trống.")
            .MaximumLength(500).WithMessage("Địa chỉ chi tiết không được vượt quá 500 ký tự.");
    }
}

public sealed class UpdateUserProfileRequestValidator : AbstractValidator<UpdateUserProfileRequest>
{
    public UpdateUserProfileRequestValidator()
    {
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Họ và tên không được để trống.")
            .MaximumLength(255).WithMessage("Họ và tên không được vượt quá 255 ký tự.");
        RuleFor(x => x.BirthDate)
            .Must(BeAReasonableStudentAge)
            .WithMessage("Sinh viên phải từ 16 đến 100 tuổi.");
        RuleFor(x => x.Gender)
            .IsInEnum().WithMessage("Giới tính không hợp lệ.");
        RuleFor(x => x.IdentityCardNumber)
            .NotEmpty().WithMessage("Số CCCD/Hộ chiếu không được để trống.")
            .MaximumLength(50).WithMessage("Số CCCD/Hộ chiếu không được vượt quá 50 ký tự.");
        RuleFor(x => x.Ethnicity)
            .NotEmpty().WithMessage("Dân tộc không được để trống.")
            .MaximumLength(100).WithMessage("Dân tộc không được vượt quá 100 ký tự.");
        RuleFor(x => x.School)
            .NotEmpty().WithMessage("Trường không được để trống.")
            .MaximumLength(255).WithMessage("Trường không được vượt quá 255 ký tự.");
        RuleFor(x => x.Major)
            .MaximumLength(255).WithMessage("Ngành học không được vượt quá 255 ký tự.");
        RuleFor(x => x.AcademicYear)
            .InclusiveBetween(1, 8).WithMessage("Năm học phải từ năm 1 đến năm 8.");
        RuleFor(x => x.StudentCode)
            .NotEmpty().WithMessage("Mã số sinh viên không được để trống.")
            .MaximumLength(50).WithMessage("Mã số sinh viên không được vượt quá 50 ký tự.");
        RuleFor(x => x.AdministrativeClass)
            .NotEmpty().WithMessage("Lớp hành chính không được để trống.")
            .MaximumLength(100).WithMessage("Lớp hành chính không được vượt quá 100 ký tự.");
        RuleFor(x => x.Faculty)
            .NotEmpty().WithMessage("Khoa/Viện không được để trống.")
            .MaximumLength(255).WithMessage("Khoa/Viện không được vượt quá 255 ký tự.");
        RuleFor(x => x.CurrentPosition)
            .NotEmpty().WithMessage("Chức vụ hiện tại không được để trống.")
            .MaximumLength(255).WithMessage("Chức vụ hiện tại không được vượt quá 255 ký tự.");
        RuleFor(x => x.ContactEmail)
            .NotEmpty().WithMessage("Email liên hệ không được để trống.")
            .MaximumLength(255).WithMessage("Email liên hệ không được vượt quá 255 ký tự.")
            .EmailAddress().WithMessage("Định dạng email liên hệ không hợp lệ.");
        RuleFor(x => x.PhoneNumber)
            .NotEmpty().WithMessage("Số điện thoại không được để trống.")
            .MaximumLength(30).WithMessage("Số điện thoại không được vượt quá 30 ký tự.")
            .Matches("^(0|\\+84)\\d{9,10}$").WithMessage("Số điện thoại không đúng định dạng.");
        RuleFor(x => x.UnionPosition)
            .MaximumLength(255).WithMessage("Chức vụ Đoàn/Hội không được vượt quá 255 ký tự.");
        RuleFor(x => x.PoliticalStatus)
            .IsInEnum().WithMessage("Trạng thái chính trị không hợp lệ.");
        RuleFor(x => x.Addresses)
            .Cascade(CascadeMode.Stop).NotNull().WithMessage("Danh sách địa chỉ không được để trống.")
            .Must(addresses => addresses.Count <= 2).WithMessage("Tối đa 2 loại địa chỉ (thường trú và tạm trú).")
            .Must(addresses => addresses.Select(x => x.AddressType).Distinct().Count() == addresses.Count)
            .WithMessage("Loại địa chỉ không được trùng lặp.");
        RuleForEach(x => x.Addresses)
            .SetValidator(new UpdateUserAddressRequestValidator());
    }

    private static bool BeAReasonableStudentAge(DateOnly birthDate)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return birthDate <= today.AddYears(-16) && birthDate >= today.AddYears(-100);
    }
}

using FluentValidation;
using SV5T.Application.DTOs.Users;

namespace SV5T.Application.Validators;

public sealed class UpdateUserAddressRequestValidator : AbstractValidator<UpdateUserAddressRequest>
{
    public UpdateUserAddressRequestValidator()
    {
        RuleFor(x => x.AddressType).IsInEnum();
        RuleFor(x => x.ProvinceOrCity).NotEmpty().MaximumLength(255);
        RuleFor(x => x.District).NotEmpty().MaximumLength(255);
        RuleFor(x => x.StreetAddress).NotEmpty().MaximumLength(500);
    }
}

public sealed class UpdateUserProfileRequestValidator : AbstractValidator<UpdateUserProfileRequest>
{
    public UpdateUserProfileRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(255);
        RuleFor(x => x.BirthDate).Must(BeAReasonableStudentAge)
            .WithMessage("Sinh viên phải từ 16 đến 100 tuổi.");
        RuleFor(x => x.Gender).IsInEnum();
        RuleFor(x => x.IdentityCardNumber).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Ethnicity).NotEmpty().MaximumLength(100);
        RuleFor(x => x.School).NotEmpty().MaximumLength(255);
        RuleFor(x => x.Major).MaximumLength(255);
        RuleFor(x => x.AcademicYear).InclusiveBetween(1, 8);
        RuleFor(x => x.StudentCode).NotEmpty().MaximumLength(50);
        RuleFor(x => x.AdministrativeClass).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Faculty).NotEmpty().MaximumLength(255);
        RuleFor(x => x.CurrentPosition).NotEmpty().MaximumLength(255);
        RuleFor(x => x.ContactEmail).NotEmpty().MaximumLength(255).EmailAddress();
        RuleFor(x => x.PhoneNumber).NotEmpty().MaximumLength(30)
            .Matches("^(0|\\+84)\\d{9,10}$");
        RuleFor(x => x.UnionPosition).MaximumLength(255);
        RuleFor(x => x.PoliticalStatus).IsInEnum();
        RuleFor(x => x.Addresses).Cascade(CascadeMode.Stop).NotNull()
            .Must(addresses => addresses.Count <= 2)
            .Must(addresses => addresses.Select(x => x.AddressType).Distinct().Count() == addresses.Count);
        RuleForEach(x => x.Addresses)
            .SetValidator(new UpdateUserAddressRequestValidator());
    }

    private static bool BeAReasonableStudentAge(DateOnly birthDate)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        return birthDate <= today.AddYears(-16) && birthDate >= today.AddYears(-100);
    }
}

using FluentValidation;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.Validators;

public sealed class AdminDashboardFilterRequestValidator
    : AbstractValidator<AdminDashboardFilterRequest>
{
    private static readonly string[] AllowedLevels = ["school", "city", "central"];

    public AdminDashboardFilterRequestValidator()
    {
        RuleFor(x => x.CampaignId).MaximumLength(100);
        RuleFor(x => x.SchoolYear)
            .MaximumLength(20)
            .Matches("^\\d{4}-\\d{4}$")
            .When(x => !string.IsNullOrWhiteSpace(x.SchoolYear));
        RuleFor(x => x.Level)
            .Must(level => string.IsNullOrWhiteSpace(level) ||
                AllowedLevels.Contains(level, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Cấp xét duyệt không hợp lệ.");
        RuleFor(x => x.DepartmentId).MaximumLength(100);
        RuleFor(x => x.To)
            .GreaterThanOrEqualTo(x => x.From)
            .When(x => x.From.HasValue && x.To.HasValue)
            .WithMessage("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.");
        RuleFor(x => x.Limit).InclusiveBetween(1, 100).When(x => x.Limit.HasValue);
        RuleFor(x => x.OverdueDays).InclusiveBetween(1, 365).When(x => x.OverdueDays.HasValue);
    }
}

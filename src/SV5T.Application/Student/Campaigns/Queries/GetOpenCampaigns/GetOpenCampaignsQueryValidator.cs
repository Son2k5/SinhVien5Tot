using FluentValidation;

namespace SV5T.Application.Student.Campaigns.Queries.GetOpenCampaigns;

public sealed class GetOpenCampaignsQueryValidator : AbstractValidator<GetOpenCampaignsQuery>
{
    public GetOpenCampaignsQueryValidator()
    {
        RuleFor(x => x.PageIndex).GreaterThanOrEqualTo(1).WithMessage("PageIndex phai >= 1.");
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100).WithMessage("PageSize phai tu 1 den 100.");
        RuleFor(x => x.SchoolYear)
            .MaximumLength(16).WithMessage("SchoolYear toi da 16 ky tu.")
            .When(x => !string.IsNullOrWhiteSpace(x.SchoolYear));
        RuleFor(x => x.Level).IsInEnum().When(x => x.Level.HasValue).WithMessage("Level khong hop le.");
    }
}

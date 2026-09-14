using FluentValidation;

namespace SV5T.Application.Student.Applications.Queries.GetMyApplications;

public sealed class GetMyApplicationsQueryValidator : AbstractValidator<GetMyApplicationsQuery>
{
    public GetMyApplicationsQueryValidator()
    {
        RuleFor(x => x.PageIndex).GreaterThanOrEqualTo(1).WithMessage("PageIndex phai >= 1.");
        RuleFor(x => x.PageSize).InclusiveBetween(1, 100).WithMessage("PageSize phai tu 1 den 100.");
        RuleFor(x => x.Status).IsInEnum().When(x => x.Status.HasValue).WithMessage("Status khong hop le.");
    }
}

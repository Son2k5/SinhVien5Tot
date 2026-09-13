using FluentValidation;

namespace SV5T.Application.Criteria.Queries.GetCriteria;

public sealed class GetCriteriaQueryValidator : AbstractValidator<GetCriteriaQuery>
{
    public GetCriteriaQueryValidator()
    {
        RuleFor(x => x.StandardId).NotEmpty().WithMessage("Thiếu định danh tiêu chuẩn.");
    }
}

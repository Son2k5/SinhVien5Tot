using FluentValidation;

namespace SV5T.Application.Admin.Campaigns.Queries.GetCampaignById;

public sealed class GetCampaignByIdQueryValidator : AbstractValidator<GetCampaignByIdQuery>
{
    public GetCampaignByIdQueryValidator()
    {
        RuleFor(x => x.Id).NotEmpty().WithMessage("Thiếu định danh chiến dịch.");
    }
}

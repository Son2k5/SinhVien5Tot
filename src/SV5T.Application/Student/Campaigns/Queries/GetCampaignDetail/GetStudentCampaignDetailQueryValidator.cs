using FluentValidation;

namespace SV5T.Application.Student.Campaigns.Queries.GetCampaignDetail;

public sealed class GetStudentCampaignDetailQueryValidator : AbstractValidator<GetStudentCampaignDetailQuery>
{
    public GetStudentCampaignDetailQueryValidator()
    {
        RuleFor(x => x.CampaignId).NotEmpty().WithMessage("Thiếu định danh đợt xét.");
    }
}

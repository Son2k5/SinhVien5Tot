using FluentValidation;
using SV5T.Application.Admin.Dtos;

namespace SV5T.Application.Admin.Campaigns.Commands.CreateCampaign;

public sealed class CreateCampaignCommandValidator : AbstractValidator<CreateCampaignCommand>
{
    public CreateCampaignCommandValidator(IValidator<CreateCampaignRequest> requestValidator)
    {
        RuleFor(x => x.Request).NotNull().WithMessage("Thiếu thông tin chiến dịch.");
        RuleFor(x => x.Request).SetValidator(requestValidator!);
    }
}

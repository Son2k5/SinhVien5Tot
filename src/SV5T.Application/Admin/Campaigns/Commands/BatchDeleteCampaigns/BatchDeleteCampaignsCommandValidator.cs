using FluentValidation;

namespace SV5T.Application.Admin.Campaigns.Commands.BatchDeleteCampaigns;

public sealed class BatchDeleteCampaignsCommandValidator : AbstractValidator<BatchDeleteCampaignsCommand>
{
    public BatchDeleteCampaignsCommandValidator()
    {
        RuleFor(x => x.Ids)
            .NotEmpty()
            .WithMessage("Danh sách ID chiến dịch không được để trống.");
    }
}

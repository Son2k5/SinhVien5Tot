using FluentValidation;

namespace SV5T.Application.Student.Evidences.Commands.UpsertEvidence;

public sealed class UpsertEvidenceCommandValidator : AbstractValidator<UpsertEvidenceCommand>
{
    public UpsertEvidenceCommandValidator(IValidator<UpsertEvidenceRequest> requestValidator)
    {
        RuleFor(x => x.ApplicationId).NotEmpty().WithMessage("Thieu dinh danh ho so.");
        RuleFor(x => x.CriterionId).NotEmpty().WithMessage("Thieu dinh danh tieu chi.");
        RuleFor(x => x.Request).NotNull().WithMessage("Thieu thong tin minh chung.");
        RuleFor(x => x.Request).SetValidator(requestValidator!);
    }
}

public sealed class UpsertEvidenceRequestValidator : AbstractValidator<UpsertEvidenceRequest>
{
    public UpsertEvidenceRequestValidator()
    {
        RuleFor(x => x.DataJson).NotEmpty().WithMessage("DataJson khong duoc de trong.");
        RuleFor(x => x.DataJson)
            .Must(BeValidJson).WithMessage("DataJson phai la JSON hop le.")
            .When(x => !string.IsNullOrWhiteSpace(x.DataJson));
    }

    private static bool BeValidJson(string json)
    {
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            return true;
        }
        catch
        {
            return false;
        }
    }
}

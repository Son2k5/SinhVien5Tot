using System.Text.Json;
using FluentValidation;
using SV5T.Application.Admin.Dtos;
using SV5T.Domain.Criteria;
using SV5T.Domain.Evidences;
using SV5T.Domain.Standards.Enums;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Admin.Validators;

public sealed class CreateStandardSetRequestValidator : AbstractValidator<CreateStandardSetRequest>
{
    public CreateStandardSetRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên bộ tiêu chuẩn không được để trống.")
            .MaximumLength(255).WithMessage("Tên bộ tiêu chuẩn không được quá 255 ký tự.");

        RuleFor(x => x.AcademicYear)
            .NotEmpty().WithMessage("Năm học không được để trống.")
            .MaximumLength(20).WithMessage("Năm học không được quá 20 ký tự.");

        RuleFor(x => x.Level).IsInEnum().WithMessage("Cấp xét duyệt không hợp lệ.");
        RuleFor(x => x.AwardType).IsInEnum().WithMessage("Loại danh hiệu không hợp lệ.");
    }
}

public sealed class UpdateStandardSetRequestValidator : AbstractValidator<UpdateStandardSetRequest>
{
    public UpdateStandardSetRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên bộ tiêu chuẩn không được để trống.")
            .MaximumLength(255).WithMessage("Tên bộ tiêu chuẩn không được quá 255 ký tự.");

        RuleFor(x => x.AcademicYear)
            .NotEmpty().WithMessage("Năm học không được để trống.")
            .MaximumLength(20).WithMessage("Năm học không được quá 20 ký tự.");

        RuleFor(x => x.Level).IsInEnum().WithMessage("Cấp xét duyệt không hợp lệ.");
        RuleFor(x => x.AwardType).IsInEnum().WithMessage("Loại danh hiệu không hợp lệ.");
    }
}

public sealed class CreateStandardRequestValidator : AbstractValidator<CreateStandardRequest>
{
    public CreateStandardRequestValidator()
    {
        RuleFor(x => x.Code)
            .MaximumLength(50).WithMessage("Mã tiêu chuẩn không được quá 50 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Code));

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tên tiêu chuẩn không được để trống.")
            .MaximumLength(500).WithMessage("Tên tiêu chuẩn không được quá 500 ký tự.");

        RuleFor(x => x.Operator).IsInEnum().WithMessage("Toán tử không hợp lệ.");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Thứ tự hiển thị phải lớn hơn hoặc bằng 0.");

        RuleFor(x => x.MinimumSatisfied)
            .GreaterThan(0)
            .When(x => x.MinimumSatisfied.HasValue)
            .WithMessage("Số lượng tối thiểu đạt phải lớn hơn 0.");
    }
}

public sealed class UpdateStandardRequestValidator : AbstractValidator<UpdateStandardRequest>
{
    public UpdateStandardRequestValidator()
    {
        RuleFor(x => x.Code)
            .MaximumLength(50).WithMessage("Mã tiêu chuẩn không được quá 50 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Code));

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tên tiêu chuẩn không được để trống.")
            .MaximumLength(500).WithMessage("Tên tiêu chuẩn không được quá 500 ký tự.");

        RuleFor(x => x.Operator).IsInEnum().WithMessage("Toán tử không hợp lệ.");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Thứ tự hiển thị phải lớn hơn hoặc bằng 0.");

        RuleFor(x => x.MinimumSatisfied)
            .GreaterThan(0)
            .When(x => x.MinimumSatisfied.HasValue)
            .WithMessage("Số lượng tối thiểu đạt phải lớn hơn 0.");
    }
}

public sealed class CreateCriterionRequestValidator : AbstractValidator<CreateCriterionRequest>
{
    public CreateCriterionRequestValidator()
    {
        RuleFor(x => x.Code)
            .MaximumLength(50).WithMessage("Mã tiêu chí không được quá 50 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Code));

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tên tiêu chí không được để trống.")
            .MaximumLength(500).WithMessage("Tên tiêu chí không được quá 500 ký tự.");

        RuleFor(x => x.Type).IsInEnum().WithMessage("Loại tiêu chí không hợp lệ.");
        RuleFor(x => x.Operator).IsInEnum().WithMessage("Toán tử không hợp lệ.");
        RuleFor(x => x.EvaluationType).IsInEnum().WithMessage("Kiểu đánh giá không hợp lệ.");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Thứ tự hiển thị phải lớn hơn hoặc bằng 0.");

        RuleFor(x => x.MinimumSatisfied)
            .GreaterThan(0)
            .When(x => x.MinimumSatisfied.HasValue)
            .WithMessage("Số lượng tối thiểu đạt phải lớn hơn 0.");

        RuleFor(x => x.DefinitionJson)
            .NotEmpty()
            .When(x => x.Type == CriterionType.Requirement)
            .WithMessage("Tiêu chí loại Requirement phải có cấu hình DefinitionJson.");

        RuleFor(x => x.DefinitionJson)
            .Must(BeValidJson)
            .When(x => !string.IsNullOrWhiteSpace(x.DefinitionJson))
            .WithMessage("DefinitionJson không phải chuỗi JSON hợp lệ.");
    }

    private static bool BeValidJson(string json)
    {
        try
        {
            using var _ = JsonDocument.Parse(json);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}

public sealed class UpdateCriterionRequestValidator : AbstractValidator<UpdateCriterionRequest>
{
    public UpdateCriterionRequestValidator()
    {
        RuleFor(x => x.Code)
            .MaximumLength(50).WithMessage("Mã tiêu chí không được quá 50 ký tự.")
            .When(x => !string.IsNullOrWhiteSpace(x.Code));

        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Tên tiêu chí không được để trống.")
            .MaximumLength(500).WithMessage("Tên tiêu chí không được quá 500 ký tự.");

        RuleFor(x => x.Type).IsInEnum().WithMessage("Loại tiêu chí không hợp lệ.");
        RuleFor(x => x.Operator).IsInEnum().WithMessage("Toán tử không hợp lệ.");
        RuleFor(x => x.EvaluationType).IsInEnum().WithMessage("Kiểu đánh giá không hợp lệ.");

        RuleFor(x => x.DisplayOrder)
            .GreaterThanOrEqualTo(0).WithMessage("Thứ tự hiển thị phải lớn hơn hoặc bằng 0.");

        RuleFor(x => x.MinimumSatisfied)
            .GreaterThan(0)
            .When(x => x.MinimumSatisfied.HasValue)
            .WithMessage("Số lượng tối thiểu đạt phải lớn hơn 0.");

        RuleFor(x => x.DefinitionJson)
            .NotEmpty()
            .When(x => x.Type == CriterionType.Requirement)
            .WithMessage("Tiêu chí loại Requirement phải có cấu hình DefinitionJson.");

        RuleFor(x => x.DefinitionJson)
            .Must(BeValidJson)
            .When(x => !string.IsNullOrWhiteSpace(x.DefinitionJson))
            .WithMessage("DefinitionJson không phải chuỗi JSON hợp lệ.");
    }

    private static bool BeValidJson(string json)
    {
        try
        {
            using var _ = JsonDocument.Parse(json);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}

public sealed class CreateCampaignRequestValidator : AbstractValidator<CreateCampaignRequest>
{
    public CreateCampaignRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên chiến dịch không được để trống.")
            .MaximumLength(250).WithMessage("Tên chiến dịch không được quá 250 ký tự.");

        RuleFor(x => x.SchoolYear)
            .NotEmpty().WithMessage("Năm học không được để trống.")
            .MaximumLength(20).WithMessage("Năm học không được quá 20 ký tự.");

        RuleFor(x => x.Level).IsInEnum().WithMessage("Cấp xét duyệt không hợp lệ.");
        RuleFor(x => x.AwardType).IsInEnum().WithMessage("Loại danh hiệu không hợp lệ.");
        RuleFor(x => x.StandardSetId).NotEmpty().WithMessage("Phải chọn bộ tiêu chuẩn áp dụng.");

        RuleFor(x => x.RegOpenAt)
            .LessThan(x => x.RegCloseAt)
            .WithMessage("Thời gian mở đăng ký phải trước thời gian đóng đăng ký.");

        RuleFor(x => x.RegCloseAt)
            .LessThanOrEqualTo(x => x.SubmitDeadline)
            .WithMessage("Thời gian đóng đăng ký phải trước hoặc bằng hạn nộp minh chứng.");

        RuleFor(x => x.SubmitDeadline)
            .LessThanOrEqualTo(x => x.ReviewDeadline)
            .WithMessage("Hạn nộp minh chứng phải trước hoặc bằng hạn xét duyệt.");

        RuleFor(x => x.CollectiveEligibilityRuleJson)
            .NotEmpty()
            .Must(BeValidJson)
            .WithMessage("CollectiveEligibilityRuleJson không phải JSON hợp lệ.");
    }

    private static bool BeValidJson(string json)
    {
        try
        {
            using var _ = JsonDocument.Parse(json);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}

public sealed class UpdateCampaignRequestValidator : AbstractValidator<UpdateCampaignRequest>
{
    public UpdateCampaignRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Tên chiến dịch không được để trống.")
            .MaximumLength(250).WithMessage("Tên chiến dịch không được quá 250 ký tự.");

        RuleFor(x => x.SchoolYear)
            .NotEmpty().WithMessage("Năm học không được để trống.")
            .MaximumLength(20).WithMessage("Năm học không được quá 20 ký tự.");

        RuleFor(x => x.Level).IsInEnum().WithMessage("Cấp xét duyệt không hợp lệ.");
        RuleFor(x => x.AwardType).IsInEnum().WithMessage("Loại danh hiệu không hợp lệ.");
        RuleFor(x => x.StandardSetId).NotEmpty().WithMessage("Phải chọn bộ tiêu chuẩn áp dụng.");

        RuleFor(x => x.RegOpenAt)
            .LessThan(x => x.RegCloseAt)
            .WithMessage("Thời gian mở đăng ký phải trước thời gian đóng đăng ký.");

        RuleFor(x => x.RegCloseAt)
            .LessThanOrEqualTo(x => x.SubmitDeadline)
            .WithMessage("Thời gian đóng đăng ký phải trước hoặc bằng hạn nộp minh chứng.");

        RuleFor(x => x.SubmitDeadline)
            .LessThanOrEqualTo(x => x.ReviewDeadline)
            .WithMessage("Hạn nộp minh chứng phải trước hoặc bằng hạn xét duyệt.");

        RuleFor(x => x.CollectiveEligibilityRuleJson)
            .NotEmpty()
            .Must(BeValidJson)
            .WithMessage("CollectiveEligibilityRuleJson không phải JSON hợp lệ.");
    }

    private static bool BeValidJson(string json)
    {
        try
        {
            using var _ = JsonDocument.Parse(json);
            return true;
        }
        catch (JsonException)
        {
            return false;
        }
    }
}

public sealed class ReviewEvidenceRequestValidator : AbstractValidator<ReviewEvidenceRequest>
{
    public ReviewEvidenceRequestValidator()
    {
        RuleFor(x => x.Decision)
            .Must(d => d is EvidenceStatus.Approved or EvidenceStatus.Rejected or EvidenceStatus.NeedsRevision)
            .WithMessage("Trạng thái xét duyệt không hợp lệ (chỉ chấp nhận Approved, Rejected hoặc NeedsRevision).");

        RuleFor(x => x.Note)
            .NotEmpty()
            .When(x => x.Decision is EvidenceStatus.Rejected or EvidenceStatus.NeedsRevision)
            .WithMessage("Bắt buộc phải nhập nhận xét/lý do khi từ chối hoặc yêu cầu bổ sung minh chứng.");

        RuleFor(x => x.RowVersion)
            .NotEmpty()
            .WithMessage("Thiếu RowVersion — không xác định được phiên bản đồng thời của minh chứng.");
    }
}

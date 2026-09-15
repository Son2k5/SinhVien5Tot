using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Standards;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Admin.StandardSets.Commands.CreateStandardSet;

public sealed class CreateStandardSetHandler(
    IStandardSetRepository standardSetRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser
) : IRequestHandler<CreateStandardSetCommand, StandardSetResponse>
{
    public async Task<StandardSetResponse> Handle(CreateStandardSetCommand command, CancellationToken cancellationToken)
    {
        var actorId = RequireAdminUserId();
        var createRequest = command.Request;
        var name = createRequest.Name.Trim();
        var nameExists = await standardSetRepository.ExistsByNameAsync(
            name,
            cancellationToken: cancellationToken
        );
        if (nameExists)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Tên bộ tiêu chuẩn '{name}' đã tồn tại. Vui lòng chọn tên khác.",
                "standard_set_name_duplicate"
            );
        }
        var standardSet = new StandardSet
        {
            Name = createRequest.Name.Trim(),
            AcademicYear = createRequest.AcademicYear.Trim(),
            Level = createRequest.Level,
            AwardType = createRequest.AwardType,
            Status = StandardSetStatus.Draft,
            Version = 1,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = actorId.ToString(),
        };
        if (createRequest.TemplateStandardSetId.HasValue)
        {
            var source =
                await standardSetRepository.GetByIdAsync(
                    createRequest.TemplateStandardSetId.Value,
                    includeStandards: true,
                    includeCriteria: true,
                    cancellationToken: cancellationToken
                )
                ?? throw new UseCaseException(
                    ApplicationErrorKind.NotFound,
                    "Không tìm thấy bộ tiêu chuẩn mẫu để sao chép.",
                    "standard_template_not_found"
                );
            if (source.Level != createRequest.Level || source.AwardType != createRequest.AwardType)
            {
                throw new UseCaseException(
                    ApplicationErrorKind.Validation,
                    "Bộ tiêu chuẩn mẫu phải có cùng Cấp xét duyệt (Level) và Loại danh hiệu (AwardType).",
                    "invalid_standard_template"
                );
            }
            standardSet.PreviousVersionId = source.Id;
            standardSet.Standards = AdminStandardMappings.CloneStandards(source.Standards, standardSet.Id, actorId);
        }
        else if (createRequest.AwardType == AwardType.Individual)
        {
            var now = DateTime.UtcNow;
            standardSet.Standards = AdminStandardMappings
                .DefaultIndividualStandards.Select(def => new Standard
                {
                    StandardSetId = standardSet.Id,
                    GroupCode = def.GroupCode,
                    Code = def.Code,
                    Title = def.Title,
                    Description = def.Description,
                    DisplayOrder = def.DisplayOrder,
                    Operator = CriterionOperator.All,
                    CreatedAt = now,
                    CreatedBy = actorId.ToString(),
                })
                .ToList();
        }
        await unitOfWork.ExecuteInTransactionAsync(
            async nestedCancellationToken =>
            {
                await standardSetRepository.AddAsync(standardSet, nestedCancellationToken);
                await unitOfWork.SaveChangesAsync(nestedCancellationToken);
            },
            cancellationToken
        );
        return AdminStandardMappings.MapToSetResponse(standardSet, includeStandards: true);
    }

    private Guid RequireAdminUserId() =>
        currentUser.UserId
        ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized,
            "Không xác định được danh tính người dùng hiện tại."
        );
}


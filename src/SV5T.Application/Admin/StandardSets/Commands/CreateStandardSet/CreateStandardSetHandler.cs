using FluentValidation;
using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Auth.Support;
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
    ICurrentUser currentUser,
    IValidator<CreateStandardSetRequest> validator
) : IRequestHandler<CreateStandardSetCommand, StandardSetResponse>
{
    public async Task<StandardSetResponse> Handle(CreateStandardSetCommand request, CancellationToken cancellationToken)
    {
        await AuthServiceSupport.ValidateAsync(validator, request.Request, cancellationToken);
        var actorId = RequireAdminUserId();
        var exists = await standardSetRepository.ExistsByAcademicYearAndLevelAsync(
            request.Request.AcademicYear.Trim(),
            request.Request.Level,
            request.Request.AwardType,
            1,
            cancellationToken: cancellationToken
        );
        if (exists && !request.Request.TemplateStandardSetId.HasValue)
        {
            var academicYear = request.Request.AcademicYear;
            var level = request.Request.Level;
            var awardType = request.Request.AwardType;
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Bo tieu chuan cho nam hoc '{academicYear}', " +
                $"cap '{level}' va loai '{awardType}' da ton tai.",
                "standard_set_duplicate"
            );
        }
        var standardSet = new StandardSet
        {
            AcademicYear = request.Request.AcademicYear.Trim(),
            Level = request.Request.Level,
            AwardType = request.Request.AwardType,
            Status = StandardSetStatus.Draft,
            Version = 1,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = actorId.ToString(),
        };
        if (request.Request.TemplateStandardSetId.HasValue)
        {
            var source =
                await standardSetRepository.GetByIdAsync(
                    request.Request.TemplateStandardSetId.Value,
                    includeStandards: true,
                    includeCriteria: true,
                    cancellationToken: cancellationToken
                )
                ?? throw new UseCaseException(
                    ApplicationErrorKind.NotFound,
                    "Khong tim thay bo tieu chuan mau de sao chep.",
                    "standard_template_not_found"
                );
            if (source.Level != request.Request.Level || source.AwardType != request.Request.AwardType)
            {
                throw new UseCaseException(
                    ApplicationErrorKind.Validation,
                    "Bo tieu chuan mau phai co cung Cap xet duyet (Level) va Loai danh hieu (AwardType).",
                    "invalid_standard_template"
                );
            }
            standardSet.PreviousVersionId = source.Id;
            standardSet.Standards = AdminStandardMappings.CloneStandards(source.Standards, standardSet.Id, actorId);
        }
        else if (request.Request.AwardType == AwardType.Individual)
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
            async ct =>
            {
                await standardSetRepository.AddAsync(standardSet, ct);
                await unitOfWork.SaveChangesAsync(ct);
            },
            cancellationToken
        );
        return AdminStandardMappings.MapToSetResponse(standardSet, includeStandards: true);
    }

    private Guid RequireAdminUserId() =>
        currentUser.UserId
        ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized,
            "Khong xac dinh duoc danh tinh nguoi dung hien tai."
        );
}

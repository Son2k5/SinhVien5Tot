using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Standards;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Admin.StandardSets.Commands.InitDefaultStandards;

public sealed class InitDefaultStandardsHandler(
    IStandardSetRepository standardSetRepository,
    IStandardRepository standardRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser
) : IRequestHandler<InitDefaultStandardsCommand, IReadOnlyList<StandardResponse>>
{
    public async Task<IReadOnlyList<StandardResponse>> Handle(
        InitDefaultStandardsCommand command,
        CancellationToken cancellationToken
    )
    {
        var standardSet =
            await standardSetRepository.GetByIdAsync(command.StandardSetId, true, true, false, cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn.",
                "standard_set_not_found"
            );
        if (standardSet.Status != StandardSetStatus.Draft)
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể khởi tạo tiêu chuẩn cho bộ tiêu chuẩn đã công bố.",
                "standard_set_not_editable"
            );
        var existingGroupCodes = standardSet
            .Standards.Where(standard => standard.GroupCode.HasValue)
            .Select(standard => standard.GroupCode!.Value)
            .ToHashSet();
        var actorId = RequireAdminUserId();
        var now = DateTime.UtcNow;
        foreach (var definition in AdminStandardMappings.DefaultIndividualStandards)
        {
            if (!existingGroupCodes.Contains(definition.GroupCode))
            {
                var standard = new Standard
                {
                    StandardSetId = command.StandardSetId,
                    GroupCode = definition.GroupCode,
                    Code = definition.Code,
                    Title = definition.Title,
                    Description = definition.Description,
                    DisplayOrder = definition.DisplayOrder,
                    Operator = CriterionOperator.All,
                    CreatedAt = now,
                    CreatedBy = actorId.ToString(),
                };
                await standardRepository.AddAsync(standard, cancellationToken);
            }
        }
        await unitOfWork.SaveChangesAsync(cancellationToken);
        var allStandards = await standardRepository.GetByStandardSetIdAsync(
            command.StandardSetId,
            true,
            cancellationToken
        );
        return allStandards.Select(AdminStandardMappings.MapToStandardResponse).ToList();
    }

    private Guid RequireAdminUserId() =>
        currentUser.UserId
        ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized,
            "Không xác định được danh tính người dùng hiện tại."
        );
}


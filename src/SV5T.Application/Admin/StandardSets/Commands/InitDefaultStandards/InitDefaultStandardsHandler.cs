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
        InitDefaultStandardsCommand request,
        CancellationToken cancellationToken
    )
    {
        var standardSet =
            await standardSetRepository.GetByIdAsync(request.StandardSetId, true, true, false, cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Khong tim thay bo tieu chuan.",
                "standard_set_not_found"
            );
        if (standardSet.Status != StandardSetStatus.Draft)
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Khong the khoi tao tieu chuan cho bo tieu chuan da cong bo.",
                "standard_set_not_editable"
            );
        var existingGroupCodes = standardSet
            .Standards.Where(s => s.GroupCode.HasValue)
            .Select(s => s.GroupCode!.Value)
            .ToHashSet();
        var actorId = RequireAdminUserId();
        var now = DateTime.UtcNow;
        foreach (var def in AdminStandardMappings.DefaultIndividualStandards)
        {
            if (!existingGroupCodes.Contains(def.GroupCode))
            {
                var std = new Standard
                {
                    StandardSetId = request.StandardSetId,
                    GroupCode = def.GroupCode,
                    Code = def.Code,
                    Title = def.Title,
                    Description = def.Description,
                    DisplayOrder = def.DisplayOrder,
                    Operator = CriterionOperator.All,
                    CreatedAt = now,
                    CreatedBy = actorId.ToString(),
                };
                await standardRepository.AddAsync(std, cancellationToken);
            }
        }
        await unitOfWork.SaveChangesAsync(cancellationToken);
        var allStandards = await standardRepository.GetByStandardSetIdAsync(
            request.StandardSetId,
            true,
            cancellationToken
        );
        return allStandards.Select(AdminStandardMappings.MapToStandardResponse).ToList();
    }

    private Guid RequireAdminUserId() =>
        currentUser.UserId
        ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized,
            "Khong xac dinh duoc danh tinh nguoi dung hien tai."
        );
}

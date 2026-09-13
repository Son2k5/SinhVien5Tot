using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.StandardSets.Common;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Standards.Abstractions;
using SV5T.Domain.Standards;
using SV5T.Domain.Standards.Enums;

namespace SV5T.Application.Admin.StandardSets.Commands.AddStandard;

public sealed class AddStandardHandler(
    IStandardSetRepository standardSetRepository,
    IStandardRepository standardRepository,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser
) : IRequestHandler<AddStandardCommand, StandardResponse>
{
    public async Task<StandardResponse> Handle(AddStandardCommand command, CancellationToken cancellationToken)
    {
        var createRequest = command.Request;
        var standardSet =
            await standardSetRepository.GetByIdAsync(
                command.StandardSetId,
                tracking: false,
                cancellationToken: cancellationToken
            )
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy bộ tiêu chuẩn.",
                "standard_set_not_found"
            );
        if (standardSet.Status != StandardSetStatus.Draft)
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                "Không thể thêm tiêu chuẩn vào bộ tiêu chuẩn đã công bố (Published).",
                "standard_set_not_editable"
            );
        string finalCode = createRequest.Code?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(finalCode))
        {
            finalCode = createRequest.GroupCode switch
            {
                StandardGroupCode.Ethics => "TC_DAODUC",
                StandardGroupCode.Study => "TC_HOCTAP",
                StandardGroupCode.Fitness => "TC_THELUC",
                StandardGroupCode.Volunteer => "TC_TINHNGUYEN",
                StandardGroupCode.Integration => "TC_HOINHAP",
                _ => $"TC_STD_{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}",
            };
        }
        var codeExists = await standardRepository.ExistsCodeInStandardSetAsync(
            command.StandardSetId,
            finalCode,
            cancellationToken: cancellationToken
        );
        if (codeExists)
            throw new UseCaseException(
                ApplicationErrorKind.Conflict,
                $"Mã tiêu chuẩn '{finalCode}' đã tồn tại trong bộ tiêu chuẩn này.",
                "standard_code_duplicate"
            );
        var actorId = RequireAdminUserId();
        var standard = new Standard
        {
            StandardSetId = command.StandardSetId,
            GroupCode = createRequest.GroupCode,
            Code = finalCode,
            Title = createRequest.Title.Trim(),
            Description = createRequest.Description?.Trim(),
            DisplayOrder = createRequest.DisplayOrder,
            Operator = createRequest.Operator,
            MinimumSatisfied = createRequest.MinimumSatisfied,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = actorId.ToString(),
        };
        await standardRepository.AddAsync(standard, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);
        return AdminStandardMappings.MapToStandardResponse(standard);
    }

    private Guid RequireAdminUserId() =>
        currentUser.UserId
        ?? throw new UseCaseException(
            ApplicationErrorKind.Unauthorized,
            "Không xác định được danh tính người dùng hiện tại."
        );
}


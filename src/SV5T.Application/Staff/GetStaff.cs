using FluentValidation;
using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Common.Abstractions;
using SV5T.Domain.Users.Enums;

namespace SV5T.Application.Staff;

public sealed record GetStaffQuery(
    Role? Role,
    StaffStatus? Status,
    string? Q,
    int Page = 1,
    int PageSize = 20) : IRequest<PagedResponse<StaffResponse>>;

public sealed record GetStaffByIdQuery(Guid Id) : IRequest<StaffResponse>;

public sealed class GetStaffQueryValidator : AbstractValidator<GetStaffQuery>
{
    public GetStaffQueryValidator()
    {
        RuleFor(x => x.Role)
            .Must(role => role is null || StaffRules.IsManageable(role.Value))
            .WithMessage("Vai trò nhân sự không hợp lệ.");
        RuleFor(x => x.Status)
            .IsInEnum()
            .When(x => x.Status.HasValue)
            .WithMessage("Trạng thái nhân sự không hợp lệ.");
        RuleFor(x => x.Q)
            .MaximumLength(254)
            .When(x => !string.IsNullOrWhiteSpace(x.Q))
            .WithMessage("Từ khóa tìm kiếm không được vượt quá 254 ký tự.");
        RuleFor(x => x.Page)
            .GreaterThanOrEqualTo(1)
            .WithMessage("Trang phải lớn hơn hoặc bằng 1.");
        RuleFor(x => x.PageSize)
            .InclusiveBetween(1, 50)
            .WithMessage("Kích thước trang phải từ 1 đến 50.");
    }
}

public sealed class GetStaffByIdQueryValidator : AbstractValidator<GetStaffByIdQuery>
{
    public GetStaffByIdQueryValidator() =>
        RuleFor(x => x.Id).NotEmpty().WithMessage("Mã nhân sự không hợp lệ.");
}

public sealed class GetStaffHandler(
    IUserRepository userRepository,
    ICurrentUser currentUser)
    : IRequestHandler<GetStaffQuery, PagedResponse<StaffResponse>>
{
    public Task<PagedResponse<StaffResponse>> Handle(
        GetStaffQuery request,
        CancellationToken cancellationToken)
    {
        _ = StaffRules.EnsureAdmin(currentUser);
        return userRepository.GetStaffPagedAsync(
            request.Role,
            request.Status,
            string.IsNullOrWhiteSpace(request.Q) ? null : request.Q.Trim(),
            request.Page,
            request.PageSize,
            cancellationToken);
    }
}

public sealed class GetStaffByIdHandler(
    IUserRepository userRepository,
    ICurrentUser currentUser)
    : IRequestHandler<GetStaffByIdQuery, StaffResponse>
{
    public async Task<StaffResponse> Handle(
        GetStaffByIdQuery request,
        CancellationToken cancellationToken)
    {
        var actorUserId = StaffRules.EnsureAdmin(currentUser);
        StaffRules.EnsureNotSelf(actorUserId, request.Id);
        return await userRepository.GetStaffResponseAsync(request.Id, cancellationToken)
            ?? throw StaffRules.StaffNotFound();
    }
}

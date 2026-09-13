using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Students.Abstractions;
using SV5T.Application.Common.Models;

namespace SV5T.Application.Admin.Students.Queries.GetStudentsPaged;

public sealed class GetStudentsPagedHandler(IAdminStudentRepository repository)
    : IRequestHandler<GetStudentsPagedQuery, PagedResult<AdminStudentListItemResponse>>
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    public async Task<PagedResult<AdminStudentListItemResponse>> Handle(
        GetStudentsPagedQuery request,
        CancellationToken cancellationToken
    )
    {
        var pageIndex = request.PageIndex < 1 ? 1 : request.PageIndex;
        var pageSize = request.PageSize is < 1 or > MaxPageSize ? DefaultPageSize : request.PageSize;

        var filter = new AdminStudentFilter(
            request.Search?.Trim(),
            request.Faculty?.Trim(),
            request.Major?.Trim(),
            request.AdministrativeClass?.Trim(),
            request.AcademicYear,
            request.School?.Trim(),
            request.SchoolYear?.Trim(),
            request.IsActive,
            request.IsVerified,
            request.IncludeDeleted,
            request.SortBy?.Trim(),
            request.SortDir?.Trim(),
            pageIndex,
            pageSize
        );

        var paged = await repository.GetPagedAsync(filter, cancellationToken);

        var items = paged
            .Items.Select(u => new AdminStudentListItemResponse(
                u.Id,
                u.Email,
                u.DisplayName,
                u.IsVerified,
                u.IsActive,
                u.Profile?.FullName ?? string.Empty,
                u.Profile?.StudentCode ?? string.Empty,
                u.Profile?.Faculty ?? string.Empty,
                u.Profile?.Major,
                u.Profile?.AdministrativeClass ?? string.Empty,
                u.Profile?.AcademicYear ?? 0,
                u.Profile?.School ?? string.Empty,
                u.CreatedAt
            ))
            .ToList();

        return new PagedResult<AdminStudentListItemResponse>(items, paged.TotalCount, paged.PageIndex, paged.PageSize);
    }
}

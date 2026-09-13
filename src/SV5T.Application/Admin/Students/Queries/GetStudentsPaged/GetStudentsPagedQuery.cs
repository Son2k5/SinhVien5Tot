using MediatR;
using SV5T.Application.Admin.Dtos;
using SV5T.Application.Common.Models;

namespace SV5T.Application.Admin.Students.Queries.GetStudentsPaged;

public sealed record GetStudentsPagedQuery(
    string? Search,
    string? Faculty,
    string? Major,
    string? AdministrativeClass,
    int? AcademicYear,
    string? School,
    string? SchoolYear,
    bool? IsActive,
    bool? IsVerified,
    bool IncludeDeleted,
    string? SortBy,
    string? SortDir,
    int PageIndex,
    int PageSize
) : IRequest<PagedResult<AdminStudentListItemResponse>>;

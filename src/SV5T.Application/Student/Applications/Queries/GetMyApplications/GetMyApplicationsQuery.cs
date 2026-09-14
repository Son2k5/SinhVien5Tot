using MediatR;
using SV5T.Application.Common.Models;
using SV5T.Application.Student.Dtos;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Student.Applications.Queries.GetMyApplications;

public sealed record GetMyApplicationsQuery(
    SubmissionStatus? Status,
    int PageIndex = 1,
    int PageSize = 20) : IRequest<PagedResult<StudentApplicationSummaryResponse>>;

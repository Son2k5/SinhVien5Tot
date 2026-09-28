using MediatR;
using SV5T.Application.Student.Abstractions;

namespace SV5T.Application.Admin.Applications;

public sealed record GetSubmittedApplicationQuery(Guid Id) : IRequest<ReviewApplicationResponse?>;

public sealed class GetSubmittedApplicationHandler(IReviewApplicationRepository applications,
    IStudentCriterionRepository criteria) : IRequestHandler<GetSubmittedApplicationQuery, ReviewApplicationResponse?>
{
    public async Task<ReviewApplicationResponse?> Handle(GetSubmittedApplicationQuery request, CancellationToken ct)
    {
        var app = await applications.GetByIdAsync(request.Id, false, ct);
        if (app?.SubmittedAt is null) return null;
        return ApplicationReviewSupport.Map(app, await ApplicationReviewSupport.ProgressAsync(app, criteria, ct));
    }
}

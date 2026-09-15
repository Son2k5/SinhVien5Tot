using System.Text.Json;
using MediatR;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Student.Abstractions;
using SV5T.Application.Student.Dtos;
using SV5T.Application.Student.Support;
using SV5T.Application.Users.Abstractions;
using SubmissionApplication = SV5T.Domain.Submissions.Application;
using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Submissions;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Student.Applications.Commands.CreateApplication;

public sealed class CreateApplicationHandler(
    IStudentCampaignRepository campaigns,
    IStudentApplicationRepository applications,
    IUserRepository users,
    IUnitOfWork uow,
    ICurrentUser currentUser)
    : IRequestHandler<CreateApplicationCommand, StudentApplicationDetailResponse>
{
    public async Task<StudentApplicationDetailResponse> Handle(
        CreateApplicationCommand request,
        CancellationToken cancellationToken)
    {
        var userId = currentUser.UserId
            ?? throw new UseCaseException(
                ApplicationErrorKind.Unauthorized,
                "Phiên đăng nhập không hợp lệ.",
                "invalid_session");

        var campaign = await campaigns.GetByIdAsync(
                request.CampaignId, includeDetails: true, cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy đợt xét.",
                "campaign_not_found");

        StudentApplicationGuard.EnsureCampaignOpenForRegistration(campaign);

        var user = await users.GetByIdWithProfileAsync(userId, cancellationToken: cancellationToken)
            ?? throw new UseCaseException(
                ApplicationErrorKind.NotFound,
                "Không tìm thấy người dùng.",
                "user_not_found");

        if (!user.IsActive || user.IsDeleted || !user.IsVerified || user.Profile is null)
        {
            throw new UseCaseException(
                ApplicationErrorKind.Forbidden,
                "Tài khoản chưa xác thực hoặc chưa có hồ sơ sinh viên.",
                "profile_not_ready");
        }

        var existing = await applications.GetByCampaignAndUserAsync(
            campaign.Id, userId, cancellationToken: cancellationToken);
        StudentApplicationGuard.EnsureNoDuplicateApplication(existing);

        var now = DateTime.UtcNow;
        var application = new SubmissionApplication
        {
            ApplicationCode = BuildApplicationCode(campaign.SchoolYear),
            CampaignId = campaign.Id,
            StandardSetId = campaign.StandardSetId,
            Kind = campaign.AwardType == AwardType.Collective
                ? ApplicationKind.Collective
                : ApplicationKind.Individual,
            ApplicantUserId = userId,
            ApplicantSnapshotJson = BuildSnapshotJson(user),
            SubmissionDataJson = "{}",
            Status = SubmissionStatus.Draft,
            CreatedAt = now,
            CreatedBy = userId.ToString()
        };

        await uow.ExecuteInTransactionAsync(async ct =>
        {
            await applications.AddAsync(application, ct);
            await applications.AddReviewLogAsync(new ReviewLog
            {
                ApplicationId = application.Id,
                ActorId = userId,
                Action = ReviewAction.ApplicationCreated,
                MetadataJson = """{"source":"student-application"}""",
                CreatedAt = now
            }, ct);
            await uow.SaveChangesAsync(ct);
        }, cancellationToken);

        return new StudentApplicationDetailResponse(
            application.Id,
            application.ApplicationCode,
            campaign.Id,
            campaign.Name,
            campaign.SchoolYear,
            campaign.SubmitDeadline,
            application.Status,
            application.ApplicantSnapshotJson,
            application.CreatedAt,
            null,
            null,
            Convert.ToBase64String(application.RowVersion),
            []);
    }

    private static string BuildApplicationCode(string schoolYear)
    {
        var year = new string(schoolYear.Where(char.IsDigit).ToArray());
        if (year.Length > 4)
        {
            year = year[^4..];
        }

        return $"SV5T-{year}-{DateTime.UtcNow:MMddHHmmss}-{Guid.NewGuid():N}"[..32].ToUpperInvariant();
    }

    private static string BuildSnapshotJson(Domain.Users.User user)
    {
        var p = user.Profile!;
        return JsonSerializer.Serialize(new
        {
            userId = user.Id,
            email = user.Email,
            fullName = p.FullName,
            studentCode = p.StudentCode,
            school = p.School,
            faculty = p.Faculty,
            major = p.Major,
            administrativeClass = p.AdministrativeClass,
            academicYear = p.AcademicYear,
            snapshotAt = DateTime.UtcNow
        });
    }
}

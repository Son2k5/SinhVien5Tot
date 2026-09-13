using SV5T.Application.Admin.Dtos;
using SV5T.Application.Admin.Students.Abstractions;
using SV5T.Application.Admin.Students.Commands.DeleteStudent;
using SV5T.Application.Admin.Students.Commands.ReviewStudent;
using SV5T.Application.Admin.Students.Queries.GetStudentById;
using SV5T.Application.Admin.Students.Queries.GetStudentsPaged;
using SV5T.Application.Admin.Students.Validators;
using SV5T.Application.Common.Abstractions;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Models;
using SV5T.Domain.Admin;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Campaigns.Enums;
using SV5T.Domain.Criteria;
using SV5T.Domain.Evidences;
using SV5T.Domain.Standards;
using SV5T.Domain.Standards.Enums;
using SV5T.Domain.Submissions.Enums;
using SV5T.Domain.Users;
using SV5T.Domain.Users.Enums;
using Xunit;
using SubmissionApplication = SV5T.Domain.Submissions.Application;

namespace SV5T.UnitTests.Application;

public sealed class AdminStudentTests
{
    private readonly FR _repo = new();
    private readonly FA _audit = new();
    private readonly FU _uow = new();
    private readonly FC _me = new(Guid.NewGuid());
    private readonly FRT _refresh = new();
    private readonly FRS _redis = new();

    [Fact]
    public async Task List_OnlyRoleUser_AndSearch()
    {
        _repo.Users.Add(
            new User
            {
                Id = Guid.NewGuid(),
                Email = "sv01@school.edu.vn",
                NormalizedEmail = "SV01@SCHOOL.EDU.VN",
                Role = Role.User,
                Profile = new UserProfile
                {
                    FullName = "Nguyen Van A",
                    StudentCode = "SV01",
                    Faculty = "CNTT",
                    AdministrativeClass = "K48",
                    AcademicYear = 2024,
                    School = "HCMUTE",
                    ContactEmail = "a@x",
                    PhoneNumber = "1",
                    IdentityCardNumber = "1",
                    Ethnicity = "Kinh",
                    CurrentPosition = "SV",
                },
            }
        );
        _repo.Users.Add(
            new User
            {
                Id = Guid.NewGuid(),
                Email = "admin@x",
                NormalizedEmail = "ADMIN@X",
                Role = Role.Admin,
            }
        );
        var h = new GetStudentsPagedHandler(_repo);
        var r = await h.Handle(
            new GetStudentsPagedQuery("SV01", null, null, null, null, null, null, null, null, false, null, null, 1, 20),
            CancellationToken.None
        );
        Assert.Single(r.Items);
        Assert.Equal("SV01", r.Items[0].StudentCode);
    }

    [Fact]
    public async Task Detail_GroupsBy5_AndLogsDesc()
    {
        var sid = Guid.NewGuid();
        var appId = Guid.NewGuid();
        _repo.Users.Add(
            new User
            {
                Id = sid,
                Email = "sv@x",
                NormalizedEmail = "SV@X",
                Role = Role.User,
                Profile = new UserProfile
                {
                    FullName = "SV",
                    StudentCode = "S1",
                    Faculty = "F",
                    AdministrativeClass = "C",
                    AcademicYear = 2024,
                    School = "S",
                    ContactEmail = "c",
                    PhoneNumber = "p",
                    IdentityCardNumber = "i",
                    Ethnicity = "Kinh",
                    CurrentPosition = "SV",
                },
            }
        );
        var setId = Guid.NewGuid();
        var std = new Standard
        {
            Id = Guid.NewGuid(),
            StandardSetId = setId,
            GroupCode = StandardGroupCode.Ethics,
            Code = "TC1",
            Title = "DD",
        };
        var app = new SubmissionApplication
        {
            Id = appId,
            ApplicantUserId = sid,
            ApplicationCode = "APP1",
            CampaignId = Guid.NewGuid(),
            StandardSetId = setId,
            Campaign = new Campaign { Name = "CD", SchoolYear = "2025-2026" },
            Evidences = new List<Evidence>(),
        };
        _repo.Apps.Add(app);
        _repo.Evidences.Add(
            new Evidence
            {
                Id = Guid.NewGuid(),
                ApplicationId = appId,
                CriterionId = Guid.NewGuid(),
                Criterion = new Criterion
                {
                    Code = "C1",
                    Title = "T1",
                    Standard = std,
                },
                Application = app,
                Status = EvidenceStatus.Approved,
                RowVersion = new byte[] { 1 },
            }
        );
        _repo.Logs.Add(
            new SV5T.Domain.Submissions.ReviewLog
            {
                ApplicationId = appId,
                CreatedAt = DateTime.UtcNow.AddHours(-1),
                ActorId = Guid.NewGuid(),
            }
        );
        _repo.Logs.Add(
            new SV5T.Domain.Submissions.ReviewLog
            {
                ApplicationId = appId,
                CreatedAt = DateTime.UtcNow,
                ActorId = Guid.NewGuid(),
            }
        );
        var h = new GetStudentByIdHandler(_repo);
        var d = await h.Handle(new GetStudentByIdQuery(sid), CancellationToken.None);
        Assert.NotNull(d);
        Assert.Single(d!.EvidenceGroups);
        Assert.True(d.ReviewLogs[0].CreatedAt >= d.ReviewLogs[1].CreatedAt);
    }

    [Fact]
    public async Task Delete_RequiresConfirm_AndSoftDeletes()
    {
        var sid = Guid.NewGuid();
        _repo.Users.Add(
            new User
            {
                Id = sid,
                Email = "sv@x",
                NormalizedEmail = "SV@X",
                Role = Role.User,
            }
        );
        var h = new DeleteStudentHandler(_repo, _audit, _refresh, _redis, _uow, _me);
        await Assert.ThrowsAsync<UseCaseException>(() =>
            h.Handle(new DeleteStudentCommand(sid, new DeleteStudentRequest(false, null)), CancellationToken.None)
        );
        await h.Handle(
            new DeleteStudentCommand(sid, new DeleteStudentRequest(true, "vi pham")),
            CancellationToken.None
        );
        Assert.True(_repo.Users[0].IsDeleted);
        Assert.False(_repo.Users[0].IsActive);
        Assert.Single(_audit.Items);
    }

    [Fact]
    public async Task Review_ConcurrencyConflict()
    {
        var sid = Guid.NewGuid();
        var eid = Guid.NewGuid();
        var appId = Guid.NewGuid();
        _repo.Users.Add(
            new User
            {
                Id = sid,
                Email = "sv@x",
                NormalizedEmail = "SV@X",
                Role = Role.User,
            }
        );
        var app = new SubmissionApplication
        {
            Id = appId,
            ApplicantUserId = sid,
            ApplicationCode = "A",
            CampaignId = Guid.NewGuid(),
            StandardSetId = Guid.NewGuid(),
            Status = SubmissionStatus.Submitted,
            Campaign = new Campaign { Status = CampaignStatus.Reviewing, ReviewDeadline = DateTime.UtcNow.AddDays(5) },
        };
        _repo.Apps.Add(app);
        _repo.Evidences.Add(
            new Evidence
            {
                Id = eid,
                ApplicationId = appId,
                Application = app,
                Criterion = new Criterion
                {
                    Code = "C",
                    Title = "T",
                    Standard = new Standard { GroupCode = StandardGroupCode.Study },
                },
                Status = EvidenceStatus.Submitted,
                RowVersion = new byte[] { 1, 2 },
            }
        );
        var h = new ReviewStudentHandler(_repo, _audit, _uow, _me, new ReviewStudentEvidenceRequestValidator());
        var bad = new ReviewStudentEvidenceRequest(
            eid,
            EvidenceStatus.Approved,
            "ok",
            Convert.ToBase64String(new byte[] { 9, 9 })
        );
        await Assert.ThrowsAsync<UseCaseException>(() =>
            h.Handle(new ReviewStudentCommand(sid, bad), CancellationToken.None)
        );
    }

    private sealed class FR : IAdminStudentRepository
    {
        public List<User> Users { get; } = [];
        public List<SubmissionApplication> Apps { get; } = [];
        public List<Evidence> Evidences { get; } = [];
        public List<SV5T.Domain.Submissions.ReviewLog> Logs { get; } = [];

        public Task<PagedResult<User>> GetPagedAsync(AdminStudentFilter f, CancellationToken ct = default)
        {
            var q = Users.Where(u => u.Role == Role.User);
            var l = q.ToList();
            return Task.FromResult(new PagedResult<User>(l, l.Count, 1, 20));
        }

        public Task<User?> GetByIdAsync(Guid id, bool t = false, bool d = false, CancellationToken ct = default) =>
            Task.FromResult(Users.FirstOrDefault(u => u.Id == id));

        public Task<IReadOnlyList<User>> GetByIdsAsync(IEnumerable<Guid> ids, bool tracking = false, bool includeDetails = false, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<User>>(Users.Where(u => ids.Contains(u.Id)).ToList());

        public Task<IReadOnlyList<SubmissionApplication>> GetApplicationsAsync(
            Guid s,
            CancellationToken ct = default
        ) => Task.FromResult<IReadOnlyList<SubmissionApplication>>(Apps.Where(a => a.ApplicantUserId == s).ToList());

        public Task<IReadOnlyList<Evidence>> GetEvidencesAsync(Guid s, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<Evidence>>(
                Evidences.Where(e => e.Application != null && e.Application.ApplicantUserId == s).ToList()
            );

        public Task<IReadOnlyList<SV5T.Domain.Submissions.ReviewLog>> GetReviewLogsAsync(
            Guid s,
            CancellationToken ct = default
        ) => Task.FromResult<IReadOnlyList<SV5T.Domain.Submissions.ReviewLog>>(Logs.ToList());

        public Task<Evidence?> GetEvidenceForStudentAsync(
            Guid s,
            Guid e,
            bool tr = false,
            CancellationToken ct = default
        ) => Task.FromResult(Evidences.FirstOrDefault(x => x.Id == e));

        public Task AddReviewLogAsync(SV5T.Domain.Submissions.ReviewLog l, CancellationToken ct = default) =>
            Task.CompletedTask;
    }

    private sealed class FA : IAdminAuditLogRepository
    {
        public List<AdminAuditLog> Items { get; } = [];

        public Task AddAsync(AdminAuditLog l, CancellationToken ct = default)
        {
            Items.Add(l);
            return Task.CompletedTask;
        }
    }

    private sealed class FU : IUnitOfWork
    {
        public Task<int> SaveChangesAsync(CancellationToken ct = default) => Task.FromResult(1);

        public Task ExecuteInTransactionAsync(Func<CancellationToken, Task> o, CancellationToken ct = default) => o(ct);
    }

    private sealed class FC(Guid? id) : ICurrentUser
    {
        public Guid? UserId => id;
        public bool IsAuthenticated => true;

        public bool IsInRole(string r) => r == "Admin";
    }

    private sealed class FRT : IRefreshTokenRepository
    {
        public Task<RefreshToken?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) => Task.FromResult<RefreshToken?>(null);
        public Task AddAsync(RefreshToken refreshToken, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task<int> TryRevokeActiveAsync(Guid id, Guid userId, string token, DateTime revokedAtUtc, Guid? replacedByTokenId = null, CancellationToken cancellationToken = default) => Task.FromResult(0);
        public Task<int> RevokeAllActiveAsync(Guid userId, DateTime revokedAtUtc, CancellationToken cancellationToken = default) => Task.FromResult(0);
        public Task<int> RevokeFamilyAsync(Guid familyId, Guid userId, DateTime revokedAtUtc, CancellationToken cancellationToken = default) => Task.FromResult(0);
        public Task<int> RevokeExcessActiveAsync(Guid userId, DateTime revokedAtUtc, CancellationToken cancellationToken = default) => Task.FromResult(0);
        public Task<int> DeleteStaleAsync(DateTime retentionCutoffUtc, CancellationToken cancellationToken = default) => Task.FromResult(0);
    }

    private sealed class FRS : IAuthRedisStore
    {
        public Task<OtpIssueResult> ReserveOtpRequestAsync(string email) => Task.FromResult(OtpIssueResult.Allowed);
        public Task<bool> IsLoginBlockedAsync(string email, string ipAddress) => Task.FromResult(false);
        public Task RecordLoginFailureAsync(string email, string ipAddress) => Task.CompletedTask;
        public Task ClearAccountLoginFailuresAsync(string email) => Task.CompletedTask;
        public Task SetUserSecurityVersionAsync(Guid userId, int securityVersion, TimeSpan? expiry = null) => Task.CompletedTask;
        public Task<int?> GetUserSecurityVersionAsync(Guid userId) => Task.FromResult<int?>(null);
    }
}

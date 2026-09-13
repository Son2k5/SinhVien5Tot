using SV5T.Domain.Standards.Enums;
using SV5T.Domain.Submissions.Enums;
using SV5T.Domain.Users.Enums;

namespace SV5T.Application.Admin.Dtos;

public sealed record AdminStudentListItemResponse(
    Guid Id,
    string Email,
    string? DisplayName,
    bool IsVerified,
    bool IsActive,
    string FullName,
    string StudentCode,
    string Faculty,
    string? Major,
    string AdministrativeClass,
    int AcademicYear,
    string School,
    DateTime CreatedAt
);

public sealed record AdminStudentAddressResponse(
    AddressType AddressType,
    string ProvinceOrCity,
    string District,
    string StreetAddress
);

public sealed record AdminStudentProfileResponse(
    string FullName,
    DateOnly BirthDate,
    Gender Gender,
    string IdentityCardNumber,
    string Ethnicity,
    string School,
    string? Major,
    int AcademicYear,
    string StudentCode,
    string AdministrativeClass,
    string Faculty,
    string CurrentPosition,
    string ContactEmail,
    string PhoneNumber,
    string? UnionPosition,
    PoliticalStatus PoliticalStatus,
    IReadOnlyList<AdminStudentAddressResponse> Addresses
);

public sealed record AdminStudentApplicationSummaryResponse(
    Guid Id,
    string ApplicationCode,
    Guid CampaignId,
    string CampaignName,
    string SchoolYear,
    SubmissionStatus Status,
    DateTime? SubmittedAt,
    int EvidenceCount,
    DateTime CreatedAt
);

public sealed record AdminStudentEvidenceItemResponse(
    Guid Id,
    Guid ApplicationId,
    string ApplicationCode,
    Guid CriterionId,
    string CriterionCode,
    string CriterionTitle,
    StandardGroupCode? GroupCode,
    string GroupName,
    Guid CampaignId,
    string CampaignName,
    EvidenceStatus Status,
    string? ReviewerNote,
    Guid? ReviewedBy,
    DateTime? ReviewedAt,
    string RowVersion,
    DateTime CreatedAt
);

public sealed record AdminStudentEvidenceGroupResponse(
    StandardGroupCode? GroupCode,
    string GroupName,
    int TotalCount,
    int ApprovedCount,
    IReadOnlyList<AdminStudentEvidenceItemResponse> Items
);

public sealed record AdminStudentReviewLogResponse(
    Guid Id,
    Guid ApplicationId,
    Guid? EvidenceId,
    ReviewAction Action,
    string? Note,
    Guid ActorId,
    DateTime CreatedAt
);

public sealed record AdminStudentDetailResponse(
    Guid Id,
    string Email,
    string? DisplayName,
    Role Role,
    string? AvatarUrl,
    bool IsVerified,
    bool IsActive,
    bool IsDeleted,
    DateTime? DeletedAt,
    string? DeleteReason,
    DateTime CreatedAt,
    AdminStudentProfileResponse? Profile,
    IReadOnlyList<AdminStudentApplicationSummaryResponse> Applications,
    IReadOnlyList<AdminStudentEvidenceGroupResponse> EvidenceGroups,
    IReadOnlyList<AdminStudentReviewLogResponse> ReviewLogs
);

public sealed record DeleteStudentRequest(bool Confirm, string? Reason);

public sealed record BatchDeleteStudentsRequest(
    IReadOnlyList<Guid> Ids,
    bool Confirm = true,
    string? Reason = null
);

public sealed record BatchDeleteStudentsResponse(int DeletedCount);

public sealed record LockStudentRequest(string? Reason);

public sealed record UnlockStudentRequest(string? Reason);

public sealed record ReviewStudentEvidenceRequest(
    Guid EvidenceId,
    EvidenceStatus Decision,
    string? Note,
    string RowVersion
);

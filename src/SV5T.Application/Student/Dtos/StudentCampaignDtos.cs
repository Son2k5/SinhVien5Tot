using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Campaigns.Enums;

namespace SV5T.Application.Student.Dtos;

public sealed record StudentCampaignListItemResponse(
    Guid Id,
    string Name,
    string SchoolYear,
    AwardLevel Level,
    AwardType AwardType,
    CampaignStatus Status,
    string? Description,
    DateTime RegOpenAt,
    DateTime RegCloseAt,
    DateTime SubmitDeadline,
    DateTime? ReviewDeadline,
    bool CanRegister,
    Guid StandardSetId,
    string? StandardSetName);

public sealed record StudentStandardSetBriefResponse(
    Guid Id,
    string Name,
    string AcademicYear,
    AwardLevel Level,
    AwardType AwardType,
    int Version);

public sealed record StudentCampaignDetailResponse(
    Guid Id,
    string Name,
    string SchoolYear,
    AwardLevel Level,
    AwardType AwardType,
    CampaignStatus Status,
    string? Description,
    DateTime RegOpenAt,
    DateTime RegCloseAt,
    DateTime SubmitDeadline,
    DateTime? ReviewDeadline,
    bool CanRegister,
    Guid StandardSetId,
    StudentStandardSetBriefResponse? StandardSet,
    IReadOnlyList<StudentCriterionItemResponse> Criteria);

public sealed record StudentCriterionItemResponse(
    Guid Id,
    Guid StandardId,
    string Code,
    string Title,
    string? Description,
    string GroupCode,
    bool IsRequired,
    int SortOrder,
    int ExistingEvidenceCount,
    string? ExistingEvidenceStatus);

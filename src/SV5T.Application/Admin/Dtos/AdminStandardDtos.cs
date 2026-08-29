using SV5T.Domain.Awards.Enums;
using SV5T.Domain.Campaigns.Enums;
using SV5T.Domain.Criteria;
using SV5T.Domain.Evidences;
using SV5T.Domain.Standards;
using SV5T.Domain.Standards.Enums;
using SV5T.Domain.Submissions.Enums;

namespace SV5T.Application.Admin.Dtos;

// ==========================================
// 1. Standard Set DTOs
// ==========================================

public sealed record CreateStandardSetRequest(
    string AcademicYear,
    AwardLevel Level,
    AwardType AwardType,
    Guid? TemplateStandardSetId);

public sealed record UpdateStandardSetRequest(
    string AcademicYear,
    AwardLevel Level,
    AwardType AwardType);

public sealed record StandardSetResponse(
    Guid Id,
    string AcademicYear,
    AwardLevel Level,
    AwardType AwardType,
    StandardSetStatus Status,
    int Version,
    Guid? PreviousVersionId,
    DateTime CreatedAt,
    DateTime? PublishedAt,
    IReadOnlyList<CriterionResponse>? Criteria);

// ==========================================
// 2. Criterion DTOs
// ==========================================

public sealed record CreateCriterionRequest(
    Guid? ParentCriterionId,
    CriterionType Type,
    StandardGroupCode? GroupCode,
    string Code,
    string Title,
    string? Description,
    int DisplayOrder,
    CriterionOperator Operator,
    int? MinimumSatisfied,
    CriterionEvaluationType EvaluationType,
    string DefinitionJson,
    string? ReviewGuidance);

public sealed record UpdateCriterionRequest(
    Guid? ParentCriterionId,
    CriterionType Type,
    StandardGroupCode? GroupCode,
    string Code,
    string Title,
    string? Description,
    int DisplayOrder,
    CriterionOperator Operator,
    int? MinimumSatisfied,
    CriterionEvaluationType EvaluationType,
    string DefinitionJson,
    string? ReviewGuidance);

public sealed record CriterionResponse(
    Guid Id,
    Guid StandardSetId,
    Guid? ParentCriterionId,
    CriterionType Type,
    StandardGroupCode? GroupCode,
    string Code,
    string Title,
    string? Description,
    int DisplayOrder,
    CriterionOperator Operator,
    int? MinimumSatisfied,
    CriterionEvaluationType EvaluationType,
    string DefinitionJson,
    string? ReviewGuidance);

// ==========================================
// 3. Campaign DTOs (3 Cấp: School, City, Central)
// ==========================================

public sealed record CreateCampaignRequest(
    string Name,
    string SchoolYear,
    AwardLevel Level,
    AwardType AwardType,
    Guid StandardSetId,
    Guid? PrerequisiteCampaignId,
    DateTime RegOpenAt,
    DateTime RegCloseAt,
    DateTime SubmitDeadline,
    DateTime ReviewDeadline,
    string? Description,
    string CollectiveEligibilityRuleJson);

public sealed record UpdateCampaignRequest(
    string Name,
    string SchoolYear,
    AwardLevel Level,
    AwardType AwardType,
    Guid StandardSetId,
    Guid? PrerequisiteCampaignId,
    DateTime RegOpenAt,
    DateTime RegCloseAt,
    DateTime SubmitDeadline,
    DateTime ReviewDeadline,
    string? Description,
    string CollectiveEligibilityRuleJson);

public sealed record UpdateCampaignStatusRequest(
    CampaignStatus Status);

public sealed record CampaignResponse(
    Guid Id,
    string Name,
    string SchoolYear,
    AwardLevel Level,
    AwardType AwardType,
    CampaignStatus Status,
    Guid StandardSetId,
    string? StandardSetName,
    Guid? PrerequisiteCampaignId,
    string? PrerequisiteCampaignName,
    DateTime RegOpenAt,
    DateTime RegCloseAt,
    DateTime SubmitDeadline,
    DateTime ReviewDeadline,
    string? Description,
    DateTime CreatedAt);

public sealed record CampaignDetailResponse(
    Guid Id,
    string Name,
    string SchoolYear,
    AwardLevel Level,
    AwardType AwardType,
    CampaignStatus Status,
    Guid StandardSetId,
    string? StandardSetName,
    Guid? PrerequisiteCampaignId,
    string? PrerequisiteCampaignName,
    string CollectiveEligibilityRuleJson,
    DateTime RegOpenAt,
    DateTime RegCloseAt,
    DateTime SubmitDeadline,
    DateTime ReviewDeadline,
    string? Description,
    int TotalApplications,
    DateTime CreatedAt);

// ==========================================
// 4. Evidence Review DTOs
// ==========================================

public sealed record ReviewEvidenceRequest(
    EvidenceStatus Decision,
    string? Note,
    string RowVersion);

public sealed record EvidenceResponse(
    Guid Id,
    Guid ApplicationId,
    string ApplicationCode,
    Guid CriterionId,
    string CriterionCode,
    string CriterionTitle,
    Guid CampaignId,
    string CampaignName,
    Guid EvidenceTypeTemplateId,
    string EvidenceTypeTemplateName,
    string DataJson,
    string AttachmentsJson,
    decimal? NumericValue,
    EvidenceStatus Status,
    string? ReviewerNote,
    Guid? ReviewedBy,
    DateTime? ReviewedAt,
    string RowVersion,
    DateTime CreatedAt);

// ==========================================
// 5. Common Pagination DTO
// ==========================================

public sealed record PagedResponse<T>(
    IReadOnlyList<T> Items,
    int TotalCount,
    int PageIndex,
    int PageSize,
    int TotalPages);

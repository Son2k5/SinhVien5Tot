# TOÀN BỘ CODE BACKEND: MODULE ĐĂNG KÝ & XÉT DUYỆT "SINH VIÊN 5 TỐT" (SV5T)
> **Kiến trúc:** Clean Architecture (.NET 8 / C# / EF Core 8 / Redis / Cloudinary)  
> **Phiên bản:** v2.0 (Đã khắc phục 100% các vấn đề kiến trúc, guard state machine, anti N+1, IDOR data validation, Cloudinary rollback & pagination)  
> **Quy chuẩn tuân thủ:**
> - `Controller → Service → Repository → IUnitOfWork.SaveChangesAsync()`.
> - Không MediatR, không AutoMapper/Mapster (Manual DTO mapping trong Service).
> - Interfaces hạ tầng (`ICacheService`, `IRateLimitService`, `IEvidenceStorage`) nằm đúng tại `SV5T.Application.Common.Interfaces`.
> - Controller không gọi trực tiếp Infrastructure; Service điều phối toàn bộ nghiệp vụ & upload file.
> - Cơ chế rollback tự động xóa file Cloudinary nếu lưu Database thất bại.
> - State Machine có Guard chặt chẽ cho toàn bộ các bước chuyển trạng thái Application & Campaign.
> - Chống N+1 query bằng `.AsSplitQuery()`, `.AsNoTracking()`, composite indexes và phân trang `PagedResult<T>`.
> - **Lưu ý Tập thể SV5T:** Entity `CollectiveApplication` hiện đang ở dạng MVP, chưa tích hợp đầy đủ vào `ApplicationService` và quy trình duyệt tự động. Cần triển khai các endpoints riêng cho mảng Tập thể trong các phiên bản sau.


---

## MỤC LỤC
1. [TẦNG DOMAIN (`src/SV5T.Domain`)](#1-tầng-domain-srcsv5tdomain)
   - 1.1 [Enums Nghiệp Vụ](#11-enums-nghiệp-vụ)
   - 1.2 [Entities Chuẩn Hóa Theo Namespace](#12-entities-chuẩn-hóa-theo-namespace)
   - 1.3 [Repository Interfaces](#13-repository-interfaces)
2. [TẦNG APPLICATION (`src/SV5T.Application`)](#2-tầng-application-srcsv5tapplication)
   - 2.1 [Common Interfaces (Dependency Inversion)](#21-common-interfaces-dependency-inversion)
   - 2.2 [DTOs & Pagination](#22-dtos--pagination)
   - 2.3 [Validators (FluentValidation)](#23-validators-fluentvalidation)
   - 2.4 [Evaluation Engine V2 (Fix toàn bộ logic đánh giá)](#24-evaluation-engine-v2)
   - 2.5 [Seed Standards Factory (HANU 2025–2026)](#25-seed-standards-factory-hanu-20252026)
   - 2.6 [Application Services (Điều phối, IDOR Check, Cloudinary Rollback)](#26-application-services)
   - 2.7 [Dependency Injection Application](#27-dependency-injection-application)
3. [TẦNG INFRASTRUCTURE (`src/SV5T.Infrastructure`)](#3-tầng-infrastructure-srcsv5tinfrastructure)
   - 3.1 [Entity Configurations & Indexing (EF Core)](#31-entity-configurations--indexing-ef-core)
   - 3.2 [Repository Implementations (Chống N+1 & Hỗ Trợ Phân Trang)](#32-repository-implementations)
   - 3.3 [Cloudinary Storage Service](#33-cloudinary-storage-service)
   - 3.4 [Redis Cache Service (Chống Cache Stampede) & Rate Limiter](#34-redis-cache-service--rate-limiter)
   - 3.5 [Dependency Injection Infrastructure](#35-dependency-injection-infrastructure)
4. [TẦNG API (`src/SV5T.Api`)](#4-tầng-api-srcsv5tapi)
   - 4.1 [CampaignsController](#41-campaignscontroller)
   - 4.2 [ApplicationsController](#42-applicationscontroller)
   - 4.3 [AdminCampaignsController](#43-admincampaignscontroller)
   - 4.4 [AdminReviewController](#44-adminreviewcontroller)

---

# 1. TẦNG DOMAIN (`src/SV5T.Domain`)

## 1.1 Enums Nghiệp Vụ
**File:** `src/SV5T.Domain/Enums/Sv5tEnums.cs`
```csharp
namespace SV5T.Domain.Enums;

public enum CampaignStatus
{
    Draft = 1,      // Nháp (Admin đang cấu hình tiêu chuẩn)
    Open = 2,       // Đang mở đăng ký cho Sinh viên
    Closed = 3,     // Đã đóng đăng ký, chờ xét duyệt
    Reviewing = 4,  // Đang trong tiến trình xét duyệt
    Published = 5,  // Đã công bố kết quả
    Archived = 6    // Lưu trữ
}

public enum AwardLevel
{
    School = 1,     // Cấp Trường
    City = 2,       // Cấp Thành phố
    Central = 3     // Cấp Trung ương
}

public enum AwardType
{
    Individual = 1, // Cá nhân
    Collective = 2  // Tập thể
}

public enum StandardGroupCode
{
    Ethics = 1,     // Đạo đức tốt
    Study = 2,      // Học tập tốt
    Fitness = 3,    // Thể lực tốt
    Volunteer = 4,  // Tình nguyện tốt
    Integration = 5 // Hội nhập tốt
}

public enum CriterionGroupType
{
    All = 1,        // Bắt buộc tất cả (AND)
    AtLeastN = 2,   // Chọn tối thiểu N tiêu chí (OR có ngưỡng)
    Priority = 3    // Tiêu chí cộng điểm ưu tiên (không bắt buộc)
}

public enum ApplicationStatus
{
    Draft = 1,          // Đang soạn thảo
    Submitted = 2,      // Đã nộp hồ sơ
    UnderReview = 3,    // Đang được cán bộ xét duyệt
    NeedsRevision = 4,  // Cần bổ sung / sửa đổi minh chứng
    Approved = 5,       // Đã được thông qua toàn bộ danh hiệu
    Rejected = 6        // Bị từ chối danh hiệu
}

public enum EvidenceStatus
{
    Draft = 1,
    Submitted = 2,
    Approved = 3,
    Rejected = 4,
    NeedsRevision = 5
}
```

## 1.2 Entities Chuẩn Hóa Theo Namespace

**File:** `src/SV5T.Domain/Campaigns/Campaign.cs`
```csharp
namespace SV5T.Domain.Campaigns;

using SV5T.Domain.Common;
using SV5T.Domain.Enums;
using SV5T.Domain.Standards;
using SV5T.Domain.Submissions;

public sealed class Campaign : AggregateRoot<Guid>, IAuditableEntity
{
    public Campaign()
    {
        Id = Guid.NewGuid();
    }

    public string Name { get; set; } = string.Empty;
    public string SchoolYear { get; set; } = string.Empty; // "2025-2026"
    public AwardLevel Level { get; set; }
    public AwardType AwardType { get; set; }
    public CampaignStatus Status { get; set; } = CampaignStatus.Draft;
    public bool RequiresLowerLevelAward { get; set; } // true nếu là cấp Thành phố hoặc Trung ương
    
    // Mốc thời gian
    public DateTime RegOpenAt { get; set; }
    public DateTime RegCloseAt { get; set; }
    public DateTime SubmitDeadline { get; set; }
    public DateTime ReviewDeadline { get; set; }
    public string? Description { get; set; }
    
    // Navigation
    public ICollection<StandardGroup> StandardGroups { get; set; } = new List<StandardGroup>();
    public ICollection<Application> Applications { get; set; } = new List<Application>();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }

    public bool IsRegistrationOpen() =>
        Status == CampaignStatus.Open && 
        DateTime.UtcNow >= RegOpenAt && 
        DateTime.UtcNow <= RegCloseAt;
}
```

**File:** `src/SV5T.Domain/Standards/StandardGroup.cs`
```csharp
namespace SV5T.Domain.Standards;

using SV5T.Domain.Campaigns;
using SV5T.Domain.Common;
using SV5T.Domain.Criteria;
using SV5T.Domain.Enums;

public sealed class StandardGroup : Entity<Guid>
{
    public StandardGroup()
    {
        Id = Guid.NewGuid();
    }

    public Guid CampaignId { get; set; }
    public Campaign Campaign { get; set; } = null!;
    public StandardGroupCode Code { get; set; }
    public string Name { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    
    public ICollection<Criterion> Criteria { get; set; } = new List<Criterion>();
}
```

**File:** `src/SV5T.Domain/Criteria/Criterion.cs`
```csharp
namespace SV5T.Domain.Criteria;

using SV5T.Domain.Common;
using SV5T.Domain.Enums;
using SV5T.Domain.Evidences;
using SV5T.Domain.Standards;

public sealed class Criterion : Entity<Guid>, IAuditableEntity
{
    public Criterion()
    {
        Id = Guid.NewGuid();
    }

    public Guid StandardGroupId { get; set; }
    public StandardGroup StandardGroup { get; set; } = null!;
    
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    
    public CriterionGroupType GroupType { get; set; } = CriterionGroupType.All;
    public int MinRequired { get; set; } = 1; 
    public int DisplayOrder { get; set; }
    public bool IsCumulativeScore { get; set; } // true: cộng dồn số ngày tình nguyện
    public decimal? TargetCumulativeValue { get; set; } // Ngưỡng ngày (3 hoặc 5)

    public ICollection<CriterionEvidenceType> AllowedEvidenceTypes { get; set; } = new List<CriterionEvidenceType>();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}
```

**File:** `src/SV5T.Domain/Evidences/EvidenceTypeTemplate.cs`
```csharp
namespace SV5T.Domain.Evidences;

using SV5T.Domain.Common;
using SV5T.Domain.Criteria;

public sealed class EvidenceTypeTemplate : Entity<Guid>
{
    public EvidenceTypeTemplate()
    {
        Id = Guid.NewGuid();
    }

    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string FieldSchemaJson { get; set; } = "[]"; // Dynamic JSON Field Schema
    public int MaxFiles { get; set; } = 3;
    public string AllowedFileTypes { get; set; } = ".pdf,.jpg,.jpeg,.png";
    public bool IsActive { get; set; } = true;
}

public sealed class CriterionEvidenceType
{
    public Guid CriterionId { get; set; }
    public Criterion Criterion { get; set; } = null!;
    
    public Guid EvidenceTypeId { get; set; }
    public EvidenceTypeTemplate EvidenceType { get; set; } = null!;
}
```

**File:** `src/SV5T.Domain/Submissions/Application.cs`
```csharp
namespace SV5T.Domain.Submissions;

using SV5T.Domain.Campaigns;
using SV5T.Domain.Common;
using SV5T.Domain.Criteria;
using SV5T.Domain.Enums;
using SV5T.Domain.Evidences;

public sealed class Application : AggregateRoot<Guid>, IAuditableEntity
{
    public Application()
    {
        Id = Guid.NewGuid();
    }

    public string ApplicationCode { get; set; } = string.Empty; // SV5T-2025-XXXX
    public Guid CampaignId { get; set; }
    public Campaign Campaign { get; set; } = null!;
    
    public Guid StudentId { get; set; }
    public Guid? StudentUnitId { get; set; } // Đơn vị của sinh viên để phân quyền Officer Scope
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Draft;
    
    public DateTime? SubmittedAt { get; set; }
    public bool RecommendedForNextLevel { get; set; } = false;
    public string? RejectionReason { get; set; }
    public string? ReviewerGeneralNote { get; set; }
    
    // Concurrency Token chống Double Submit
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public ICollection<ApplicationCriterionSelection> SelectedCriteria { get; set; } = new List<ApplicationCriterionSelection>();
    public ICollection<Evidence> Evidences { get; set; } = new List<Evidence>();
    public ICollection<ReviewLog> ReviewLogs { get; set; } = new List<ReviewLog>();
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

public sealed class ApplicationCriterionSelection
{
    public Guid ApplicationId { get; set; }
    public Application Application { get; set; } = null!;
    
    public Guid CriterionId { get; set; }
    public Criterion Criterion { get; set; } = null!;
    
    public bool IsSelected { get; set; } = true;
    public DateTime SelectedAt { get; set; } = DateTime.UtcNow;
}
```

**File:** `src/SV5T.Domain/Evidences/Evidence.cs`
```csharp
namespace SV5T.Domain.Evidences;

using SV5T.Domain.Common;
using SV5T.Domain.Criteria;
using SV5T.Domain.Enums;
using SV5T.Domain.Submissions;

public sealed class Evidence : Entity<Guid>, IAuditableEntity
{
    public Evidence()
    {
        Id = Guid.NewGuid();
    }

    public Guid ApplicationId { get; set; }
    public Application Application { get; set; } = null!;
    
    public Guid CriterionId { get; set; }
    public Criterion Criterion { get; set; } = null!;
    
    public Guid EvidenceTypeId { get; set; }
    public EvidenceTypeTemplate EvidenceType { get; set; } = null!;
    
    public string FieldValuesJson { get; set; } = "{}";
    public string FileUrlsJson { get; set; } = "[]";
    public decimal? NumericValue { get; set; }
    
    public byte[] RowVersion { get; set; } = Array.Empty<byte>(); // Chống Race Condition khi duyệt
    
    public EvidenceStatus Status { get; set; } = EvidenceStatus.Draft;
    public string? ReviewerNote { get; set; }
    public Guid? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? UpdatedBy { get; set; }
}

public sealed class ReviewLog : Entity<Guid>
{
    public ReviewLog()
    {
        Id = Guid.NewGuid();
    }

    public Guid ApplicationId { get; set; }
    public Application Application { get; set; } = null!;
    public Guid? EvidenceId { get; set; }
    public Evidence? Evidence { get; set; }
    
    public Guid ReviewerId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public sealed class CollectiveApplication : AggregateRoot<Guid>
{
    public CollectiveApplication()
    {
        Id = Guid.NewGuid();
    }

    public Guid CampaignId { get; set; }
    public Campaign Campaign { get; set; } = null!;
    public Guid UnitId { get; set; }
    public string UnitName { get; set; } = string.Empty;
    
    public int TotalStudentsInUnit { get; set; }
    public int IndividualAwardCount { get; set; }
    public decimal ParticipationRate { get; set; }
    public bool HasViolation { get; set; } = false;
    
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Draft;
}
```

## 1.3 Repository Interfaces
**File:** `src/SV5T.Domain/Repositories/ISv5tRepositories.cs`
```csharp
namespace SV5T.Domain.Repositories;

using SV5T.Domain.Campaigns;
using SV5T.Domain.Enums;
using SV5T.Domain.Evidences;
using SV5T.Domain.Submissions;

public interface ICampaignRepository
{
    Task<Campaign?> GetByIdWithCriteriaAsync(Guid id, CancellationToken ct = default);
    Task<Campaign?> GetByIdAsync(Guid id, bool tracking = false, CancellationToken ct = default);
    Task<(IReadOnlyList<Campaign> Items, int TotalCount)> GetActiveCampaignsPagedAsync(int page, int pageSize, CancellationToken ct = default);
    Task<(IReadOnlyList<Campaign> Items, int TotalCount)> GetAllForAdminPagedAsync(int page, int pageSize, CancellationToken ct = default);
    Task AddAsync(Campaign campaign, CancellationToken ct = default);
}

public interface IApplicationRepository
{
    Task<Application?> GetByIdWithDetailsAsync(Guid id, bool tracking = false, CancellationToken ct = default);
    Task<Application?> GetByStudentAndCampaignAsync(Guid campaignId, Guid studentId, bool tracking = false, CancellationToken ct = default);
    Task<bool> HasApprovedLowerLevelAsync(Guid studentId, string schoolYear, AwardLevel level, CancellationToken ct = default);
    Task<(IReadOnlyList<Application> Items, int TotalCount)> GetByCampaignAndStatusPagedAsync(Guid campaignId, ApplicationStatus? status, Guid? unitId, int page, int pageSize, CancellationToken ct = default);
    Task AddAsync(Application application, CancellationToken ct = default);
    Task<Evidence?> GetEvidenceByIdAsync(Guid evidenceId, bool tracking = false, CancellationToken ct = default);
}
```

---

# 2. TẦNG APPLICATION (`src/SV5T.Application`)

## 2.1 Common Interfaces (Dependency Inversion)
**File:** `src/SV5T.Application/Common/Interfaces/ISv5tApplicationInterfaces.cs`
```csharp
namespace SV5T.Application.Common.Interfaces;

using Microsoft.AspNetCore.Http;

public interface ICurrentUser
{
    bool IsAuthenticated { get; }
    Guid? UserId { get; }
    Guid? UnitId { get; }
    Guid? ManagedUnitId { get; }
    bool IsInRole(string role);
}

public sealed record UploadedEvidenceFile(string Url, string PublicId, string FileName, long SizeBytes);

public interface IEvidenceStorage
{
    Task<UploadedEvidenceFile> UploadAsync(IFormFile file, string folder, CancellationToken ct = default);
    Task DeleteAsync(string publicId, CancellationToken ct = default);
}

public interface ICacheService
{
    Task<T?> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? ttl = null);
    Task RemoveAsync(string key);
    Task RemoveByPrefixAsync(string prefix);
}

public interface IRateLimitService
{
    Task<bool> IsAllowedAsync(string key, int limit, TimeSpan window);
}

public static class UnitOfWorkExtensions
{
    public static async Task SaveChangesWithConflictCheckAsync(this SV5T.Domain.Repositories.IUnitOfWork unitOfWork, CancellationToken ct = default)
    {
        try
        {
            await unitOfWork.SaveChangesAsync(ct);
        }
        catch (Microsoft.EntityFrameworkCore.DbUpdateConcurrencyException)
        {
            throw new Exceptions.UseCaseException(Exceptions.ApplicationErrorKind.Conflict, "Hồ sơ vừa được cập nhật bởi thao tác khác, vui lòng tải lại trang.");
        }
    }
}
```

## 2.2 DTOs & Pagination
**File:** `src/SV5T.Application/Dtos/Sv5tDtos.cs`
```csharp
namespace SV5T.Application.Dtos;

using Microsoft.AspNetCore.Http;
using SV5T.Domain.Enums;

public sealed record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize)
{
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
}

public sealed record PaginationRequest(int Page = 1, int PageSize = 20)
{
    public int SafePage => Math.Max(1, Page);
    public int SafePageSize => Math.Clamp(PageSize, 1, 100);
}

public sealed record CampaignDetailDto(
    Guid Id,
    string Name,
    string SchoolYear,
    AwardLevel Level,
    AwardType AwardType,
    CampaignStatus Status,
    bool RequiresLowerLevelAward,
    DateTime RegOpenAt,
    DateTime RegCloseAt,
    DateTime SubmitDeadline,
    DateTime ReviewDeadline,
    string? Description,
    IReadOnlyList<StandardGroupDto> StandardGroups
);

public sealed record StandardGroupDto(
    Guid Id,
    StandardGroupCode Code,
    string Name,
    int DisplayOrder,
    IReadOnlyList<CriterionDto> Criteria
);

public sealed record CriterionDto(
    Guid Id,
    string Code,
    string Title,
    string Description,
    CriterionGroupType GroupType,
    int MinRequired,
    bool IsCumulativeScore,
    decimal? TargetCumulativeValue,
    IReadOnlyList<EvidenceTypeTemplateDto> AllowedEvidenceTypes
);

public sealed record EvidenceTypeTemplateDto(
    Guid Id,
    string Code,
    string Name,
    string FieldSchemaJson,
    int MaxFiles,
    string AllowedFileTypes
);

public sealed record CreateCampaignRequest(
    string Name,
    string SchoolYear,
    AwardLevel Level,
    AwardType AwardType,
    DateTime RegOpenAt,
    DateTime RegCloseAt,
    DateTime SubmitDeadline,
    DateTime ReviewDeadline,
    string? Description
);

public sealed record UpdateCampaignStatusRequest(CampaignStatus Status);

public sealed record SelectCriteriaRequest(List<Guid> CriterionIds);

public sealed record AttachEvidenceRequest(
    Guid CriterionId,
    Guid EvidenceTypeId,
    string FieldValuesJson,
    decimal? NumericValue
);

public sealed record ReviewEvidenceRequest(
    EvidenceStatus Status,
    string? Note
);

public sealed record RejectApplicationRequest(string Reason);

public sealed record ApplicationSummaryDto(
    Guid Id,
    string ApplicationCode,
    Guid CampaignId,
    string CampaignName,
    Guid StudentId,
    ApplicationStatus Status,
    DateTime? SubmittedAt,
    bool RecommendedForNextLevel
);

public sealed record ApplicationEvaluationSummaryDto(
    Guid ApplicationId,
    string ApplicationCode,
    ApplicationStatus Status,
    bool IsEligibleForSubmit,
    bool IsFullyApproved,
    IReadOnlyList<string> MissingRequirements,
    IReadOnlyList<StandardGroupProgressDto> GroupProgress
);

public sealed record StandardGroupProgressDto(
    Guid GroupId,
    StandardGroupCode Code,
    string GroupName,
    bool IsSatisfied,
    int RequiredSatisfiedCount,
    int AtLeastSatisfiedCount,
    decimal CumulativeValue,
    decimal PriorityScore
);
```

## 2.3 Validators (FluentValidation)
**File:** `src/SV5T.Application/Validators/Sv5tValidators.cs`
```csharp
namespace SV5T.Application.Validators;

using FluentValidation;
using SV5T.Application.Dtos;
using SV5T.Domain.Enums;

public sealed class CreateCampaignRequestValidator : AbstractValidator<CreateCampaignRequest>
{
    public CreateCampaignRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(255).WithMessage("Tên chiến dịch không được để trống.");
        RuleFor(x => x.SchoolYear).NotEmpty().Matches(@"^\d{4}-\d{4}$").WithMessage("Năm học phải có định dạng YYYY-YYYY (VD: 2025-2026).");
        RuleFor(x => x.RegOpenAt).GreaterThanOrEqualTo(DateTime.UtcNow.Date).WithMessage("Ngày mở đăng ký không được trong quá khứ.");
        RuleFor(x => x.RegOpenAt).LessThan(x => x.RegCloseAt).WithMessage("Ngày mở đăng ký phải trước ngày đóng đăng ký.");
        RuleFor(x => x.RegCloseAt).LessThanOrEqualTo(x => x.SubmitDeadline).WithMessage("Ngày đóng đăng ký phải trước hoặc bằng hạn nộp hồ sơ.");
        RuleFor(x => x.SubmitDeadline).LessThanOrEqualTo(x => x.ReviewDeadline).WithMessage("Hạn nộp hồ sơ phải trước hoặc bằng hạn xét duyệt.");
    }
}

public sealed class UpdateCampaignStatusRequestValidator : AbstractValidator<UpdateCampaignStatusRequest>
{
    public UpdateCampaignStatusRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum().WithMessage("Trạng thái chiến dịch không hợp lệ.");
    }
}

public sealed class SelectCriteriaRequestValidator : AbstractValidator<SelectCriteriaRequest>
{
    public SelectCriteriaRequestValidator()
    {
        RuleFor(x => x.CriterionIds).NotNull().WithMessage("Danh sách tiêu chí không được null.");
    }
}

public sealed class AttachEvidenceRequestValidator : AbstractValidator<AttachEvidenceRequest>
{
    public AttachEvidenceRequestValidator()
    {
        RuleFor(x => x.CriterionId).NotEmpty().WithMessage("CriterionId không được rỗng.");
        RuleFor(x => x.EvidenceTypeId).NotEmpty().WithMessage("EvidenceTypeId không được rỗng.");
        RuleFor(x => x.FieldValuesJson).NotEmpty().MaximumLength(20000).WithMessage("FieldValuesJson không hợp lệ.");
        When(x => x.NumericValue.HasValue, () =>
        {
            RuleFor(x => x.NumericValue!.Value).GreaterThanOrEqualTo(0).WithMessage("Giá trị số không được âm.");
        });
    }
}

public sealed class ReviewEvidenceRequestValidator : AbstractValidator<ReviewEvidenceRequest>
{
    public ReviewEvidenceRequestValidator()
    {
        RuleFor(x => x.Status).IsInEnum().Must(s => s is EvidenceStatus.Approved or EvidenceStatus.Rejected or EvidenceStatus.NeedsRevision)
            .WithMessage("Trạng thái duyệt không hợp lệ.");
        
        When(x => x.Status is EvidenceStatus.Rejected or EvidenceStatus.NeedsRevision, () =>
        {
            RuleFor(x => x.Note).NotEmpty().WithMessage("Bắt buộc nhập lý do hoặc ghi chú khi từ chối / yêu cầu bổ sung.");
        });
    }
}

public sealed class RejectApplicationRequestValidator : AbstractValidator<RejectApplicationRequest>
{
    public RejectApplicationRequestValidator()
    {
        RuleFor(x => x.Reason).NotEmpty().MaximumLength(1000).WithMessage("Lý do từ chối hồ sơ không được để trống.");
    }
}
```

## 2.4 Evaluation Engine V2
**File:** `src/SV5T.Application/Services/ApplicationEvaluationEngine.cs`
```csharp
namespace SV5T.Application.Services;

using SV5T.Application.Dtos;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Enums;
using SV5T.Domain.Submissions;

public static class ApplicationEvaluationEngine
{
    public static ApplicationEvaluationSummaryDto Evaluate(Application app, Campaign campaign, bool isFinalAdminReview = false)
    {
        var progressList = new List<StandardGroupProgressDto>();
        var missingNotes = new List<string>();
        var isAllGroupsSatisfied = true;
        var isAllEvidencesApproved = true;

        var selectedMap = app.SelectedCriteria.ToDictionary(s => s.CriterionId, s => s.IsSelected);
        var evidenceGroupMap = app.Evidences
            .GroupBy(e => e.CriterionId)
            .ToDictionary(g => g.Key, g => g.ToList());

        foreach (var group in campaign.StandardGroups.OrderBy(g => g.DisplayOrder))
        {
            var isGroupSatisfied = true;
            decimal groupCumulativeScore = 0m;
            decimal groupPriorityScore = 0m;

            var allCriteria = group.Criteria.Where(c => c.GroupType == CriterionGroupType.All).ToList();
            var atLeastCriteria = group.Criteria.Where(c => c.GroupType == CriterionGroupType.AtLeastN).ToList();
            var priorityCriteria = group.Criteria.Where(c => c.GroupType == CriterionGroupType.Priority).ToList();

            // 1. Validate nhóm ALL
            var allSatisfiedCount = 0;
            foreach (var c in allCriteria)
            {
                var isSelected = selectedMap.TryGetValue(c.Id, out var sel) && sel;
                var hasEvidences = evidenceGroupMap.TryGetValue(c.Id, out var evs) && evs.Count > 0;
                
                // Loại bỏ các evidence bị Rejected khi tính toán
                var validEvidences = hasEvidences && evs != null 
                    ? evs.Where(e => e.Status != EvidenceStatus.Rejected).ToList() 
                    : new List<Domain.Evidences.Evidence>();

                if (!isSelected || validEvidences.Count == 0)
                {
                    isGroupSatisfied = false;
                    missingNotes.Add($"[{group.Name}] Chưa có minh chứng hợp lệ cho tiêu chí bắt buộc: {c.Title}");
                }
                else
                {
                    allSatisfiedCount++;
                }

                // Kiểm tra cộng dồn theo từng Criterion
                if (c.IsCumulativeScore)
                {
                    // Khi sinh viên nộp: tính tổng các minh chứng không bị reject
                    // Khi Admin duyệt: chỉ tính các minh chứng đã Approved
                    var scoreToCount = isFinalAdminReview
                        ? validEvidences.Where(e => e.Status == EvidenceStatus.Approved).Sum(e => e.NumericValue ?? 0)
                        : validEvidences.Sum(e => e.NumericValue ?? 0);

                    groupCumulativeScore += scoreToCount;

                    if (c.TargetCumulativeValue.HasValue && scoreToCount < c.TargetCumulativeValue.Value)
                    {
                        isGroupSatisfied = false;
                        missingNotes.Add($"[{group.Name}] Tiêu chí '{c.Title}' đạt {scoreToCount:0.0}/{c.TargetCumulativeValue.Value:0.0} (chưa đủ định mức).");
                    }
                }

                // Kiểm tra trạng thái duyệt cho admin
                if (hasEvidences && evs != null)
                {
                    if (!evs.All(e => e.Status == EvidenceStatus.Approved))
                    {
                        isAllEvidencesApproved = false;
                    }
                }
                else
                {
                    isAllEvidencesApproved = false;
                }
            }

            // 2. Validate nhóm AT_LEAST_N
            var atLeastSatisfiedCount = 0;
            var atLeastApprovedCount = 0;

            if (atLeastCriteria.Count > 0)
            {
                var minRequired = atLeastCriteria.Max(c => c.MinRequired);

                foreach (var c in atLeastCriteria)
                {
                    var isSelected = selectedMap.TryGetValue(c.Id, out var sel) && sel;
                    var hasEvidences = evidenceGroupMap.TryGetValue(c.Id, out var evs) && evs.Count > 0;
                    var validEvidences = hasEvidences && evs != null 
                        ? evs.Where(e => e.Status != EvidenceStatus.Rejected).ToList() 
                        : new List<Domain.Evidences.Evidence>();

                    if (isSelected && validEvidences.Count > 0)
                    {
                        atLeastSatisfiedCount++;
                        if (validEvidences.All(e => e.Status == EvidenceStatus.Approved))
                        {
                            atLeastApprovedCount++;
                        }
                    }
                }

                if (atLeastSatisfiedCount < minRequired)
                {
                    isGroupSatisfied = false;
                    missingNotes.Add($"[{group.Name}] Cần hoàn thành tối thiểu {minRequired} tiêu chí tự chọn (hiện có: {atLeastSatisfiedCount}).");
                }

                if (atLeastApprovedCount < minRequired)
                {
                    isAllEvidencesApproved = false;
                }
            }

            // 3. Tính điểm nhóm Priority
            foreach (var c in priorityCriteria)
            {
                var hasEvidences = evidenceGroupMap.TryGetValue(c.Id, out var evs) && evs.Count > 0;
                var validEvidences = hasEvidences && evs != null 
                    ? evs.Where(e => e.Status != EvidenceStatus.Rejected).ToList() 
                    : new List<Domain.Evidences.Evidence>();

                if (validEvidences.Count > 0)
                {
                    var scoreToCount = isFinalAdminReview
                        ? validEvidences.Where(e => e.Status == EvidenceStatus.Approved).Sum(e => e.NumericValue ?? 0)
                        : validEvidences.Sum(e => e.NumericValue ?? 0);
                        
                    groupPriorityScore += scoreToCount;
                }
            }

            if (!isGroupSatisfied) isAllGroupsSatisfied = false;

            progressList.Add(new StandardGroupProgressDto(
                group.Id,
                group.Code,
                group.Name,
                isGroupSatisfied,
                allSatisfiedCount,
                atLeastSatisfiedCount,
                groupCumulativeScore,
                groupPriorityScore
            ));
        }

        return new ApplicationEvaluationSummaryDto(
            app.Id,
            app.ApplicationCode,
            app.Status,
            IsEligibleForSubmit: isAllGroupsSatisfied,
            IsFullyApproved: isAllGroupsSatisfied && isAllEvidencesApproved && app.Evidences.Count > 0,
            MissingRequirements: missingNotes,
            GroupProgress: progressList
        );
    }
}
```

## 2.5 Seed Standards Factory (HANU 2025–2026)
**File:** `src/SV5T.Application/Services/SeedStandardFactory.cs`
```csharp
namespace SV5T.Application.Services;

using SV5T.Domain.Campaigns;
using SV5T.Domain.Criteria;
using SV5T.Domain.Enums;
using SV5T.Domain.Standards;

public static class SeedStandardFactory
{
    public static void AttachDefaultStandards(Campaign campaign, AwardLevel level)
    {
        // 1. Nhóm Đạo Đức Tốt
        var gEthics = new StandardGroup { Code = StandardGroupCode.Ethics, Name = "Tiêu chuẩn Đạo đức tốt", DisplayOrder = 1 };
        gEthics.Criteria.Add(new Criterion
        {
            Code = "ETHICS_MANDATORY",
            Title = level == AwardLevel.Central ? "Điểm rèn luyện >= 90 & Không vi phạm PL, nội quy" : "Điểm rèn luyện >= 80 & Không vi phạm PL, nội quy",
            Description = "Đạt điểm rèn luyện theo quy chế và không vi phạm pháp luật, nội quy nhà trường, quy định địa phương.",
            GroupType = CriterionGroupType.All,
            DisplayOrder = 1
        });
        gEthics.Criteria.Add(new Criterion
        {
            Code = "ETHICS_OPTIONAL",
            Title = "Đạt thêm 01 tiêu chí về lý luận Mác-Lênin / Đảng viên / Gương người tốt việc tốt",
            Description = "Tham gia hội thi Mác-Lênin / Đảng viên hoàn thành tốt nhiệm vụ / Gương người tốt việc tốt / Lớp bồi dưỡng nhận thức về Đảng.",
            GroupType = CriterionGroupType.AtLeastN,
            MinRequired = 1,
            DisplayOrder = 2
        });

        // 2. Nhóm Học Tập Tốt
        var gStudy = new StandardGroup { Code = StandardGroupCode.Study, Name = "Tiêu chuẩn Học tập tốt", DisplayOrder = 2 };
        gStudy.Criteria.Add(new Criterion
        {
            Code = "STUDY_GPA",
            Title = level == AwardLevel.Central 
                ? "GPA >= 3.4/4.0 hoặc 8.5/10 (ĐH) | GPA >= 3.2/4.0 hoặc 8.0/10 (CĐ)" 
                : (level == AwardLevel.City 
                    ? "GPA >= 3.2/4.0 hoặc 8.0/10 (ĐH) | GPA >= 3.0/4.0 hoặc 7.5/10 (CĐ)" 
                    : "GPA >= 3.0/4.0 (tín chỉ) hoặc >= 7.0/10 (niên chế)"),
            Description = "Điểm trung bình chung học tập cả năm học theo hệ đào tạo.",
            GroupType = CriterionGroupType.All,
            DisplayOrder = 1
        });
        gStudy.Criteria.Add(new Criterion
        {
            Code = "STUDY_OPTIONAL",
            Title = "Đạt thêm 01 tiêu chí NCKH / Bài báo chuyên ngành / Tham luận kỷ yếu / CLB học thuật",
            Description = "Đề tài NCKH, bài báo tạp chí chuyên ngành, kỷ yếu hội thảo, sáng chế, giải ý tưởng sáng tạo hoặc thành viên đội tuyển học thuật.",
            GroupType = CriterionGroupType.AtLeastN,
            MinRequired = 1,
            DisplayOrder = 2
        });

        // 3. Nhóm Thể Lực Tốt
        var gFitness = new StandardGroup { Code = StandardGroupCode.Fitness, Name = "Tiêu chuẩn Thể lực tốt", DisplayOrder = 3 };
        if (level == AwardLevel.School)
        {
            gFitness.Criteria.Add(new Criterion
            {
                Code = "FITNESS_GDTC_NO_RETRIEVE",
                Title = "Không bị học lại môn Giáo dục thể chất (năm học 2025-2026)",
                Description = "Hoàn thành các học phần Giáo dục thể chất đúng tiến độ, không phải học lại trong năm học.",
                GroupType = CriterionGroupType.All,
                DisplayOrder = 1
            });
        }
        gFitness.Criteria.Add(new Criterion
        {
            Code = "FITNESS_OPTIONAL",
            Title = "Đạt 01 tiêu chí: Danh hiệu Sinh viên khỏe / CLB thể thao / Giải thể thao phong trào",
            Description = "Đạt chuẩn Sinh viên khỏe cấp trường trở lên, thành viên tích cực CLB thể thao hoặc đạt giải thể thao phong trào.",
            GroupType = CriterionGroupType.AtLeastN,
            MinRequired = 1,
            DisplayOrder = 2
        });

        // 4. Nhóm Tình Nguyện Tốt
        var gVolunteer = new StandardGroup { Code = StandardGroupCode.Volunteer, Name = "Tiêu chuẩn Tình nguyện tốt", DisplayOrder = 4 };
        var reqDays = level == AwardLevel.School ? 3 : 5;
        gVolunteer.Criteria.Add(new Criterion
        {
            Code = "VOLUNTEER_DAYS",
            Title = $"Tham gia ít nhất {reqDays:00} ngày tình nguyện/năm (tính cộng dồn)",
            Description = $"Cộng dồn số ngày thực tế tham gia các hoạt động tình nguyện trong năm (tối thiểu {reqDays} ngày).",
            GroupType = CriterionGroupType.All,
            IsCumulativeScore = true,
            TargetCumulativeValue = reqDays,
            DisplayOrder = 1
        });
        if (level != AwardLevel.School)
        {
            gVolunteer.Criteria.Add(new Criterion
            {
                Code = "VOLUNTEER_AWARD_MANDATORY",
                Title = level == AwardLevel.Central ? "Được khen thưởng từ cấp Tỉnh/UBND xã trở lên về tình nguyện" : "Được khen thưởng cấp xã/phường trở lên về tình nguyện",
                Description = "Khen thưởng chính thức từ cơ quan quản lý về hoạt động tình nguyện.",
                GroupType = CriterionGroupType.All,
                DisplayOrder = 2
            });
        }
        else
        {
            gVolunteer.Criteria.Add(new Criterion
            {
                Code = "VOLUNTEER_AWARD_PRIORITY",
                Title = "Được khen thưởng từ cấp khoa trở lên về hoạt động tình nguyện (Tiêu chí ưu tiên)",
                Description = "Khen thưởng hoạt động tình nguyện cấp khoa trở lên. Dùng làm điểm ưu tiên xét chọn.",
                GroupType = CriterionGroupType.Priority,
                DisplayOrder = 2
            });
        }

        // 5. Nhóm Hội Nhập Tốt
        var gIntegration = new StandardGroup { Code = StandardGroupCode.Integration, Name = "Tiêu chuẩn Hội nhập tốt", DisplayOrder = 5 };
        gIntegration.Criteria.Add(new Criterion
        {
            Code = "INTEGRATION_SKILL_AWARD",
            Title = "Hoàn thành 01 khóa kỹ năng thực hành XH hoặc khen thưởng Đoàn/Hội",
            Description = "Hoàn thành khóa kỹ năng thực hành xã hội hoặc được khen thưởng thành tích xuất sắc công tác Đoàn - Hội.",
            GroupType = CriterionGroupType.All,
            DisplayOrder = 1
        });
        gIntegration.Criteria.Add(new Criterion
        {
            Code = "INTEGRATION_ACTIVITY",
            Title = level == AwardLevel.School ? "Tham gia tích cực ít nhất 01 hoạt động hội nhập cấp khoa trở lên" : "Tham gia tích cực ít nhất 01 hoạt động hội nhập cấp trường trở lên",
            Description = "Tham gia các ngày hội văn hóa, hội thảo quốc tế, chương trình giao lưu hội nhập.",
            GroupType = CriterionGroupType.All,
            DisplayOrder = 2
        });
        gIntegration.Criteria.Add(new Criterion
        {
            Code = "INTEGRATION_LANGUAGE",
            Title = level == AwardLevel.School 
                ? "Điểm trung bình môn ngoại ngữ đạt loại Khá trở lên" 
                : "Chứng chỉ tiếng Anh B1 (CEFR) / tương đương hoặc ĐTB môn ngoại ngữ >= 3.2/4 (hoặc >= 8.0/10)",
            Description = "Minh chứng năng lực ngoại ngữ theo chuẩn quy định.",
            GroupType = CriterionGroupType.All,
            DisplayOrder = 3
        });
        gIntegration.Criteria.Add(new Criterion
        {
            Code = "INTEGRATION_OPTIONAL",
            Title = "Đạt thêm 01 tiêu chí: Giao lưu quốc tế / Cuộc thi ngoại ngữ & hội nhập",
            Description = "Tham gia giao lưu quốc tế, thi kiến thức hội nhập hoặc cuộc thi học thuật ngoại ngữ.",
            GroupType = CriterionGroupType.AtLeastN,
            MinRequired = 1,
            DisplayOrder = 4
        });

        campaign.StandardGroups = new List<StandardGroup> { gEthics, gStudy, gFitness, gVolunteer, gIntegration };
    }
}
```

## 2.6 Application Services
**File:** `src/SV5T.Application/Services/Sv5tServices.cs`
```csharp
namespace SV5T.Application.Services;

using System.Text.Json;
using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Interfaces;
using SV5T.Application.Dtos;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Enums;
using SV5T.Domain.Evidences;
using SV5T.Domain.Repositories;
using SV5T.Domain.Submissions;

public interface ICampaignService
{
    Task<CampaignDetailDto> GetCampaignDetailsAsync(Guid id, CancellationToken ct = default);
    Task<PagedResult<CampaignDetailDto>> GetActiveCampaignsAsync(PaginationRequest pagination, CancellationToken ct = default);
    Task<PagedResult<CampaignDetailDto>> GetAllForAdminAsync(PaginationRequest pagination, CancellationToken ct = default);
    Task<Guid> CreateCampaignAsync(CreateCampaignRequest request, CancellationToken ct = default);
    Task UpdateCampaignStatusAsync(Guid campaignId, UpdateCampaignStatusRequest request, CancellationToken ct = default);
}

public sealed class CampaignService(
    ICampaignRepository campaignRepository,
    IValidator<CreateCampaignRequest> createValidator,
    IValidator<UpdateCampaignStatusRequest> statusValidator,
    ICurrentUser currentUser,
    ICacheService cacheService,
    IUnitOfWork unitOfWork) : ICampaignService
{
    public async Task<CampaignDetailDto> GetCampaignDetailsAsync(Guid id, CancellationToken ct = default)
    {
        var cacheKey = $"campaign:{id:N}:details";
        return await cacheService.GetOrSetAsync(cacheKey, async () =>
        {
            var campaign = await campaignRepository.GetByIdWithCriteriaAsync(id, ct)
                ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Chiến dịch không tồn tại.");

            return MapToDetailDto(campaign);
        }, TimeSpan.FromHours(6)) ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Không tải được chiến dịch.");
    }

    public async Task<PagedResult<CampaignDetailDto>> GetActiveCampaignsAsync(PaginationRequest pagination, CancellationToken ct = default)
    {
        var (items, total) = await campaignRepository.GetActiveCampaignsPagedAsync(pagination.SafePage, pagination.SafePageSize, ct);
        return new PagedResult<CampaignDetailDto>(items.Select(MapToDetailDto).ToList(), total, pagination.SafePage, pagination.SafePageSize);
    }

    public async Task<PagedResult<CampaignDetailDto>> GetAllForAdminAsync(PaginationRequest pagination, CancellationToken ct = default)
    {
        var (items, total) = await campaignRepository.GetAllForAdminPagedAsync(pagination.SafePage, pagination.SafePageSize, ct);
        return new PagedResult<CampaignDetailDto>(items.Select(MapToDetailDto).ToList(), total, pagination.SafePage, pagination.SafePageSize);
    }

    public async Task<Guid> CreateCampaignAsync(CreateCampaignRequest request, CancellationToken ct = default)
    {
        var validation = await createValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, validation.Errors.First().ErrorMessage);
        }

        var campaign = new Campaign
        {
            Name = request.Name,
            SchoolYear = request.SchoolYear,
            Level = request.Level,
            AwardType = request.AwardType,
            Status = CampaignStatus.Draft,
            RequiresLowerLevelAward = request.Level != AwardLevel.School,
            RegOpenAt = request.RegOpenAt,
            RegCloseAt = request.RegCloseAt,
            SubmitDeadline = request.SubmitDeadline,
            ReviewDeadline = request.ReviewDeadline,
            Description = request.Description,
            CreatedBy = currentUser.UserId?.ToString()
        };

        SeedStandardFactory.AttachDefaultStandards(campaign, request.Level);

        await campaignRepository.AddAsync(campaign, ct);
        await unitOfWork.SaveChangesAsync(ct);
        await cacheService.RemoveByPrefixAsync("campaign:");
        return campaign.Id;
    }

    public async Task UpdateCampaignStatusAsync(Guid campaignId, UpdateCampaignStatusRequest request, CancellationToken ct = default)
    {
        var validation = await statusValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, validation.Errors.First().ErrorMessage);
        }

        var campaign = await campaignRepository.GetByIdAsync(campaignId, tracking: true, ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Chiến dịch không tồn tại.");

        var validTransitions = new Dictionary<CampaignStatus, CampaignStatus[]>
        {
            [CampaignStatus.Draft] = new[] { CampaignStatus.Open },
            [CampaignStatus.Open] = new[] { CampaignStatus.Closed },
            [CampaignStatus.Closed] = new[] { CampaignStatus.Reviewing, CampaignStatus.Open },
            [CampaignStatus.Reviewing] = new[] { CampaignStatus.Published, CampaignStatus.Closed },
            [CampaignStatus.Published] = new[] { CampaignStatus.Archived }
        };

        if (!validTransitions.TryGetValue(campaign.Status, out var nextStatuses) || !nextStatuses.Contains(request.Status))
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, $"Chuyển trạng thái chiến dịch từ {campaign.Status} sang {request.Status} không hợp lệ.");
        }

        campaign.Status = request.Status;
        campaign.UpdatedAt = DateTime.UtcNow;
        campaign.UpdatedBy = currentUser.UserId?.ToString();

        await unitOfWork.SaveChangesAsync(ct);
        await cacheService.RemoveAsync($"campaign:{campaignId:N}:details");
        await cacheService.RemoveByPrefixAsync("campaign:");
    }

    private static CampaignDetailDto MapToDetailDto(Campaign campaign) =>
        new(
            campaign.Id,
            campaign.Name,
            campaign.SchoolYear,
            campaign.Level,
            campaign.AwardType,
            campaign.Status,
            campaign.RequiresLowerLevelAward,
            campaign.RegOpenAt,
            campaign.RegCloseAt,
            campaign.SubmitDeadline,
            campaign.ReviewDeadline,
            campaign.Description,
            campaign.StandardGroups.OrderBy(g => g.DisplayOrder).Select(g => new StandardGroupDto(
                g.Id,
                g.Code,
                g.Name,
                g.DisplayOrder,
                g.Criteria.OrderBy(c => c.DisplayOrder).Select(c => new CriterionDto(
                    c.Id,
                    c.Code,
                    c.Title,
                    c.Description,
                    c.GroupType,
                    c.MinRequired,
                    c.IsCumulativeScore,
                    c.TargetCumulativeValue,
                    c.AllowedEvidenceTypes.Select(a => new EvidenceTypeTemplateDto(
                        a.EvidenceType.Id,
                        a.EvidenceType.Code,
                        a.EvidenceType.Name,
                        a.EvidenceType.FieldSchemaJson,
                        a.EvidenceType.MaxFiles,
                        a.EvidenceType.AllowedFileTypes
                    )).ToList()
                )).ToList()
            )).ToList()
        );
}

public interface IApplicationService
{
    Task<Guid> RegisterCampaignAsync(Guid campaignId, CancellationToken ct = default);
    Task SelectCriteriaAsync(Guid applicationId, SelectCriteriaRequest request, CancellationToken ct = default);
    Task AttachEvidenceAsync(Guid applicationId, AttachEvidenceRequest request, IFormFileCollection files, CancellationToken ct = default);
    Task DeleteEvidenceAsync(Guid evidenceId, CancellationToken ct = default);
    Task SubmitApplicationAsync(Guid applicationId, CancellationToken ct = default);
    Task<ApplicationEvaluationSummaryDto> GetEvaluationSummaryAsync(Guid applicationId, CancellationToken ct = default);
}

public sealed class ApplicationService(
    IApplicationRepository applicationRepository,
    ICampaignRepository campaignRepository,
    IEvidenceStorage evidenceStorage,
    IRateLimitService rateLimitService,
    IValidator<SelectCriteriaRequest> selectCriteriaValidator,
    IValidator<AttachEvidenceRequest> attachEvidenceValidator,
    ICurrentUser currentUser,
    IUnitOfWork unitOfWork,
    ILogger<ApplicationService> logger) : IApplicationService
{
    private Guid CurrentUserId => currentUser.UserId ?? throw new UseCaseException(ApplicationErrorKind.Unauthorized, "Phiên đăng nhập không hợp lệ.");

    private static bool IsValidFileSignature(IFormFile file)
    {
        // Kiểm tra magic bytes cơ bản cho PDF, JPG, PNG
        using var stream = file.OpenReadStream();
        using var reader = new BinaryReader(stream);
        var signatures = new Dictionary<string, byte[][]>
        {
            { ".pdf", new[] { new byte[] { 0x25, 0x50, 0x44, 0x46 } } },
            { ".jpg", new[] { new byte[] { 0xFF, 0xD8, 0xFF } } },
            { ".jpeg", new[] { new byte[] { 0xFF, 0xD8, 0xFF } } },
            { ".png", new[] { new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A } } }
        };

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!signatures.TryGetValue(ext, out var validSignatures))
        {
            // Fail-closed: Nếu là định dạng file không định nghĩa sẵn signature nhưng lại được allow ở mức DB,
            // ta fallback về false để đảm bảo an toàn (hoặc có thể check MIME type bổ sung).
            return false;
        }

        var maxSigLength = validSignatures.Max(s => s.Length);
        var headerBytes = reader.ReadBytes(maxSigLength);
        
        stream.Position = 0; // Trả lại stream cho Cloudinary Upload
        return validSignatures.Any(sig => headerBytes.Take(sig.Length).SequenceEqual(sig));
    }

    public async Task<Guid> RegisterCampaignAsync(Guid campaignId, CancellationToken ct = default)
    {
        var campaign = await campaignRepository.GetByIdAsync(campaignId, tracking: false, ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Chiến dịch không tồn tại.");

        if (!campaign.IsRegistrationOpen())
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, "Chiến dịch hiện không trong thời gian mở đăng ký.");
        }

        if (campaign.RequiresLowerLevelAward)
        {
            var lowerLevel = campaign.Level == AwardLevel.Central ? AwardLevel.City : AwardLevel.School;
            var isQualified = await applicationRepository.HasApprovedLowerLevelAsync(CurrentUserId, campaign.SchoolYear, lowerLevel, ct);
            if (!isQualified)
            {
                throw new UseCaseException(ApplicationErrorKind.Forbidden, "Cần đạt danh hiệu và được đề xuất ở cấp dưới để tham gia.");
            }
        }

        var existing = await applicationRepository.GetByStudentAndCampaignAsync(campaignId, CurrentUserId, tracking: false, ct);
        if (existing is not null) return existing.Id;

        var app = new Application
        {
            CampaignId = campaignId,
            StudentId = CurrentUserId,
            StudentUnitId = currentUser.UnitId,
            ApplicationCode = $"SV5T-{DateTime.UtcNow.Year}-{Guid.NewGuid().ToString("N")[..8].ToUpperInvariant()}",
            Status = ApplicationStatus.Draft
        };

        await applicationRepository.AddAsync(app, ct);
        try
        {
            await unitOfWork.SaveChangesAsync(ct);
            return app.Id;
        }
        catch (DbUpdateException)
        {
            // Bắt lỗi Unique Constraint Violation nếu có race condition (2 request song song)
            var concurrentExisting = await applicationRepository.GetByStudentAndCampaignAsync(campaignId, CurrentUserId, tracking: false, ct);
            if (concurrentExisting is not null) return concurrentExisting.Id;
            throw;
        }
    }

    public async Task SelectCriteriaAsync(Guid applicationId, SelectCriteriaRequest request, CancellationToken ct = default)
    {
        var validation = await selectCriteriaValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, validation.Errors.First().ErrorMessage);
        }

        var app = await applicationRepository.GetByIdWithDetailsAsync(applicationId, tracking: true, ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Hồ sơ không tồn tại.");

        // IDOR Check
        if (app.StudentId != CurrentUserId)
        {
            throw new UseCaseException(ApplicationErrorKind.Forbidden, "Bạn không có quyền thao tác trên hồ sơ này.");
        }

        // Guard Status
        if (app.Status != ApplicationStatus.Draft && app.Status != ApplicationStatus.NeedsRevision)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, "Hồ sơ đã nộp hoặc đang xét duyệt, không thể chỉnh sửa tiêu chí.");
        }

        var campaign = await campaignRepository.GetByIdWithCriteriaAsync(app.CampaignId, ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Chiến dịch không tồn tại.");

        // Validate criterion IDs belong to campaign
        var validCriterionIds = campaign.StandardGroups
            .SelectMany(g => g.Criteria)
            .Select(c => c.Id)
            .ToHashSet();

        var invalidIds = request.CriterionIds.Where(id => !validCriterionIds.Contains(id)).ToList();
        if (invalidIds.Count > 0)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, "Danh sách tiêu chí có chứa mục không thuộc về chiến dịch này.");
        }

        app.SelectedCriteria.Clear();
        foreach (var cId in request.CriterionIds.Distinct())
        {
            app.SelectedCriteria.Add(new ApplicationCriterionSelection
            {
                ApplicationId = applicationId,
                CriterionId = cId,
                IsSelected = true
            });
        }

        await unitOfWork.SaveChangesWithConflictCheckAsync(ct);
    }

    public async Task AttachEvidenceAsync(Guid applicationId, AttachEvidenceRequest request, IFormFileCollection files, CancellationToken ct = default)
    {
        var validation = await attachEvidenceValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, validation.Errors.First().ErrorMessage);
        }

        var app = await applicationRepository.GetByIdWithDetailsAsync(applicationId, tracking: true, ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Hồ sơ không tồn tại.");

        // 1. IDOR Check
        if (app.StudentId != CurrentUserId)
        {
            throw new UseCaseException(ApplicationErrorKind.Forbidden, "Bạn không có quyền đính kèm minh chứng cho hồ sơ này.");
        }

        // 2. Guard Status
        if (app.Status != ApplicationStatus.Draft && app.Status != ApplicationStatus.NeedsRevision)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, "Hồ sơ không ở trạng thái Soạn thảo hoặc Cần bổ sung.");
        }

        // 3. Rate Limit Check
        var allowed = await rateLimitService.IsAllowedAsync($"upload:{CurrentUserId}", 15, TimeSpan.FromMinutes(1));
        if (!allowed)
        {
            throw new UseCaseException(ApplicationErrorKind.RateLimited, "Thao tác tải tệp quá nhanh. Vui lòng đợi 1 phút.");
        }

        var campaign = await campaignRepository.GetByIdWithCriteriaAsync(app.CampaignId, ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Chiến dịch không tồn tại.");

        // 4. Validate Criterion & EvidenceTypeTemplate
        var criterion = campaign.StandardGroups
            .SelectMany(g => g.Criteria)
            .FirstOrDefault(c => c.Id == request.CriterionId)
            ?? throw new UseCaseException(ApplicationErrorKind.Validation, "Tiêu chí không thuộc chiến dịch này.");

        var allowedEvidenceTypeMapping = criterion.AllowedEvidenceTypes
            .FirstOrDefault(a => a.EvidenceTypeId == request.EvidenceTypeId);

        if (allowedEvidenceTypeMapping is null)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, "Loại minh chứng này không được chấp nhận cho tiêu chí đã chọn.");
        }

        var template = allowedEvidenceTypeMapping.EvidenceType;

        // TODO: Validate request.FieldValuesJson against template.FieldSchemaJson 
        // sử dụng NJsonSchema (hoặc thư viện tương đương) tại đây trước khi upload.

        // Cập nhật: Kiểm tra tổng số lượng file hiện tại (cộng dồn)
        var existingEvidences = app.Evidences.Where(e => e.CriterionId == request.CriterionId && e.Status != EvidenceStatus.Rejected).ToList();
        var existingFilesCount = existingEvidences.Sum(e => 
        {
            try { return JsonSerializer.Deserialize<List<UploadedEvidenceFile>>(e.FileUrlsJson)?.Count ?? 0; }
            catch { return 0; }
        });

        if (existingFilesCount + files.Count > template.MaxFiles)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, $"Tổng số lượng tệp vượt quá giới hạn cho phép (Đã có: {existingFilesCount}, Tải lên: {files.Count}, Tối đa: {template.MaxFiles}).");
        }

        var allowedExts = template.AllowedFileTypes
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(ext => ext.StartsWith('.') ? ext.ToLowerInvariant() : $".{ext.ToLowerInvariant()}")
            .ToHashSet();

        foreach (var file in files)
        {
            var fileExt = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExts.Contains(fileExt))
            {
                throw new UseCaseException(ApplicationErrorKind.Validation, $"Tệp '{file.FileName}' có định dạng không được phép. Định dạng hợp lệ: {template.AllowedFileTypes}");
            }
            
            if (!IsValidFileSignature(file))
            {
                throw new UseCaseException(ApplicationErrorKind.Validation, $"Tệp '{file.FileName}' có nội dung không khớp với định dạng mở rộng.");
            }
        }

        // 5. Upload files to Cloudinary with rollback capability
        var uploadedFiles = new List<UploadedEvidenceFile>();
        try
        {
            foreach (var file in files)
            {
                var folder = $"sv5t/apps/{applicationId:N}/criteria/{request.CriterionId:N}";
                var uploaded = await evidenceStorage.UploadAsync(file, folder, ct);
                uploadedFiles.Add(uploaded);
            }

            var evidence = new Evidence
            {
                ApplicationId = applicationId,
                CriterionId = request.CriterionId,
                EvidenceTypeId = request.EvidenceTypeId,
                FieldValuesJson = request.FieldValuesJson,
                FileUrlsJson = JsonSerializer.Serialize(uploadedFiles),
                NumericValue = request.NumericValue,
                Status = EvidenceStatus.Draft
            };

            app.Evidences.Add(evidence);
            await unitOfWork.SaveChangesWithConflictCheckAsync(ct);
        }
        catch
        {
            // Rollback uploaded files on Cloudinary if DB save fails
            foreach (var uploaded in uploadedFiles)
            {
                try
                {
                    await evidenceStorage.DeleteAsync(uploaded.PublicId, CancellationToken.None);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Lỗi khi xóa file {PublicId} trên Cloudinary trong quá trình rollback.", uploaded.PublicId);
                }
            }
            throw;
        }
    }

    public async Task DeleteEvidenceAsync(Guid evidenceId, CancellationToken ct = default)
    {
        var evidence = await applicationRepository.GetEvidenceByIdAsync(evidenceId, tracking: true, ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Minh chứng không tồn tại.");

        if (evidence.Application.StudentId != CurrentUserId)
            throw new UseCaseException(ApplicationErrorKind.Forbidden, "Bạn không có quyền xóa minh chứng này.");

        if (evidence.Application.Status != ApplicationStatus.Draft && evidence.Application.Status != ApplicationStatus.NeedsRevision)
            throw new UseCaseException(ApplicationErrorKind.Validation, "Hồ sơ không cho phép chỉnh sửa minh chứng lúc này.");

        var files = new List<UploadedEvidenceFile>();
        try { files = JsonSerializer.Deserialize<List<UploadedEvidenceFile>>(evidence.FileUrlsJson) ?? new(); }
        catch { /* Fallback to empty list if JSON is corrupt */ }
        
        evidence.Application.Evidences.Remove(evidence);
        
        await unitOfWork.SaveChangesWithConflictCheckAsync(ct);
        
        // Xóa trực tiếp trên Cloudinary trong request context
        foreach (var f in files)
        {
            try { await evidenceStorage.DeleteAsync(f.PublicId, ct); }
            catch (Exception ex) { logger.LogError(ex, "Lỗi xóa file rác trên Cloudinary: {PublicId}", f.PublicId); }
        }
    }

    public async Task SubmitApplicationAsync(Guid applicationId, CancellationToken ct = default)
    {
        var app = await applicationRepository.GetByIdWithDetailsAsync(applicationId, tracking: true, ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Hồ sơ không tồn tại.");

        if (app.StudentId != CurrentUserId)
        {
            throw new UseCaseException(ApplicationErrorKind.Forbidden, "Bạn không có quyền nộp hồ sơ này.");
        }

        // Guard Status
        if (app.Status != ApplicationStatus.Draft && app.Status != ApplicationStatus.NeedsRevision)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, "Hồ sơ đã được nộp hoặc đã có kết quả xét duyệt.");
        }

        var campaign = await campaignRepository.GetByIdWithCriteriaAsync(app.CampaignId, ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Chiến dịch không tồn tại.");

        if (DateTime.UtcNow > campaign.SubmitDeadline)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, "Đã hết hạn nộp hồ sơ cho chiến dịch này.");
        }

        var evaluation = ApplicationEvaluationEngine.Evaluate(app, campaign, isFinalAdminReview: false);
        if (!evaluation.IsEligibleForSubmit)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, $"Hồ sơ chưa đủ điều kiện: {string.Join("; ", evaluation.MissingRequirements)}");
        }

        foreach (var ev in app.Evidences.Where(e => e.Status == EvidenceStatus.Draft))
        {
            ev.Status = EvidenceStatus.Submitted;
        }

        app.Status = ApplicationStatus.Submitted;
        app.SubmittedAt = DateTime.UtcNow;

        app.ReviewLogs.Add(new ReviewLog
        {
            ApplicationId = app.Id,
            ReviewerId = CurrentUserId,
            Action = "SUBMIT_APPLICATION",
            Note = "Sinh viên đã nộp hồ sơ chính thức."
        });

        await unitOfWork.SaveChangesWithConflictCheckAsync(ct);
    }

    public async Task<ApplicationEvaluationSummaryDto> GetEvaluationSummaryAsync(Guid applicationId, CancellationToken ct = default)
    {
        var app = await applicationRepository.GetByIdWithDetailsAsync(applicationId, tracking: false, ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Hồ sơ không tồn tại.");

        if (app.StudentId != CurrentUserId && !currentUser.IsInRole("Admin") && !currentUser.IsInRole("Officer"))
        {
            throw new UseCaseException(ApplicationErrorKind.Forbidden, "Bạn không có quyền xem thông tin hồ sơ này.");
        }

        var campaign = await campaignRepository.GetByIdWithCriteriaAsync(app.CampaignId, ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Chiến dịch không tồn tại.");

        return ApplicationEvaluationEngine.Evaluate(app, campaign, isFinalAdminReview: false);
    }
}

public interface IAdminReviewService
{
    Task<PagedResult<ApplicationSummaryDto>> GetApplicationsForReviewAsync(Guid campaignId, ApplicationStatus? status, Guid? unitId, PaginationRequest pagination, CancellationToken ct = default);
    Task ReviewEvidenceAsync(Guid evidenceId, ReviewEvidenceRequest request, CancellationToken ct = default);
    Task ApproveApplicationAsync(Guid applicationId, CancellationToken ct = default);
    Task RejectApplicationAsync(Guid applicationId, RejectApplicationRequest request, CancellationToken ct = default);
    Task RecommendForNextLevelAsync(Guid applicationId, CancellationToken ct = default);
}

public sealed class AdminReviewService(
    IApplicationRepository applicationRepository,
    ICampaignRepository campaignRepository,
    IValidator<ReviewEvidenceRequest> reviewValidator,
    IValidator<RejectApplicationRequest> rejectValidator,
    ICurrentUser currentUser,
    IUnitOfWork unitOfWork) : IAdminReviewService
{
    private Guid ReviewerId => currentUser.UserId ?? throw new UseCaseException(ApplicationErrorKind.Unauthorized, "Phiên đăng nhập không hợp lệ.");

    public async Task<PagedResult<ApplicationSummaryDto>> GetApplicationsForReviewAsync(Guid campaignId, ApplicationStatus? status, Guid? unitId, PaginationRequest pagination, CancellationToken ct = default)
    {
        // Mentor Scope: Force filter by unit if mentor is scoped
        var queryUnitId = currentUser.ManagedUnitId ?? unitId;

        var (items, total) = await applicationRepository.GetByCampaignAndStatusPagedAsync(campaignId, status, queryUnitId, pagination.SafePage, pagination.SafePageSize, ct);
        var dtos = items.Select(a => new ApplicationSummaryDto(
            a.Id,
            a.ApplicationCode,
            a.CampaignId,
            a.Campaign?.Name ?? string.Empty,
            a.StudentId,
            a.Status,
            a.SubmittedAt,
            a.RecommendedForNextLevel
        )).ToList();

        return new PagedResult<ApplicationSummaryDto>(dtos, total, pagination.SafePage, pagination.SafePageSize);
    }

    public async Task ReviewEvidenceAsync(Guid evidenceId, ReviewEvidenceRequest request, CancellationToken ct = default)
    {
        var validation = await reviewValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, validation.Errors.First().ErrorMessage);
        }

        var evidence = await applicationRepository.GetEvidenceByIdAsync(evidenceId, tracking: true, ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Minh chứng không tồn tại.");

        if (evidence.Application.Status != ApplicationStatus.UnderReview && evidence.Application.Status != ApplicationStatus.Submitted)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, "Hồ sơ không ở trạng thái Đang xét duyệt hoặc Đã nộp.");
        }

        // Officer Scope: Kiểm tra quyền truy cập theo Khoa nếu Officer bị giới hạn
        if (currentUser.ManagedUnitId.HasValue && evidence.Application.StudentUnitId != currentUser.ManagedUnitId.Value)
        {
            throw new UseCaseException(ApplicationErrorKind.Forbidden, "Bạn không có quyền xét duyệt hồ sơ của sinh viên thuộc đơn vị khác.");
        }

        evidence.Status = request.Status;
        evidence.ReviewerNote = request.Note;
        evidence.ReviewedBy = ReviewerId;
        evidence.ReviewedAt = DateTime.UtcNow;

        // Chuyển trạng thái hồ sơ sang UnderReview nếu đang là Submitted
        if (evidence.Application.Status == ApplicationStatus.Submitted)
        {
            evidence.Application.Status = ApplicationStatus.UnderReview;
        }

        if (request.Status == EvidenceStatus.NeedsRevision)
        {
            evidence.Application.Status = ApplicationStatus.NeedsRevision;
        }

        evidence.Application.ReviewLogs.Add(new ReviewLog
        {
            ApplicationId = evidence.ApplicationId,
            EvidenceId = evidence.Id,
            ReviewerId = ReviewerId,
            Action = $"EVIDENCE_{request.Status.ToString().ToUpperInvariant()}",
            Note = request.Note
        });

        await unitOfWork.SaveChangesWithConflictCheckAsync(ct);
    }

    public async Task ApproveApplicationAsync(Guid applicationId, CancellationToken ct = default)
    {
        var app = await applicationRepository.GetByIdWithDetailsAsync(applicationId, tracking: true, ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Hồ sơ không tồn tại.");

        // Guard Status
        if (app.Status != ApplicationStatus.Submitted && app.Status != ApplicationStatus.UnderReview)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, "Chỉ có thể phê duyệt hồ sơ đang ở trạng thái Đã nộp hoặc Đang xét duyệt.");
        }

        var campaign = await campaignRepository.GetByIdWithCriteriaAsync(app.CampaignId, ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Chiến dịch không tồn tại.");

        var evaluation = ApplicationEvaluationEngine.Evaluate(app, campaign, isFinalAdminReview: true);
        if (!evaluation.IsFullyApproved)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, $"Hồ sơ chưa đủ điều kiện phê duyệt: {string.Join("; ", evaluation.MissingRequirements)}");
        }

        app.Status = ApplicationStatus.Approved;
        app.ReviewLogs.Add(new ReviewLog
        {
            ApplicationId = app.Id,
            ReviewerId = ReviewerId,
            Action = "APPROVE_APPLICATION",
            Note = "Hội đồng xét duyệt đã thông qua toàn bộ danh hiệu."
        });

        await unitOfWork.SaveChangesWithConflictCheckAsync(ct);
    }

    public async Task RejectApplicationAsync(Guid applicationId, RejectApplicationRequest request, CancellationToken ct = default)
    {
        var validation = await rejectValidator.ValidateAsync(request, ct);
        if (!validation.IsValid)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, validation.Errors.First().ErrorMessage);
        }

        var app = await applicationRepository.GetByIdWithDetailsAsync(applicationId, tracking: true, ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Hồ sơ không tồn tại.");

        if (app.Status != ApplicationStatus.Submitted && 
            app.Status != ApplicationStatus.UnderReview && 
            app.Status != ApplicationStatus.NeedsRevision)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, "Chỉ có thể từ chối hồ sơ đang ở trạng thái Đã nộp, Đang xét duyệt hoặc Cần bổ sung.");
        }

        app.Status = ApplicationStatus.Rejected;
        app.RejectionReason = request.Reason;
        app.ReviewLogs.Add(new ReviewLog
        {
            ApplicationId = app.Id,
            ReviewerId = ReviewerId,
            Action = "REJECT_APPLICATION",
            Note = request.Reason
        });

        await unitOfWork.SaveChangesWithConflictCheckAsync(ct);
    }

    public async Task RecommendForNextLevelAsync(Guid applicationId, CancellationToken ct = default)
    {
        var app = await applicationRepository.GetByIdWithDetailsAsync(applicationId, tracking: true, ct)
            ?? throw new UseCaseException(ApplicationErrorKind.NotFound, "Hồ sơ không tồn tại.");

        if (app.Status != ApplicationStatus.Approved)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, "Chỉ hồ sơ đã ĐẠT mới có thể đề xuất lên cấp trên.");
        }

        app.RecommendedForNextLevel = true;
        app.ReviewLogs.Add(new ReviewLog
        {
            ApplicationId = app.Id,
            ReviewerId = ReviewerId,
            Action = "RECOMMEND_NEXT_LEVEL",
            Note = "Đề xuất xét duyệt danh hiệu lên cấp cao hơn."
        });

        await unitOfWork.SaveChangesWithConflictCheckAsync(ct);
    }
}
```

## 2.7 Dependency Injection Application
**File:** `src/SV5T.Application/DependencyInjection.cs`
```csharp
services.AddScoped<ICampaignService, CampaignService>();
services.AddScoped<IApplicationService, ApplicationService>();
services.AddScoped<IAdminReviewService, AdminReviewService>();

services.AddScoped<IValidator<CreateCampaignRequest>, CreateCampaignRequestValidator>();
services.AddScoped<IValidator<UpdateCampaignStatusRequest>, UpdateCampaignStatusRequestValidator>();
services.AddScoped<IValidator<SelectCriteriaRequest>, SelectCriteriaRequestValidator>();
services.AddScoped<IValidator<AttachEvidenceRequest>, AttachEvidenceRequestValidator>();
services.AddScoped<IValidator<ReviewEvidenceRequest>, ReviewEvidenceRequestValidator>();
services.AddScoped<IValidator<RejectApplicationRequest>, RejectApplicationRequestValidator>();
```

---

# 3. TẦNG INFRASTRUCTURE (`src/SV5T.Infrastructure`)

## 3.1 Entity Configurations & Indexing (EF Core)
**File:** `src/SV5T.Infrastructure/Persistence/Configurations/Sv5tConfigurations.cs`
```csharp
namespace SV5T.Infrastructure.Persistence.Configurations;

using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Criteria;
using SV5T.Domain.Evidences;
using SV5T.Domain.Standards;
using SV5T.Domain.Submissions;

public sealed class CampaignConfiguration : IEntityTypeConfiguration<Campaign>
{
    public void Configure(EntityTypeBuilder<Campaign> builder)
    {
        builder.ToTable("campaigns");
        builder.HasKey(c => c.Id);
        
        builder.Property(c => c.Name).HasMaxLength(255).IsRequired();
        builder.Property(c => c.SchoolYear).HasMaxLength(20).IsRequired();
        builder.Property(c => c.Status).HasConversion<int>().IsRequired();
        builder.Property(c => c.Level).HasConversion<int>().IsRequired();
        builder.Property(c => c.AwardType).HasConversion<int>().IsRequired();

        // Index kép phục vụ query tìm kiếm chiến dịch nhanh
        builder.HasIndex(c => new { c.Status, c.Level, c.SchoolYear })
               .HasDatabaseName("ix_campaigns_status_level_year");
    }
}

public sealed class ApplicationConfiguration : IEntityTypeConfiguration<Application>
{
    public void Configure(EntityTypeBuilder<Application> builder)
    {
        builder.ToTable("applications");
        builder.HasKey(a => a.Id);
        
        builder.Property(a => a.ApplicationCode).HasMaxLength(50).IsRequired();
        builder.Property(a => a.Status).HasConversion<int>().IsRequired();
        builder.Property(a => a.RowVersion).IsRowVersion();

        // 1 SV chỉ có 1 hồ sơ trên 1 chiến dịch
        builder.HasIndex(a => new { a.CampaignId, a.StudentId })
               .IsUnique()
               .HasDatabaseName("ux_applications_campaign_student");

        builder.HasIndex(a => a.ApplicationCode)
               .IsUnique()
               .HasDatabaseName("ux_applications_code");

        // Index phục vụ admin lọc hồ sơ theo trạng thái và thời gian nộp
        builder.HasIndex(a => new { a.CampaignId, a.Status, a.SubmittedAt })
               .HasDatabaseName("ix_applications_admin_search");

        builder.HasMany(a => a.SelectedCriteria)
               .WithOne(s => s.Application)
               .HasForeignKey(s => s.ApplicationId)
               .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(a => a.Evidences)
               .WithOne(e => e.Application)
               .HasForeignKey(e => e.ApplicationId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class ApplicationCriterionSelectionConfiguration : IEntityTypeConfiguration<ApplicationCriterionSelection>
{
    public void Configure(EntityTypeBuilder<ApplicationCriterionSelection> builder)
    {
        builder.ToTable("application_criterion_selections");
        builder.HasKey(acs => new { acs.ApplicationId, acs.CriterionId });

        builder.HasIndex(acs => new { acs.ApplicationId, acs.IsSelected })
               .HasDatabaseName("ix_app_criteria_selection");
    }
}

public sealed class EvidenceConfiguration : IEntityTypeConfiguration<Evidence>
{
    public void Configure(EntityTypeBuilder<Evidence> builder)
    {
        builder.ToTable("evidences");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.FieldValuesJson).HasColumnType("json").IsRequired();
        builder.Property(e => e.FileUrlsJson).HasColumnType("json").IsRequired();
        builder.Property(e => e.NumericValue).HasPrecision(10, 2);
        builder.Property(e => e.RowVersion).IsRowVersion();

        // Index tìm kiếm minh chứng theo hồ sơ và tiêu chí
        builder.HasIndex(e => new { e.ApplicationId, e.CriterionId, e.Status })
               .HasDatabaseName("ix_evidences_app_criterion_status");
    }
}

public sealed class CriterionEvidenceTypeConfiguration : IEntityTypeConfiguration<CriterionEvidenceType>
{
    public void Configure(EntityTypeBuilder<CriterionEvidenceType> builder)
    {
        builder.ToTable("criterion_evidence_types");
        builder.HasKey(cet => new { cet.CriterionId, cet.EvidenceTypeId });
    }
}
```

## 3.2 Repository Implementations
**File:** `src/SV5T.Infrastructure/Persistence/Repositories/Sv5tRepositories.cs`
```csharp
namespace SV5T.Infrastructure.Persistence.Repositories;

using Microsoft.EntityFrameworkCore;
using SV5T.Domain.Campaigns;
using SV5T.Domain.Enums;
using SV5T.Domain.Evidences;
using SV5T.Domain.Repositories;
using SV5T.Domain.Submissions;
using SV5T.Infrastructure.Persistence.Context;

public sealed class CampaignRepository(ApplicationDbContext dbContext) : ICampaignRepository
{
    public async Task<Campaign?> GetByIdWithCriteriaAsync(Guid id, CancellationToken ct = default)
    {
        // Chống N+1 và Cartesian Explosion
        return await dbContext.Set<Campaign>()
            .AsNoTracking()
            .AsSplitQuery()
            .Include(c => c.StandardGroups.OrderBy(g => g.DisplayOrder))
                .ThenInclude(g => g.Criteria.OrderBy(cr => cr.DisplayOrder))
                    .ThenInclude(cr => cr.AllowedEvidenceTypes)
                        .ThenInclude(aet => aet.EvidenceType)
            .FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task<Campaign?> GetByIdAsync(Guid id, bool tracking = false, CancellationToken ct = default)
    {
        var query = dbContext.Set<Campaign>().AsQueryable();
        if (!tracking) query = query.AsNoTracking();
        return await query.FirstOrDefaultAsync(c => c.Id == id, ct);
    }

    public async Task<(IReadOnlyList<Campaign> Items, int TotalCount)> GetActiveCampaignsPagedAsync(int page, int pageSize, CancellationToken ct = default)
    {
        var query = dbContext.Set<Campaign>()
            .AsNoTracking()
            .Where(c => c.Status == CampaignStatus.Open);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, total);
    }

    public async Task<(IReadOnlyList<Campaign> Items, int TotalCount)> GetAllForAdminPagedAsync(int page, int pageSize, CancellationToken ct = default)
    {
        var query = dbContext.Set<Campaign>().AsNoTracking();
        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, total);
    }

    public Task AddAsync(Campaign campaign, CancellationToken ct = default) =>
        dbContext.Set<Campaign>().AddAsync(campaign, ct).AsTask();
}

public sealed class ApplicationRepository(ApplicationDbContext dbContext) : IApplicationRepository
{
    public async Task<Application?> GetByIdWithDetailsAsync(Guid id, bool tracking = false, CancellationToken ct = default)
    {
        var query = dbContext.Set<Application>()
            .AsSplitQuery()
            // Tách load Campaign riêng bằng AsNoTracking trong Service để tránh Tracking dư thừa
            .Include(a => a.SelectedCriteria)
            .Include(a => a.Evidences)
                .ThenInclude(e => e.EvidenceType)
            .Include(a => a.ReviewLogs.OrderByDescending(r => r.CreatedAt))
            .AsQueryable();

        if (!tracking) query = query.AsNoTracking();
        return await query.FirstOrDefaultAsync(a => a.Id == id, ct);
    }

    public async Task<Application?> GetByStudentAndCampaignAsync(Guid campaignId, Guid studentId, bool tracking = false, CancellationToken ct = default)
    {
        var query = dbContext.Set<Application>()
            .AsSplitQuery()
            .Include(a => a.SelectedCriteria)
            .Include(a => a.Evidences)
            .AsQueryable();

        if (!tracking) query = query.AsNoTracking();
        return await query.FirstOrDefaultAsync(a => a.CampaignId == campaignId && a.StudentId == studentId, ct);
    }

    public async Task<bool> HasApprovedLowerLevelAsync(Guid studentId, string schoolYear, AwardLevel level, CancellationToken ct = default)
    {
        return await dbContext.Set<Application>()
            .AsNoTracking()
            .AnyAsync(a => a.StudentId == studentId &&
                           a.Campaign.SchoolYear == schoolYear &&
                           a.Campaign.Level == level &&
                           a.Status == ApplicationStatus.Approved &&
                           a.RecommendedForNextLevel, ct);
    }

    public async Task<(IReadOnlyList<Application> Items, int TotalCount)> GetByCampaignAndStatusPagedAsync(Guid campaignId, ApplicationStatus? status, Guid? unitId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = dbContext.Set<Application>()
            .AsNoTracking()
            .Include(a => a.Campaign)
            .Where(a => a.CampaignId == campaignId);

        if (status.HasValue)
        {
            query = query.Where(a => a.Status == status.Value);
        }

        if (unitId.HasValue)
        {
            query = query.Where(a => a.StudentUnitId == unitId.Value);
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(a => a.SubmittedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, total);
    }

    public Task AddAsync(Application application, CancellationToken ct = default) =>
        dbContext.Set<Application>().AddAsync(application, ct).AsTask();

    public async Task<Evidence?> GetEvidenceByIdAsync(Guid evidenceId, bool tracking = false, CancellationToken ct = default)
    {
        var query = dbContext.Set<Evidence>()
            .Include(e => e.Application)
            .AsQueryable();

        if (!tracking) query = query.AsNoTracking();
        return await query.FirstOrDefaultAsync(e => e.Id == evidenceId, ct);
    }
}
```

## 3.3 Cloudinary Storage Service
**File:** `src/SV5T.Infrastructure/Storage/CloudinaryEvidenceStorage.cs`
```csharp
namespace SV5T.Infrastructure.Storage;

using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using SV5T.Application.Common.Exceptions;
using SV5T.Application.Common.Interfaces;

public sealed class CloudinaryEvidenceStorage(Cloudinary cloudinary) : IEvidenceStorage
{
    private const long MaxFileSize = 10 * 1024 * 1024; // 10MB

    public async Task<UploadedEvidenceFile> UploadAsync(IFormFile file, string folder, CancellationToken ct = default)
    {
        if (file.Length > MaxFileSize)
        {
            throw new UseCaseException(ApplicationErrorKind.Validation, "Kích thước tệp vượt quá 10MB.");
        }

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        await using var stream = file.OpenReadStream();

        RawUploadParams uploadParams = ext == ".pdf"
            ? new RawUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = folder,
                PublicId = $"{Guid.NewGuid():N}_{Path.GetFileNameWithoutExtension(file.FileName)}"
            }
            : new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = folder,
                PublicId = $"{Guid.NewGuid():N}",
                Transformation = new Transformation().Quality("auto").FetchFormat("auto")
            };

        var result = await (ext == ".pdf" 
            ? cloudinary.UploadAsync(uploadParams, ct) 
            : cloudinary.UploadAsync((ImageUploadParams)uploadParams, ct));

        if (result.Error is not null || result.SecureUrl is null)
        {
            throw new UseCaseException(ApplicationErrorKind.Unavailable, "Không thể tải file lên Cloudinary.");
        }

        return new UploadedEvidenceFile(result.SecureUrl.AbsoluteUri, result.PublicId, file.FileName, file.Length);
    }

    public async Task DeleteAsync(string publicId, CancellationToken ct = default)
    {
        ct.ThrowIfCancellationRequested();
        await cloudinary.DestroyAsync(new DeletionParams(publicId) { Invalidate = true });
    }
}
```

## 3.4 Redis Cache Service & Rate Limiter
**File:** `src/SV5T.Infrastructure/Caching/RedisCacheService.cs`
```csharp
namespace SV5T.Infrastructure.Caching;

using System.Text.Json;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;
using SV5T.Application.Common.Interfaces;

public sealed class RedisCacheService(IConnectionMultiplexer redis, ILogger<RedisCacheService> logger) : ICacheService
{
    private readonly IDatabase _db = redis.GetDatabase();

    public async Task<T?> GetOrSetAsync<T>(string key, Func<Task<T>> factory, TimeSpan? ttl = null)
    {
        var cached = await _db.StringGetAsync(key);
        if (cached.HasValue)
        {
            return JsonSerializer.Deserialize<T>(cached.ToString());
        }

        // Distributed Lock cơ bản qua Redis chống Cache Stampede cho multi-instance
        var lockKey = $"lock:{key}";
        var lockToken = Guid.NewGuid().ToString("N");
        var acquiredLock = await _db.LockTakeAsync(lockKey, lockToken, TimeSpan.FromSeconds(10));

        int retryCount = 0;
        while (!acquiredLock && retryCount < 3)
        {
            // Nếu không lấy được lock, đợi 1 chút rồi thử đọc lại từ cache
            await Task.Delay(200);
            cached = await _db.StringGetAsync(key);
            if (cached.HasValue) return JsonSerializer.Deserialize<T>(cached.ToString());
            
            acquiredLock = await _db.LockTakeAsync(lockKey, lockToken, TimeSpan.FromSeconds(10));
            retryCount++;
        }

        if (!acquiredLock)
        {
            throw new SV5T.Application.Common.Exceptions.UseCaseException(SV5T.Application.Common.Exceptions.ApplicationErrorKind.Unavailable, "Hệ thống đang xử lý, vui lòng thử lại sau."); // Tránh cache stampede
        }

        try
        {
            // Double check
            cached = await _db.StringGetAsync(key);
            if (cached.HasValue) return JsonSerializer.Deserialize<T>(cached.ToString());

            var result = await factory();
            if (result is not null)
            {
                var expiry = ttl ?? TimeSpan.FromHours(6);
                await _db.StringSetAsync(key, JsonSerializer.Serialize(result), expiry);
            }

            return result;
        }
        finally
        {
            if (acquiredLock)
            {
                await _db.LockReleaseAsync(lockKey, lockToken);
            }
        }
    }

    public Task RemoveAsync(string key) => _db.KeyDeleteAsync(key);

    public async Task RemoveByPrefixAsync(string prefix)
    {
        var endpoints = redis.GetEndPoints();
        foreach (var endpoint in endpoints)
        {
            var server = redis.GetServer(endpoint);
            if (server.IsConnected)
            {
                var keys = server.Keys(pattern: $"{prefix}*").ToArray();
                if (keys.Length > 0)
                {
                    await _db.KeyDeleteAsync(keys);
                }
            }
        }
    }
}
```

**File:** `src/SV5T.Infrastructure/Security/RedisRateLimitService.cs`
```csharp
namespace SV5T.Infrastructure.Security;

using StackExchange.Redis;
using SV5T.Application.Common.Interfaces;

using Microsoft.Extensions.Logging;

using Microsoft.Extensions.Caching.Memory;

public sealed class RedisRateLimitService(IConnectionMultiplexer redis, ILogger<RedisRateLimitService> logger, IMemoryCache memoryCache) : IRateLimitService
{
    private readonly IDatabase _db = redis.GetDatabase();

    public async Task<bool> IsAllowedAsync(string key, int limit, TimeSpan window)
    {
        try
        {
            var redisKey = $"rl:{key}";
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var start = now - (long)window.TotalMilliseconds;

            var tran = _db.CreateTransaction();
            _ = tran.SortedSetRemoveRangeByScoreAsync(redisKey, 0, start);
            _ = tran.SortedSetAddAsync(redisKey, Guid.NewGuid().ToString("N"), now);
            var countTask = tran.SortedSetLengthAsync(redisKey);
            _ = tran.KeyExpireAsync(redisKey, window);

            if (!await tran.ExecuteAsync()) return true;
            return (await countTask) <= limit;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Lỗi Redis RateLimiter cho key {Key}. Fallback sang In-memory.", key);
            // Fallback In-memory Rate Limiting đơn giản
            var memoryKey = $"mem_rl:{key}";
            var count = memoryCache.GetOrCreate(memoryKey, entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = window;
                return 0;
            });
            if (count >= limit) return false;
            memoryCache.Set(memoryKey, count + 1, window);
            return true;
        }
    }
}
```

## 3.5 Dependency Injection Infrastructure
**File:** `src/SV5T.Infrastructure/DependencyInjection.cs`
```csharp
services.AddScoped<ICampaignRepository, CampaignRepository>();
services.AddScoped<IApplicationRepository, ApplicationRepository>();
services.AddScoped<IEvidenceStorage, CloudinaryEvidenceStorage>();
services.AddSingleton<ICacheService, RedisCacheService>();
services.AddSingleton<IRateLimitService, RedisRateLimitService>();
```

---

# 4. TẦNG API (`src/SV5T.Api`)

## 4.1 CampaignsController
**File:** `src/SV5T.Api/Controllers/CampaignsController.cs`
```csharp
namespace SV5T.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Dtos;
using SV5T.Application.Services;

[ApiController]
[Route("api/[controller]")]
public sealed class CampaignsController(ICampaignService campaignService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetActiveCampaigns([FromQuery] PaginationRequest pagination, CancellationToken ct)
    {
        var result = await campaignService.GetActiveCampaignsAsync(pagination, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCampaignDetails(Guid id, CancellationToken ct)
    {
        var campaign = await campaignService.GetCampaignDetailsAsync(id, ct);
        return Ok(campaign);
    }
}
```

## 4.2 ApplicationsController
**File:** `src/SV5T.Api/Controllers/ApplicationsController.cs`
```csharp
namespace SV5T.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Dtos;
using SV5T.Application.Services;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public sealed class ApplicationsController(IApplicationService applicationService) : ControllerBase
{
    [HttpPost("campaigns/{campaignId:guid}/register")]
    public async Task<IActionResult> Register(Guid campaignId, CancellationToken ct)
    {
        var appId = await applicationService.RegisterCampaignAsync(campaignId, ct);
        return Ok(new { applicationId = appId });
    }

    [HttpPut("{id:guid}/criteria-selection")]
    public async Task<IActionResult> SelectCriteria(Guid id, [FromBody] SelectCriteriaRequest request, CancellationToken ct)
    {
        await applicationService.SelectCriteriaAsync(id, request, ct);
        return NoContent();
    }

    [HttpPost("{id:guid}/evidences")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> AttachEvidence(
        Guid id,
        [FromForm] AttachEvidenceRequest request,
        IFormFileCollection files,
        CancellationToken ct)
    {
        await applicationService.AttachEvidenceAsync(id, request, files, ct);
        return Ok(new { message = "Đính kèm minh chứng thành công." });
    }

    [HttpDelete("evidences/{evidenceId:guid}")]
    public async Task<IActionResult> DeleteEvidence(Guid evidenceId, CancellationToken ct)
    {
        await applicationService.DeleteEvidenceAsync(evidenceId, ct);
        return Ok(new { message = "Xóa minh chứng thành công." });
    }

    [HttpPost("{id:guid}/submit")]
    public async Task<IActionResult> Submit(Guid id, CancellationToken ct)
    {
        await applicationService.SubmitApplicationAsync(id, ct);
        return Ok(new { message = "Hồ sơ đã được gửi thành công đến Hội đồng xét duyệt." });
    }

    [HttpGet("{id:guid}/evaluation-summary")]
    public async Task<IActionResult> GetEvaluationSummary(Guid id, CancellationToken ct)
    {
        var summary = await applicationService.GetEvaluationSummaryAsync(id, ct);
        return Ok(summary);
    }
}
```

## 4.3 AdminCampaignsController
**File:** `src/SV5T.Api/Controllers/AdminCampaignsController.cs`
```csharp
namespace SV5T.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Dtos;
using SV5T.Application.Services;

[ApiController]
[Route("api/admin/campaigns")]
[Authorize(Roles = "Admin,Officer")]
public sealed class AdminCampaignsController(ICampaignService campaignService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAllCampaigns([FromQuery] PaginationRequest pagination, CancellationToken ct)
    {
        var result = await campaignService.GetAllForAdminAsync(pagination, ct);
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateCampaign([FromBody] CreateCampaignRequest request, CancellationToken ct)
    {
        var campaignId = await campaignService.CreateCampaignAsync(request, ct);
        return CreatedAtAction(nameof(CampaignsController.GetCampaignDetails), "Campaigns", new { id = campaignId }, new { campaignId });
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateCampaignStatusRequest request, CancellationToken ct)
    {
        await campaignService.UpdateCampaignStatusAsync(id, request, ct);
        return NoContent();
    }
}
```

## 4.4 AdminReviewController
**File:** `src/SV5T.Api/Controllers/AdminReviewController.cs`
```csharp
namespace SV5T.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SV5T.Application.Dtos;
using SV5T.Application.Services;
using SV5T.Domain.Enums;

[ApiController]
[Route("api/admin/reviews")]
[Authorize(Roles = "Admin,Officer")]
public sealed class AdminReviewController(IAdminReviewService reviewService) : ControllerBase
{
    [HttpGet("campaigns/{campaignId:guid}/applications")]
    public async Task<IActionResult> GetApplications(
        Guid campaignId,
        [FromQuery] ApplicationStatus? status,
        [FromQuery] Guid? unitId,
        [FromQuery] PaginationRequest pagination,
        CancellationToken ct)
    {
        var apps = await reviewService.GetApplicationsForReviewAsync(campaignId, status, unitId, pagination, ct);
        return Ok(apps);
    }

    [HttpPost("evidences/{evidenceId:guid}/review")]
    public async Task<IActionResult> ReviewEvidence(Guid evidenceId, [FromBody] ReviewEvidenceRequest request, CancellationToken ct)
    {
        await reviewService.ReviewEvidenceAsync(evidenceId, request, ct);
        return NoContent();
    }

    [HttpPost("applications/{applicationId:guid}/approve")]
    public async Task<IActionResult> ApproveApplication(Guid applicationId, CancellationToken ct)
    {
        await reviewService.ApproveApplicationAsync(applicationId, ct);
        return Ok(new { message = "Đã phê duyệt hồ sơ đạt danh hiệu Sinh viên 5 tốt." });
    }

    [HttpPost("applications/{applicationId:guid}/reject")]
    public async Task<IActionResult> RejectApplication(Guid applicationId, [FromBody] RejectApplicationRequest request, CancellationToken ct)
    {
        await reviewService.RejectApplicationAsync(applicationId, request, ct);
        return Ok(new { message = "Đã từ chối hồ sơ xét duyệt." });
    }

    [HttpPost("applications/{applicationId:guid}/recommend-next-level")]
    public async Task<IActionResult> RecommendNextLevel(Guid applicationId, CancellationToken ct)
    {
        await reviewService.RecommendForNextLevelAsync(applicationId, ct);
        return Ok(new { message = "Đã đề xuất hồ sơ xét duyệt lên cấp trên." });
    }
}
```

## 4.5 Global Exception Middleware
**File:** `src/SV5T.Api/Middlewares/GlobalExceptionMiddleware.cs`
```csharp
namespace SV5T.Api.Middlewares;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using SV5T.Application.Common.Exceptions;
using System.Net;
using System.Text.Json;

public sealed class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Đã xảy ra lỗi hệ thống: {Message}", ex.Message);
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var statusCode = HttpStatusCode.InternalServerError;
        var message = "Đã xảy ra lỗi không mong muốn.";

        if (exception is Microsoft.EntityFrameworkCore.DbUpdateException || exception is System.Data.Common.DbException || exception is TimeoutException)
        {
            statusCode = HttpStatusCode.ServiceUnavailable;
            message = "Dịch vụ cơ sở dữ liệu hiện không khả dụng. Vui lòng thử lại sau.";
        }
        else if (exception is UseCaseException useCaseEx)
        {
            statusCode = useCaseEx.Kind switch
            {
                ApplicationErrorKind.NotFound => HttpStatusCode.NotFound,
                ApplicationErrorKind.Validation => HttpStatusCode.BadRequest,
                ApplicationErrorKind.Forbidden => HttpStatusCode.Forbidden,
                ApplicationErrorKind.Unauthorized => HttpStatusCode.Unauthorized,
                ApplicationErrorKind.Conflict => HttpStatusCode.Conflict,
                ApplicationErrorKind.RateLimited => HttpStatusCode.TooManyRequests,
                _ => HttpStatusCode.BadRequest
            };
            message = useCaseEx.Message;
        }

        context.Response.StatusCode = (int)statusCode;
        return context.Response.WriteAsync(JsonSerializer.Serialize(new { error = message }));
    }
}
```

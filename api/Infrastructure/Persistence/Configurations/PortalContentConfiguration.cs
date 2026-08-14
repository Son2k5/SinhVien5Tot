using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SV5T.Domain.Entities;

namespace SV5T.Infrastructure.Persistence.Configurations;

public sealed class PortalContentConfiguration
    : IEntityTypeConfiguration<PortalContent>
{
    public void Configure(EntityTypeBuilder<PortalContent> builder)
    {
        builder.ToTable("portal_contents");
        builder.HasKey(content => content.Id);
        builder.Property(content => content.Title).HasMaxLength(180).IsRequired();
        builder.Property(content => content.Summary).HasMaxLength(600).IsRequired();
        builder.Property(content => content.Route).HasMaxLength(240).IsRequired();
        builder.Property(content => content.Icon).HasMaxLength(40).IsRequired();
        builder.HasIndex(content => new
        {
            content.Type,
            content.IsPublished,
            content.PublishedAtUtc
        });

        builder.HasData(GetSeedData());
    }

    private static PortalContent[] GetSeedData() =>
    [
        new()
        {
            Id = Guid.Parse("0f35db57-0986-4f25-8a30-75ba664d4e01"),
            Type = PortalContentType.Notification,
            Source = PortalContentSource.System,
            Title = "Chào mừng bạn đến với hệ thống Sinh viên 5 Tốt",
            Summary = "Hồ sơ, minh chứng và thông tin xét duyệt của bạn sẽ được quản lý tập trung tại đây.",
            Route = "/dashboard",
            Icon = "sparkles",
            IsFeatured = true,
            IsPublished = true,
            PublishedAtUtc = new DateTime(2026, 8, 10, 1, 0, 0, DateTimeKind.Utc)
        },
        new()
        {
            Id = Guid.Parse("0f35db57-0986-4f25-8a30-75ba664d4e02"),
            Type = PortalContentType.Notification,
            Source = PortalContentSource.YouthUnion,
            Title = "Chuẩn bị mở đợt cập nhật hồ sơ học kỳ I",
            Summary = "Sinh viên vui lòng kiểm tra thông tin cá nhân trước khi nộp minh chứng.",
            Route = "/dashboard?view=evidence",
            Icon = "bell",
            IsFeatured = false,
            IsPublished = true,
            PublishedAtUtc = new DateTime(2026, 8, 9, 8, 30, 0, DateTimeKind.Utc)
        },
        new()
        {
            Id = Guid.Parse("0f35db57-0986-4f25-8a30-75ba664d4e03"),
            Type = PortalContentType.Notification,
            Source = PortalContentSource.System,
            Title = "Tài khoản của bạn đã được bảo vệ",
            Summary = "Phiên đăng nhập và dữ liệu cá nhân được xác thực an toàn qua hệ thống.",
            Route = "/dashboard",
            Icon = "shield-check",
            IsFeatured = false,
            IsPublished = true,
            PublishedAtUtc = new DateTime(2026, 8, 8, 3, 15, 0, DateTimeKind.Utc)
        },
        new()
        {
            Id = Guid.Parse("0f35db57-0986-4f25-8a30-75ba664d4e04"),
            Type = PortalContentType.News,
            Source = PortalContentSource.University,
            Title = "Khởi động chuỗi hoạt động sinh viên năm học 2026–2027",
            Summary = "Nhà trường công bố kế hoạch hoạt động học thuật, hội nhập và tình nguyện dành cho sinh viên.",
            Route = "/dashboard?news=university-activities-2026",
            Icon = "landmark",
            IsFeatured = true,
            IsPublished = true,
            PublishedAtUtc = new DateTime(2026, 8, 10, 0, 30, 0, DateTimeKind.Utc)
        },
        new()
        {
            Id = Guid.Parse("0f35db57-0986-4f25-8a30-75ba664d4e05"),
            Type = PortalContentType.News,
            Source = PortalContentSource.Faculty,
            Title = "Khoa phát động tuần lễ học tập và đổi mới sáng tạo",
            Summary = "Nhiều workshop chuyên môn và hoạt động kết nối doanh nghiệp sẽ diễn ra trong tháng 8.",
            Route = "/dashboard?news=faculty-innovation-week",
            Icon = "graduation-cap",
            IsFeatured = false,
            IsPublished = true,
            PublishedAtUtc = new DateTime(2026, 8, 9, 2, 0, 0, DateTimeKind.Utc)
        },
        new()
        {
            Id = Guid.Parse("0f35db57-0986-4f25-8a30-75ba664d4e06"),
            Type = PortalContentType.News,
            Source = PortalContentSource.YouthUnion,
            Title = "Đoàn Thanh niên tuyển tình nguyện viên hỗ trợ tân sinh viên",
            Summary = "Đăng ký tham gia đội hình hỗ trợ nhập học và tích lũy hoạt động cho tiêu chí tình nguyện tốt.",
            Route = "/dashboard?news=volunteer-recruitment",
            Icon = "heart-handshake",
            IsFeatured = false,
            IsPublished = true,
            PublishedAtUtc = new DateTime(2026, 8, 8, 7, 0, 0, DateTimeKind.Utc)
        }
    ];
}

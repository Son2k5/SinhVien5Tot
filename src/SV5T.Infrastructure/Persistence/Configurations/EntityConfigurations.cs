using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SV5T.Domain.Auth;
using SV5T.Domain.Users;
using SV5T.Domain.Welcome;

namespace SV5T.Infrastructure.Persistence.Configurations;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("users");
        builder.HasKey(user => user.Id);

        builder.Property(user => user.Email)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(user => user.NormalizedEmail)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(user => user.DisplayName).HasMaxLength(100);

        builder.Property(user => user.PasswordHash)
            .HasMaxLength(255)
            .IsRequired();

        builder.Property(user => user.AvatarUrl).HasMaxLength(2048);
        builder.Property(user => user.AvatarPublicId).HasMaxLength(255);
        builder.Property(user => user.AvatarResourceType).HasMaxLength(50);
        builder.Property(user => user.CreatedBy).HasMaxLength(100);
        builder.Property(user => user.UpdatedBy).HasMaxLength(100);
        builder.Property(user => user.SecurityVersion).HasDefaultValue(1);
        builder.HasIndex(user => user.NormalizedEmail).IsUnique();
    }
}

public sealed class UserProfileConfiguration : IEntityTypeConfiguration<UserProfile>
{
    public void Configure(EntityTypeBuilder<UserProfile> builder)
    {
        builder.ToTable("user_profiles");
        builder.HasKey(profile => profile.Id);

        builder.Property(profile => profile.FullName).HasMaxLength(255).IsRequired();
        builder.Property(profile => profile.IdentityCardNumber).HasMaxLength(2048).IsRequired();
        builder.Property(profile => profile.Ethnicity).HasMaxLength(100).IsRequired();
        builder.Property(profile => profile.School).HasMaxLength(255).IsRequired();
        builder.Property(profile => profile.Major).HasMaxLength(255);
        builder.Property(profile => profile.StudentCode).HasMaxLength(50).IsRequired();
        builder.Property(profile => profile.AdministrativeClass).HasMaxLength(100).IsRequired();
        builder.Property(profile => profile.Faculty).HasMaxLength(255).IsRequired();
        builder.Property(profile => profile.CurrentPosition).HasMaxLength(255).IsRequired();
        builder.Property(profile => profile.ContactEmail).HasMaxLength(2048).IsRequired();
        builder.Property(profile => profile.PhoneNumber).HasMaxLength(2048).IsRequired();
        builder.Property(profile => profile.UnionPosition).HasMaxLength(255);

        builder.HasIndex(profile => profile.UserId).IsUnique();
        builder.HasIndex(profile => profile.StudentCode).IsUnique();

        builder.HasOne(profile => profile.User)
            .WithOne(user => user.Profile)
            .HasForeignKey<UserProfile>(profile => profile.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class UserAddressConfiguration : IEntityTypeConfiguration<UserAddress>
{
    public void Configure(EntityTypeBuilder<UserAddress> builder)
    {
        builder.ToTable("user_addresses");
        builder.HasKey(address => address.Id);

        builder.Property(address => address.ProvinceOrCity).HasMaxLength(255).IsRequired();
        builder.Property(address => address.District).HasMaxLength(255).IsRequired();
        builder.Property(address => address.StreetAddress).HasMaxLength(4096).IsRequired();

        builder.HasIndex(address => new { address.UserId, address.AddressType }).IsUnique();

        builder.HasOne(address => address.User)
            .WithMany(user => user.Addresses)
            .HasForeignKey(address => address.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("refresh_tokens");
        builder.HasKey(token => token.Id);

        builder.Property(token => token.Token)
            .HasMaxLength(64)
            .IsRequired();

        builder.HasIndex(token => token.Token).IsUnique();
        builder.HasIndex(token => new
        {
            token.UserId,
            token.IsRevoked,
            token.CreatedAtUtc
        });
        builder.HasIndex(token => token.ExpiresAtUtc);
        builder.HasIndex(token => token.AbsoluteExpiresAtUtc);
        builder.HasIndex(token => new { token.IsRevoked, token.RevokedAtUtc });
        builder.HasIndex(token => new { token.FamilyId, token.IsRevoked });

        builder.HasOne(token => token.User)
            .WithMany(user => user.RefreshTokens)
            .HasForeignKey(token => token.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class PortalContentConfiguration : IEntityTypeConfiguration<PortalContent>
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


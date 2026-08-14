using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace SV5T.Migrations
{
    /// <inheritdoc />
    public partial class WelcomeDashboardContent : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "portal_contents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Type = table.Column<int>(type: "int", nullable: false),
                    Source = table.Column<int>(type: "int", nullable: false),
                    Title = table.Column<string>(type: "varchar(180)", maxLength: 180, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Summary = table.Column<string>(type: "varchar(600)", maxLength: 600, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Route = table.Column<string>(type: "varchar(240)", maxLength: 240, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Icon = table.Column<string>(type: "varchar(40)", maxLength: 40, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsFeatured = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IsPublished = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    PublishedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_portal_contents", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.InsertData(
                table: "portal_contents",
                columns: new[] { "Id", "ExpiresAtUtc", "Icon", "IsFeatured", "IsPublished", "PublishedAtUtc", "Route", "Source", "Summary", "Title", "Type" },
                values: new object[,]
                {
                    { new Guid("0f35db57-0986-4f25-8a30-75ba664d4e01"), null, "sparkles", true, true, new DateTime(2026, 8, 10, 1, 0, 0, 0, DateTimeKind.Utc), "/dashboard", 1, "Hồ sơ, minh chứng và thông tin xét duyệt của bạn sẽ được quản lý tập trung tại đây.", "Chào mừng bạn đến với hệ thống Sinh viên 5 Tốt", 1 },
                    { new Guid("0f35db57-0986-4f25-8a30-75ba664d4e02"), null, "bell", false, true, new DateTime(2026, 8, 9, 8, 30, 0, 0, DateTimeKind.Utc), "/dashboard?view=evidence", 4, "Sinh viên vui lòng kiểm tra thông tin cá nhân trước khi nộp minh chứng.", "Chuẩn bị mở đợt cập nhật hồ sơ học kỳ I", 1 },
                    { new Guid("0f35db57-0986-4f25-8a30-75ba664d4e03"), null, "shield-check", false, true, new DateTime(2026, 8, 8, 3, 15, 0, 0, DateTimeKind.Utc), "/dashboard", 1, "Phiên đăng nhập và dữ liệu cá nhân được xác thực an toàn qua hệ thống.", "Tài khoản của bạn đã được bảo vệ", 1 },
                    { new Guid("0f35db57-0986-4f25-8a30-75ba664d4e04"), null, "landmark", true, true, new DateTime(2026, 8, 10, 0, 30, 0, 0, DateTimeKind.Utc), "/dashboard?news=university-activities-2026", 2, "Nhà trường công bố kế hoạch hoạt động học thuật, hội nhập và tình nguyện dành cho sinh viên.", "Khởi động chuỗi hoạt động sinh viên năm học 2026–2027", 2 },
                    { new Guid("0f35db57-0986-4f25-8a30-75ba664d4e05"), null, "graduation-cap", false, true, new DateTime(2026, 8, 9, 2, 0, 0, 0, DateTimeKind.Utc), "/dashboard?news=faculty-innovation-week", 3, "Nhiều workshop chuyên môn và hoạt động kết nối doanh nghiệp sẽ diễn ra trong tháng 8.", "Khoa phát động tuần lễ học tập và đổi mới sáng tạo", 2 },
                    { new Guid("0f35db57-0986-4f25-8a30-75ba664d4e06"), null, "heart-handshake", false, true, new DateTime(2026, 8, 8, 7, 0, 0, 0, DateTimeKind.Utc), "/dashboard?news=volunteer-recruitment", 4, "Đăng ký tham gia đội hình hỗ trợ nhập học và tích lũy hoạt động cho tiêu chí tình nguyện tốt.", "Đoàn Thanh niên tuyển tình nguyện viên hỗ trợ tân sinh viên", 2 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_portal_contents_Type_IsPublished_PublishedAtUtc",
                table: "portal_contents",
                columns: new[] { "Type", "IsPublished", "PublishedAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "portal_contents");
        }
    }
}

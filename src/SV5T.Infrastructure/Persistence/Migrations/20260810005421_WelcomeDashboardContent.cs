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
                    { new Guid("0f35db57-0986-4f25-8a30-75ba664d4e01"), null, "sparkles", true, true, new DateTime(2026, 8, 10, 1, 0, 0, 0, DateTimeKind.Utc), "/dashboard", 1, "H? so, minh ch?ng và thông tin xét duy?t c?a b?n s? du?c qu?n lý t?p trung t?i dây.", "Chào m?ng b?n d?n v?i h? th?ng Sinh viên 5 T?t", 1 },
                    { new Guid("0f35db57-0986-4f25-8a30-75ba664d4e02"), null, "bell", false, true, new DateTime(2026, 8, 9, 8, 30, 0, 0, DateTimeKind.Utc), "/dashboard?view=evidence", 4, "Sinh viên vui lòng ki?m tra thông tin cá nhân tru?c khi n?p minh ch?ng.", "Chu?n b? m? d?t c?p nh?t h? so h?c k? I", 1 },
                    { new Guid("0f35db57-0986-4f25-8a30-75ba664d4e03"), null, "shield-check", false, true, new DateTime(2026, 8, 8, 3, 15, 0, 0, DateTimeKind.Utc), "/dashboard", 1, "Phiên dang nh?p và d? li?u cá nhân du?c xác th?c an toàn qua h? th?ng.", "Tài kho?n c?a b?n dã du?c b?o v?", 1 },
                    { new Guid("0f35db57-0986-4f25-8a30-75ba664d4e04"), null, "landmark", true, true, new DateTime(2026, 8, 10, 0, 30, 0, 0, DateTimeKind.Utc), "/dashboard?news=university-activities-2026", 2, "Nhà tru?ng công b? k? ho?ch ho?t d?ng h?c thu?t, h?i nh?p và tình nguy?n dành cho sinh viên.", "Kh?i d?ng chu?i ho?t d?ng sinh viên nam h?c 2026–2027", 2 },
                    { new Guid("0f35db57-0986-4f25-8a30-75ba664d4e05"), null, "graduation-cap", false, true, new DateTime(2026, 8, 9, 2, 0, 0, 0, DateTimeKind.Utc), "/dashboard?news=faculty-innovation-week", 3, "Nhi?u workshop chuyên môn và ho?t d?ng k?t n?i doanh nghi?p s? di?n ra trong tháng 8.", "Khoa phát d?ng tu?n l? h?c t?p và d?i m?i sáng t?o", 2 },
                    { new Guid("0f35db57-0986-4f25-8a30-75ba664d4e06"), null, "heart-handshake", false, true, new DateTime(2026, 8, 8, 7, 0, 0, 0, DateTimeKind.Utc), "/dashboard?news=volunteer-recruitment", 4, "Ðang ký tham gia d?i hình h? tr? nh?p h?c và tích luy ho?t d?ng cho tiêu chí tình nguy?n t?t.", "Ðoàn Thanh niên tuy?n tình nguy?n viên h? tr? tân sinh viên", 2 }
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



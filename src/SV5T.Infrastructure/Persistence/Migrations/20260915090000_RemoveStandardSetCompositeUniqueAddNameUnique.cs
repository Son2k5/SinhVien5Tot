using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SV5T.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveStandardSetCompositeUniqueAddNameUnique : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_standard_sets_AcademicYear_Level_AwardType_Version",
                table: "standard_sets");

            // Backfill cac row co Name rong (do migration AddStandardSetName default "")
            // de dam bao tao unique index tren Name khong that bai.
            // CONCAT bao gom LEFT(Id,8) de dam bao duy nhat ngay ca khi trung AcademicYear/Level/AwardType.
            migrationBuilder.Sql("""
                UPDATE `standard_sets`
                SET `Name` = CONCAT('Bộ tiêu chuẩn ', `AcademicYear`, ' - ', `Level`, ' - ', `AwardType`, ' - ', LEFT(`Id`, 8))
                WHERE `Name` IS NULL OR TRIM(`Name`) = '';
                """);

            migrationBuilder.CreateIndex(
                name: "IX_standard_sets_Name",
                table: "standard_sets",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_standard_sets_AcademicYear_Level_AwardType_Version",
                table: "standard_sets",
                columns: new[] { "AcademicYear", "Level", "AwardType", "Version" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_standard_sets_AcademicYear_Level_AwardType_Version",
                table: "standard_sets");

            migrationBuilder.DropIndex(
                name: "IX_standard_sets_Name",
                table: "standard_sets");

            migrationBuilder.CreateIndex(
                name: "IX_standard_sets_AcademicYear_Level_AwardType_Version",
                table: "standard_sets",
                columns: new[] { "AcademicYear", "Level", "AwardType", "Version" },
                unique: true);
        }
    }
}

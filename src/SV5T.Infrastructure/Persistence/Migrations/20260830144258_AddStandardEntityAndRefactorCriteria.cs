using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SV5T.Migrations
{
    /// <inheritdoc />
    public partial class AddStandardEntityAndRefactorCriteria : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_criteria_standard_sets_StandardSetId",
                table: "criteria");

            migrationBuilder.DropColumn(
                name: "GroupCode",
                table: "criteria");

            migrationBuilder.RenameColumn(
                name: "StandardSetId",
                table: "criteria",
                newName: "StandardId");

            migrationBuilder.RenameIndex(
                name: "IX_criteria_StandardSetId_ParentCriterionId_DisplayOrder",
                table: "criteria",
                newName: "IX_criteria_StandardId_ParentCriterionId_DisplayOrder");

            migrationBuilder.CreateTable(
                name: "standards",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    StandardSetId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    GroupCode = table.Column<int>(type: "int", nullable: true),
                    Code = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Title = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    Operator = table.Column<int>(type: "int", nullable: false),
                    MinimumSatisfied = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreatedBy = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_standards", x => x.Id);
                    table.ForeignKey(
                        name: "FK_standards_standard_sets_StandardSetId",
                        column: x => x.StandardSetId,
                        principalTable: "standard_sets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_standards_StandardSetId_DisplayOrder",
                table: "standards",
                columns: new[] { "StandardSetId", "DisplayOrder" });

            migrationBuilder.AddForeignKey(
                name: "FK_criteria_standards_StandardId",
                table: "criteria",
                column: "StandardId",
                principalTable: "standards",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_criteria_standards_StandardId",
                table: "criteria");

            migrationBuilder.DropTable(
                name: "standards");

            migrationBuilder.RenameColumn(
                name: "StandardId",
                table: "criteria",
                newName: "StandardSetId");

            migrationBuilder.RenameIndex(
                name: "IX_criteria_StandardId_ParentCriterionId_DisplayOrder",
                table: "criteria",
                newName: "IX_criteria_StandardSetId_ParentCriterionId_DisplayOrder");

            migrationBuilder.AddColumn<int>(
                name: "GroupCode",
                table: "criteria",
                type: "int",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_criteria_standard_sets_StandardSetId",
                table: "criteria",
                column: "StandardSetId",
                principalTable: "standard_sets",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

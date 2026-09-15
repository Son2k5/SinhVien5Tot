using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SV5T.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RemoveEvidenceTypeTemplatesTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_evidences_evidence_type_templates_EvidenceTypeTemplateId",
                table: "evidences");

            migrationBuilder.DropTable(
                name: "evidence_type_templates");

            migrationBuilder.DropIndex(
                name: "IX_evidences_EvidenceTypeTemplateId",
                table: "evidences");

            migrationBuilder.DropColumn(
                name: "EvidenceTypeTemplateId",
                table: "evidences");

            migrationBuilder.CreateIndex(
                name: "IX_users_IsDeleted",
                table: "users",
                column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_users_Role_IsDeleted",
                table: "users",
                columns: new[] { "Role", "IsDeleted" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_users_IsDeleted",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_users_Role_IsDeleted",
                table: "users");

            migrationBuilder.AddColumn<Guid>(
                name: "EvidenceTypeTemplateId",
                table: "evidences",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateTable(
                name: "evidence_type_templates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    AttachmentPolicyJson = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Code = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreatedBy = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FieldSchemaJson = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Name = table.Column<string>(type: "varchar(250)", maxLength: 250, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    UpdatedBy = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Version = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_evidence_type_templates", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_evidences_EvidenceTypeTemplateId",
                table: "evidences",
                column: "EvidenceTypeTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_evidence_type_templates_Code_Version",
                table: "evidence_type_templates",
                columns: new[] { "Code", "Version" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_evidences_evidence_type_templates_EvidenceTypeTemplateId",
                table: "evidences",
                column: "EvidenceTypeTemplateId",
                principalTable: "evidence_type_templates",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SV5T.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAdminStudentSoftDelete : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder
                .AddColumn<string>(
                    name: "DeleteReason",
                    table: "users",
                    type: "varchar(500)",
                    maxLength: 500,
                    nullable: true
                )
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "DeletedAt",
                table: "users",
                type: "datetime(6)",
                nullable: true
            );

            migrationBuilder.AddColumn<Guid>(
                name: "DeletedBy",
                table: "users",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci"
            );

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "users",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false
            );

            migrationBuilder
                .CreateTable(
                    name: "admin_audit_logs",
                    columns: table => new
                    {
                        Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                        Action = table
                            .Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                            .Annotation("MySql:CharSet", "utf8mb4"),
                        TargetUserId = table.Column<Guid>(
                            type: "char(36)",
                            nullable: false,
                            collation: "ascii_general_ci"
                        ),
                        ActorId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                        Reason = table
                            .Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                            .Annotation("MySql:CharSet", "utf8mb4"),
                        MetadataJson = table
                            .Column<string>(type: "longtext", nullable: false)
                            .Annotation("MySql:CharSet", "utf8mb4"),
                        CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    },
                    constraints: table =>
                    {
                        table.PrimaryKey("PK_admin_audit_logs", x => x.Id);
                    }
                )
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(name: "IX_users_IsDeleted", table: "users", column: "IsDeleted");

            migrationBuilder.CreateIndex(
                name: "IX_users_Role_IsDeleted",
                table: "users",
                columns: new[] { "Role", "IsDeleted" }
            );

            migrationBuilder.CreateIndex(
                name: "IX_admin_audit_logs_ActorId_CreatedAt",
                table: "admin_audit_logs",
                columns: new[] { "ActorId", "CreatedAt" }
            );

            migrationBuilder.CreateIndex(
                name: "IX_admin_audit_logs_TargetUserId_CreatedAt",
                table: "admin_audit_logs",
                columns: new[] { "TargetUserId", "CreatedAt" }
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "admin_audit_logs");

            migrationBuilder.DropIndex(name: "IX_users_IsDeleted", table: "users");

            migrationBuilder.DropIndex(name: "IX_users_Role_IsDeleted", table: "users");

            migrationBuilder.DropColumn(name: "DeleteReason", table: "users");

            migrationBuilder.DropColumn(name: "DeletedAt", table: "users");

            migrationBuilder.DropColumn(name: "DeletedBy", table: "users");

            migrationBuilder.DropColumn(name: "IsDeleted", table: "users");
        }
    }
}

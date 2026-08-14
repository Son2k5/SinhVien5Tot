using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SV5T.Infrastructure.Persistence;

#nullable disable

namespace SV5T.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260812090000_EnforceTokenFamilyIdleTimeout")]
public partial class EnforceTokenFamilyIdleTimeout : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "FamilyId",
            table: "refresh_tokens",
            type: "char(36)",
            nullable: true,
            collation: "ascii_general_ci");

        migrationBuilder.AddColumn<DateTime>(
            name: "LastUsedAtUtc",
            table: "refresh_tokens",
            type: "datetime(6)",
            nullable: true);

        migrationBuilder.AddColumn<Guid>(
            name: "ReplacedByTokenId",
            table: "refresh_tokens",
            type: "char(36)",
            nullable: true,
            collation: "ascii_general_ci");

        migrationBuilder.Sql(
            """
            UPDATE `refresh_tokens`
            SET
                `FamilyId` = `Id`,
                `LastUsedAtUtc` = `CreatedAtUtc`;
            """);

        migrationBuilder.AlterColumn<Guid>(
            name: "FamilyId",
            table: "refresh_tokens",
            type: "char(36)",
            nullable: false,
            collation: "ascii_general_ci",
            oldClrType: typeof(Guid),
            oldType: "char(36)",
            oldNullable: true,
            oldCollation: "ascii_general_ci");

        migrationBuilder.AlterColumn<DateTime>(
            name: "LastUsedAtUtc",
            table: "refresh_tokens",
            type: "datetime(6)",
            nullable: false,
            oldClrType: typeof(DateTime),
            oldType: "datetime(6)",
            oldNullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_refresh_tokens_FamilyId_IsRevoked",
            table: "refresh_tokens",
            columns: new[] { "FamilyId", "IsRevoked" });
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_refresh_tokens_FamilyId_IsRevoked",
            table: "refresh_tokens");

        migrationBuilder.DropColumn(
            name: "FamilyId",
            table: "refresh_tokens");

        migrationBuilder.DropColumn(
            name: "LastUsedAtUtc",
            table: "refresh_tokens");

        migrationBuilder.DropColumn(
            name: "ReplacedByTokenId",
            table: "refresh_tokens");
    }
}

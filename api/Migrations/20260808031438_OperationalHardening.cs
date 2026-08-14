using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SV5T.Migrations
{
    /// <inheritdoc />
    public partial class OperationalHardening : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_refresh_tokens_RevokedAtUtc",
                table: "refresh_tokens");

            migrationBuilder.AddColumn<int>(
                name: "SecurityVersion",
                table: "users",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AlterColumn<string>(
                name: "PhoneNumber",
                table: "user_profiles",
                type: "varchar(2048)",
                maxLength: 2048,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(30)",
                oldMaxLength: 30)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "IdentityCardNumber",
                table: "user_profiles",
                type: "varchar(2048)",
                maxLength: 2048,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldMaxLength: 50)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "ContactEmail",
                table: "user_profiles",
                type: "varchar(2048)",
                maxLength: 2048,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)",
                oldMaxLength: 255)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "StreetAddress",
                table: "user_addresses",
                type: "varchar(4096)",
                maxLength: 4096,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(500)",
                oldMaxLength: 500)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "AbsoluteExpiresAtUtc",
                table: "refresh_tokens",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsPersistent",
                table: "refresh_tokens",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql(
                "UPDATE refresh_tokens SET AbsoluteExpiresAtUtc = ExpiresAtUtc " +
                "WHERE AbsoluteExpiresAtUtc IS NULL;");

            migrationBuilder.AlterColumn<DateTime>(
                name: "AbsoluteExpiresAtUtc",
                table: "refresh_tokens",
                type: "datetime(6)",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime(6)",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "auth_challenges",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Purpose = table.Column<int>(type: "int", nullable: false),
                    ProtectedPayload = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OtpHash = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FailedAttempts = table.Column<int>(type: "int", nullable: false),
                    MaxAttempts = table.Column<int>(type: "int", nullable: false),
                    ExpiresAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ConsumedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_auth_challenges", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "email_outbox",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ProtectedPayload = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Priority = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    RetryCount = table.Column<int>(type: "int", nullable: false),
                    LastError = table.Column<string>(type: "varchar(4000)", maxLength: 4000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    AvailableAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    LeaseId = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    LeaseExpiresAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    SentAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_email_outbox", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "revoked_access_tokens",
                columns: table => new
                {
                    Jti = table.Column<string>(type: "varchar(64)", maxLength: 64, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UserId = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ExpiresAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    RevokedAtUtc = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_revoked_access_tokens", x => x.Jti);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_AbsoluteExpiresAtUtc",
                table: "refresh_tokens",
                column: "AbsoluteExpiresAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_IsRevoked_RevokedAtUtc",
                table: "refresh_tokens",
                columns: new[] { "IsRevoked", "RevokedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_auth_challenges_ExpiresAtUtc",
                table: "auth_challenges",
                column: "ExpiresAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_auth_challenges_Purpose_ConsumedAtUtc_ExpiresAtUtc",
                table: "auth_challenges",
                columns: new[] { "Purpose", "ConsumedAtUtc", "ExpiresAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_email_outbox_SentAtUtc",
                table: "email_outbox",
                column: "SentAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_email_outbox_Status_Priority_AvailableAtUtc_LeaseExpiresAtUtc",
                table: "email_outbox",
                columns: new[] { "Status", "Priority", "AvailableAtUtc", "LeaseExpiresAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_revoked_access_tokens_ExpiresAtUtc",
                table: "revoked_access_tokens",
                column: "ExpiresAtUtc");

            migrationBuilder.CreateIndex(
                name: "IX_revoked_access_tokens_UserId_ExpiresAtUtc",
                table: "revoked_access_tokens",
                columns: new[] { "UserId", "ExpiresAtUtc" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "auth_challenges");

            migrationBuilder.DropTable(
                name: "email_outbox");

            migrationBuilder.DropTable(
                name: "revoked_access_tokens");

            migrationBuilder.DropIndex(
                name: "IX_refresh_tokens_AbsoluteExpiresAtUtc",
                table: "refresh_tokens");

            migrationBuilder.DropIndex(
                name: "IX_refresh_tokens_IsRevoked_RevokedAtUtc",
                table: "refresh_tokens");

            migrationBuilder.DropColumn(
                name: "SecurityVersion",
                table: "users");

            migrationBuilder.DropColumn(
                name: "AbsoluteExpiresAtUtc",
                table: "refresh_tokens");

            migrationBuilder.DropColumn(
                name: "IsPersistent",
                table: "refresh_tokens");

            migrationBuilder.AlterColumn<string>(
                name: "PhoneNumber",
                table: "user_profiles",
                type: "varchar(30)",
                maxLength: 30,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(2048)",
                oldMaxLength: 2048)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "IdentityCardNumber",
                table: "user_profiles",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(2048)",
                oldMaxLength: 2048)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "ContactEmail",
                table: "user_profiles",
                type: "varchar(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(2048)",
                oldMaxLength: 2048)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "StreetAddress",
                table: "user_addresses",
                type: "varchar(500)",
                maxLength: 500,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(4096)",
                oldMaxLength: 4096)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_RevokedAtUtc",
                table: "refresh_tokens",
                column: "RevokedAtUtc");
        }
    }
}

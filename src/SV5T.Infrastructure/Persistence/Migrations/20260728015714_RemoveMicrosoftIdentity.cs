using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SV5T.Migrations
{
    /// <inheritdoc />
    public partial class RemoveMicrosoftIdentity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_users_MicrosoftTenantId_MicrosoftObjectId",
                table: "users");

            migrationBuilder.DropColumn(
                name: "MicrosoftObjectId",
                table: "users");

            migrationBuilder.DropColumn(
                name: "MicrosoftTenantId",
                table: "users");

            // Accounts created only through Microsoft sign-in have no password.
            // Mark them unverified so the owner can register the same school
            // email again, choose a password, and complete OTP verification.
            migrationBuilder.Sql(
                """
                UPDATE `users`
                SET `PasswordHash` = '', `IsVerified` = FALSE
                WHERE `PasswordHash` IS NULL;
                """);

            migrationBuilder.AlterColumn<string>(
                name: "PasswordHash",
                table: "users",
                type: "varchar(255)",
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(255)",
                oldMaxLength: 255,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "PasswordHash",
                table: "users",
                type: "varchar(255)",
                maxLength: 255,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(255)",
                oldMaxLength: 255)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "MicrosoftObjectId",
                table: "users",
                type: "varchar(36)",
                maxLength: 36,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "MicrosoftTenantId",
                table: "users",
                type: "varchar(36)",
                maxLength: 36,
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_users_MicrosoftTenantId_MicrosoftObjectId",
                table: "users",
                columns: new[] { "MicrosoftTenantId", "MicrosoftObjectId" },
                unique: true);
        }
    }
}



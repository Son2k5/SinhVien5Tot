using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SV5T.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStandardSetName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "standard_sets",
                type: "varchar(255)",
                maxLength: 255,
                nullable: false,
                defaultValue: ""
            )
            .Annotation("MySql:CharSet", "utf8mb4");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Name",
                table: "standard_sets"
            );
        }
    }
}

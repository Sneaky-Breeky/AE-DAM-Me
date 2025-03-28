using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DAMBackend.Migrations
{
    /// <inheritdoc />
    public partial class AddFieldsToFile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_LogImage",
                table: "LogImage");

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "Files",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Resolution",
                table: "Files",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddPrimaryKey(
                name: "PK_LogImage",
                table: "LogImage",
                column: "LogId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropPrimaryKey(
                name: "PK_LogImage",
                table: "LogImage");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "Files");

            migrationBuilder.DropColumn(
                name: "Resolution",
                table: "Files");

            migrationBuilder.AddPrimaryKey(
                name: "PK_LogImage",
                table: "LogImage",
                columns: new[] { "LogId", "UserId" });
        }
    }
}

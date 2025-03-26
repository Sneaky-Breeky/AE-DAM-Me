using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DAMBackend.Migrations
{
    /// <inheritdoc />
    public partial class DropMetaDataTags : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MetadataTags");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MetadataTags",
                columns: table => new
                {
                    FileId = table.Column<int>(nullable: false),
                    Key = table.Column<string>(nullable: false),
                    // Add other columns as needed
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MetadataTags", x => new { x.FileId, x.Key });
                    table.ForeignKey(
                        name: "FK_MetadataTags_Files_FileId",
                        column: x => x.FileId,
                        principalTable: "Files",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DAMBackend.Migrations
{
    /// <inheritdoc />
    public partial class addMetaDataTagTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MetadataTags",
                columns: table => new
                {
                    FileId = table.Column<int>(nullable: false),
                    Key = table.Column<string>(nullable: false),
                    sValue = table.Column<string>(nullable: true),
                    iValue = table.Column<int>(nullable: false),
                    type = table.Column<int>(nullable: false)
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

            // Add any other required changes here
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MetadataTags");
        }
    }
}

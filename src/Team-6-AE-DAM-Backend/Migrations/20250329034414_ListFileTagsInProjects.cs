using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DAMBackend.Migrations
{
    /// <inheritdoc />
    public partial class ListFileTagsInProjects : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // migrationBuilder.DropForeignKey(
            //     name: "FK_FileTag_BasicTags_TagId",
            //     table: "FileTag");

            migrationBuilder.DropForeignKey(
                name: "FK_FileTag_Files",
                table: "FileTag");

            migrationBuilder.CreateTable(
                name: "ProjectBasicTag",
                columns: table => new
                {
                    BasicTagId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProjectId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectBasicTag", x => new { x.BasicTagId, x.ProjectId });
                    table.ForeignKey(
                        name: "FK_ProjectBasicTag_BasicTags_BasicTagId",
                        column: x => x.BasicTagId,
                        principalTable: "BasicTags",
                        principalColumn: "Value",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectBasicTag_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectBasicTag_ProjectId",
                table: "ProjectBasicTag",
                column: "ProjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_FileTag_BasicTags_TagId",
                table: "FileTag",
                column: "TagId",
                principalTable: "BasicTags",
                principalColumn: "Value",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_FileTag_Files_FileId",
                table: "FileTag",
                column: "FileId",
                principalTable: "Files",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FileTag_BasicTags_TagId",
                table: "FileTag");

            migrationBuilder.DropForeignKey(
                name: "FK_FileTag_Files_FileId",
                table: "FileTag");

            migrationBuilder.DropTable(
                name: "ProjectBasicTag");

            migrationBuilder.AddForeignKey(
                name: "FK_FileTag_BasicTags_TagId",
                table: "FileTag",
                column: "TagId",
                principalTable: "BasicTags",
                principalColumn: "Value",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_FileTag_Files_FileId",
                table: "FileTag",
                column: "FileId",
                principalTable: "Files",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

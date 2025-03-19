using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DAMBackend.Migrations
{
    /// <inheritdoc />
    public partial class ProjectTagNaming : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProjectTagModel_Projects_ProjectId",
                table: "ProjectTagModel");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProjectTagModel",
                table: "ProjectTagModel");

            migrationBuilder.RenameTable(
                name: "ProjectTagModel",
                newName: "ProjectTags");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProjectTags",
                table: "ProjectTags",
                columns: new[] { "ProjectId", "Key" });

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectTags_Projects_ProjectId",
                table: "ProjectTags",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProjectTags_Projects_ProjectId",
                table: "ProjectTags");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ProjectTags",
                table: "ProjectTags");

            migrationBuilder.RenameTable(
                name: "ProjectTags",
                newName: "ProjectTagModel");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ProjectTagModel",
                table: "ProjectTagModel",
                columns: new[] { "ProjectId", "Key" });

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectTagModel_Projects_ProjectId",
                table: "ProjectTagModel",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

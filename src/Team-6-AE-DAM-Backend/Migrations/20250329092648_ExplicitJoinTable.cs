using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DAMBackend.Migrations
{
    /// <inheritdoc />
    public partial class ExplicitJoinTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProjectBasicTag_BasicTags_BasicTagId",
                table: "ProjectBasicTag");

            migrationBuilder.RenameColumn(
                name: "BasicTagId",
                table: "ProjectBasicTag",
                newName: "BasicTagValue");

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectBasicTag_BasicTags_BasicTagValue",
                table: "ProjectBasicTag",
                column: "BasicTagValue",
                principalTable: "BasicTags",
                principalColumn: "Value",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProjectBasicTag_BasicTags_BasicTagValue",
                table: "ProjectBasicTag");

            migrationBuilder.RenameColumn(
                name: "BasicTagValue",
                table: "ProjectBasicTag",
                newName: "BasicTagId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectBasicTag_BasicTags_BasicTagId",
                table: "ProjectBasicTag",
                column: "BasicTagId",
                principalTable: "BasicTags",
                principalColumn: "Value",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

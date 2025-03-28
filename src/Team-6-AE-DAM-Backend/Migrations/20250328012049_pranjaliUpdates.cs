using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DAMBackend.Migrations
{
    /// <inheritdoc />
    public partial class pranjaliUpdates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK__LogImage__FileId__367C1819",
                table: "LogImages");

            migrationBuilder.DropForeignKey(
                name: "FK__LogImage__UserId__3587F3E0",
                table: "LogImages");

            migrationBuilder.DropPrimaryKey(
                name: "PK__LogImage__5E548648EB3E4983",
                table: "LogImages");

            migrationBuilder.RenameTable(
                name: "LogImages",
                newName: "LogImage");

            // migrationBuilder.RenameIndex(
            //     name: "IX_LogImages_UserId",
            //     table: "LogImage",
            //     newName: "IX_LogImage_UserId");
            //
            // migrationBuilder.RenameIndex(
            //     name: "IX_LogImages_FileId",
            //     table: "LogImage",
            //     newName: "IX_LogImage_FileId"); 

            migrationBuilder.AddPrimaryKey(
                name: "PK_LogImage",
                table: "LogImage",
                columns: new[] { "LogId"});

            migrationBuilder.CreateIndex(
                name: "IX_LogImage_ProjectId",
                table: "LogImage",
                column: "ProjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_LogImage_Files_FileId",
                table: "LogImage",
                column: "FileId",
                principalTable: "Files",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_LogImage_Projects_ProjectId",
                table: "LogImage",
                column: "ProjectId",
                principalTable: "Projects",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_LogImage_Users_UserId",
                table: "LogImage",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LogImage_Files_FileId",
                table: "LogImage");

            migrationBuilder.DropForeignKey(
                name: "FK_LogImage_Projects_ProjectId",
                table: "LogImage");

            migrationBuilder.DropForeignKey(
                name: "FK_LogImage_Users_UserId",
                table: "LogImage");

            migrationBuilder.DropPrimaryKey(
                name: "PK_LogImage",
                table: "LogImage");

            migrationBuilder.DropIndex(
                name: "IX_LogImage_ProjectId",
                table: "LogImage");

            migrationBuilder.DropColumn(
                name: "ProjectId",
                table: "LogImage");

            migrationBuilder.RenameTable(
                name: "LogImage",
                newName: "LogImages");

            migrationBuilder.RenameIndex(
                name: "IX_LogImage_UserId",
                table: "LogImages",
                newName: "IX_LogImages_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_LogImage_FileId",
                table: "LogImages",
                newName: "IX_LogImages_FileId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_LogImages",
                table: "LogImages",
                columns: new[] { "LogId", "FileId", "UserId" });

            migrationBuilder.AddForeignKey(
                name: "FK_LogImages_Files_FileId",
                table: "LogImages",
                column: "FileId",
                principalTable: "Files",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_LogImages_Users_UserId",
                table: "LogImages",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

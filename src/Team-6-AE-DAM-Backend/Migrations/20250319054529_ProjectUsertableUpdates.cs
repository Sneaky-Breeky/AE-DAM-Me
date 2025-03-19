using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DAMBackend.Migrations
{
    /// <inheritdoc />
    public partial class ProjectUsertableUpdates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.CreateTable(
                name: "ProjectModelUserModel1",
                columns: table => new
                {
                    FavoritedByUsersId = table.Column<int>(type: "int", nullable: false),
                    FavouriteProjectsId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectModelUserModel1", x => new { x.FavoritedByUsersId, x.FavouriteProjectsId });
                    table.ForeignKey(
                        name: "FK_ProjectModelUserModel1_Projects_FavouriteProjectsId",
                        column: x => x.FavouriteProjectsId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectModelUserModel1_Users_FavoritedByUsersId",
                        column: x => x.FavoritedByUsersId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProjectTagModel",
                columns: table => new
                {
                    ProjectId = table.Column<int>(type: "int", nullable: false),
                    Key = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    sValue = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    iValue = table.Column<int>(type: "int", nullable: false),
                    type = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectTagModel", x => new { x.ProjectId, x.Key });
                    table.ForeignKey(
                        name: "FK_ProjectTagModel_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectModelUserModel1_FavouriteProjectsId",
                table: "ProjectModelUserModel1",
                column: "FavouriteProjectsId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProjectModelUserModel1");

            migrationBuilder.DropTable(
                name: "ProjectTagModel");

            migrationBuilder.AddColumn<string>(
                name: "FavouriteProjectIds",
                table: "Users",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}

using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DAMBackend.Migrations
{
    /// <inheritdoc />
    public partial class ProjectUsertableUpdates2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProjectModelUserModel");

            migrationBuilder.DropTable(
                name: "ProjectModelUserModel1");

            migrationBuilder.AddColumn<int>(
                name: "ProjectModelId",
                table: "Users",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "UserFavouriteProjects",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    ProjectId = table.Column<int>(type: "int", nullable: false),
                    IsFavourite = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserFavouriteProjects", x => new { x.UserId, x.ProjectId });
                    table.ForeignKey(
                        name: "FK_UserFavouriteProjects_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserFavouriteProjects_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_ProjectModelId",
                table: "Users",
                column: "ProjectModelId");

            migrationBuilder.CreateIndex(
                name: "IX_UserFavouriteProjects_ProjectId",
                table: "UserFavouriteProjects",
                column: "ProjectId");

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Projects_ProjectModelId",
                table: "Users",
                column: "ProjectModelId",
                principalTable: "Projects",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Projects_ProjectModelId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "UserFavouriteProjects");

            migrationBuilder.DropIndex(
                name: "IX_Users_ProjectModelId",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "ProjectModelId",
                table: "Users");

            migrationBuilder.CreateTable(
                name: "ProjectModelUserModel",
                columns: table => new
                {
                    ProjectsId = table.Column<int>(type: "int", nullable: false),
                    UsersId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectModelUserModel", x => new { x.ProjectsId, x.UsersId });
                    table.ForeignKey(
                        name: "FK_ProjectModelUserModel_Projects_ProjectsId",
                        column: x => x.ProjectsId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectModelUserModel_Users_UsersId",
                        column: x => x.UsersId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

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

            migrationBuilder.CreateIndex(
                name: "IX_ProjectModelUserModel_UsersId",
                table: "ProjectModelUserModel",
                column: "UsersId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectModelUserModel1_FavouriteProjectsId",
                table: "ProjectModelUserModel1",
                column: "FavouriteProjectsId");
        }
    }
}

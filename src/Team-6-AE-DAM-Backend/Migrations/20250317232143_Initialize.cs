using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DAMBackend.Migrations
{
    /// <inheritdoc />
    public partial class Initialize : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BasicTags",
                columns: table => new
                {
                    Value = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BasicTags", x => x.Value);
                });

            migrationBuilder.CreateTable(
                name: "Projects",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Location = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ImagePath = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    AccessLevel = table.Column<int>(type: "int", nullable: false),
                    Phase = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastUpdate = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Projects", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FirstName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<bool>(type: "bit", nullable: false),
                    FavouriteProjectIds = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Files",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Extension = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ThumbnailPath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ViewPath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OriginalPath = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GPSLat = table.Column<decimal>(type: "decimal(10,7)", precision: 10, scale: 7, nullable: true),
                    GPSLon = table.Column<decimal>(type: "decimal(10,7)", precision: 10, scale: 7, nullable: true),
                    GPSAlt = table.Column<decimal>(type: "decimal(10,3)", precision: 10, scale: 3, nullable: true),
                    DateTimeOriginal = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PixelWidth = table.Column<int>(type: "int", nullable: false),
                    PixelHeight = table.Column<int>(type: "int", nullable: false),
                    Make = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Model = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    FocalLength = table.Column<int>(type: "int", nullable: true),
                    Aperture = table.Column<float>(type: "real", nullable: true),
                    Copyright = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProjectId = table.Column<int>(type: "int", nullable: true),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Palette = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Files", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Files_Projects_ProjectId",
                        column: x => x.ProjectId,
                        principalTable: "Projects",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_Files_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

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
                name: "FileTag",
                columns: table => new
                {
                    FileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TagId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FileTag", x => new { x.FileId, x.TagId });
                    table.ForeignKey(
                        name: "FK_FileTag_BasicTags_TagId",
                        column: x => x.TagId,
                        principalTable: "BasicTags",
                        principalColumn: "Value",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FileTag_Files_FileId",
                        column: x => x.FileId,
                        principalTable: "Files",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // migrationBuilder.CreateTable(
            //     name: "MetadataTags",
            //     columns: table => new
            //     {
            //         FileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
            //         Key = table.Column<string>(type: "nvarchar(450)", nullable: false),
            //         sValue = table.Column<string>(type: "nvarchar(max)", nullable: false),
            //         iValue = table.Column<int>(type: "int", nullable: false),
            //         type = table.Column<int>(type: "int", nullable: false)
            //     },
            //     constraints: table =>
            //     {
            //         table.PrimaryKey("PK_MetadataTags", x => new { x.FileId, x.Key });
            //         table.ForeignKey(
            //             name: "FK_MetadataTags_Files_FileId",
            //             column: x => x.FileId,
            //             principalTable: "Files",
            //             principalColumn: "Id",
            //             onDelete: ReferentialAction.Cascade);
            //     });

            migrationBuilder.CreateIndex(
                name: "IX_Files_ProjectId",
                table: "Files",
                column: "ProjectId");

            migrationBuilder.CreateIndex(
                name: "IX_Files_UserId",
                table: "Files",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_FileTag_TagId",
                table: "FileTag",
                column: "TagId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectModelUserModel_UsersId",
                table: "ProjectModelUserModel",
                column: "UsersId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FileTag");

            migrationBuilder.DropTable(
                name: "MetadataTags");

            migrationBuilder.DropTable(
                name: "ProjectModelUserModel");

            migrationBuilder.DropTable(
                name: "BasicTags");

            migrationBuilder.DropTable(
                name: "Files");

            migrationBuilder.DropTable(
                name: "Projects");

            migrationBuilder.DropTable(
                name: "Users");
        }
    }
}

using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackEnd.Migrations
{
    /// <inheritdoc />
    public partial class AddShiftTask : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bill_User_UserID",
                table: "Bill");

            migrationBuilder.CreateTable(
                name: "ShiftTask",
                columns: table => new
                {
                    TaskID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ShiftID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    Title = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsCompleted = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CompletedByID = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci"),
                    CreatedByID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShiftTask", x => x.TaskID);
                    table.ForeignKey(
                        name: "FK_ShiftTask_Shift_ShiftID",
                        column: x => x.ShiftID,
                        principalTable: "Shift",
                        principalColumn: "ShiftID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ShiftTask_User_CompletedByID",
                        column: x => x.CompletedByID,
                        principalTable: "User",
                        principalColumn: "UserID");
                    table.ForeignKey(
                        name: "FK_ShiftTask_User_CreatedByID",
                        column: x => x.CreatedByID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftTask_CompletedByID",
                table: "ShiftTask",
                column: "CompletedByID");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftTask_CreatedByID",
                table: "ShiftTask",
                column: "CreatedByID");

            migrationBuilder.CreateIndex(
                name: "IX_ShiftTask_ShiftID",
                table: "ShiftTask",
                column: "ShiftID");

            migrationBuilder.AddForeignKey(
                name: "FK_Bill_User_UserID",
                table: "Bill",
                column: "UserID",
                principalTable: "User",
                principalColumn: "UserID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bill_User_UserID",
                table: "Bill");

            migrationBuilder.DropTable(
                name: "ShiftTask");

            migrationBuilder.AddForeignKey(
                name: "FK_Bill_User_UserID",
                table: "Bill",
                column: "UserID",
                principalTable: "User",
                principalColumn: "UserID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

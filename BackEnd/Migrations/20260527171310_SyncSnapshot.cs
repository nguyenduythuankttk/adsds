using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackEnd.Migrations
{
    /// <inheritdoc />
    public partial class SyncSnapshot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bill_User_UserID",
                table: "Bill");

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

            migrationBuilder.AddForeignKey(
                name: "FK_Bill_User_UserID",
                table: "Bill",
                column: "UserID",
                principalTable: "User",
                principalColumn: "UserID",
                onDelete: ReferentialAction.SetNull);
        }
    }
}

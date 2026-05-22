using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackEnd.Migrations
{
    /// <inheritdoc />
    public partial class AddForPeopleToProduct : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StockMovement_User_EmployeeID",
                table: "StockMovement");

            migrationBuilder.AlterColumn<Guid>(
                name: "EmployeeID",
                table: "StockMovement",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)")
                .OldAnnotation("Relational:Collation", "ascii_general_ci");

            migrationBuilder.AddColumn<int>(
                name: "ForPeople",
                table: "Product",
                type: "int",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_StockMovement_User_EmployeeID",
                table: "StockMovement",
                column: "EmployeeID",
                principalTable: "User",
                principalColumn: "UserID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StockMovement_User_EmployeeID",
                table: "StockMovement");

            migrationBuilder.DropColumn(
                name: "ForPeople",
                table: "Product");

            migrationBuilder.AlterColumn<Guid>(
                name: "EmployeeID",
                table: "StockMovement",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)",
                oldNullable: true)
                .OldAnnotation("Relational:Collation", "ascii_general_ci");

            migrationBuilder.AddForeignKey(
                name: "FK_StockMovement_User_EmployeeID",
                table: "StockMovement",
                column: "EmployeeID",
                principalTable: "User",
                principalColumn: "UserID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

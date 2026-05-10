using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackEnd.Migrations
{
    /// <inheritdoc />
    public partial class DeliveryInfoOneToOne_DeliveryLogOneToMany : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryLog_User_EmployeeID",
                table: "DeliveryLog");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryInfo_BillID",
                table: "DeliveryInfo");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "ProductVarient",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<Guid>(
                name: "EmployeeID",
                table: "DeliveryLog",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)")
                .OldAnnotation("Relational:Collation", "ascii_general_ci");

            migrationBuilder.AddColumn<Guid>(
                name: "AddressID",
                table: "Bill",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryInfo_BillID",
                table: "DeliveryInfo",
                column: "BillID",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bill_AddressID",
                table: "Bill",
                column: "AddressID");

            migrationBuilder.AddForeignKey(
                name: "FK_Bill_Address_AddressID",
                table: "Bill",
                column: "AddressID",
                principalTable: "Address",
                principalColumn: "AddressID");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryLog_User_EmployeeID",
                table: "DeliveryLog",
                column: "EmployeeID",
                principalTable: "User",
                principalColumn: "UserID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bill_Address_AddressID",
                table: "Bill");

            migrationBuilder.DropForeignKey(
                name: "FK_DeliveryLog_User_EmployeeID",
                table: "DeliveryLog");

            migrationBuilder.DropIndex(
                name: "IX_DeliveryInfo_BillID",
                table: "DeliveryInfo");

            migrationBuilder.DropIndex(
                name: "IX_Bill_AddressID",
                table: "Bill");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "ProductVarient");

            migrationBuilder.DropColumn(
                name: "AddressID",
                table: "Bill");

            migrationBuilder.AlterColumn<Guid>(
                name: "EmployeeID",
                table: "DeliveryLog",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)",
                oldNullable: true)
                .OldAnnotation("Relational:Collation", "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_DeliveryInfo_BillID",
                table: "DeliveryInfo",
                column: "BillID");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryLog_User_EmployeeID",
                table: "DeliveryLog",
                column: "EmployeeID",
                principalTable: "User",
                principalColumn: "UserID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

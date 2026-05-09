using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackEnd.Migrations
{
    /// <inheritdoc />
    public partial class RemoveBooking_AddTableToBill : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BillChange_User_EmployeeID",
                table: "BillChange");

            migrationBuilder.DropTable(
                name: "BookingChange");

            migrationBuilder.DropTable(
                name: "Booking");

            migrationBuilder.DropColumn(
                name: "IsBooking",
                table: "DiningTable");

            migrationBuilder.DropColumn(
                name: "Paid",
                table: "Bill");

            migrationBuilder.AlterColumn<Guid>(
                name: "EmployeeID",
                table: "BillChange",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)")
                .OldAnnotation("Relational:Collation", "ascii_general_ci");

            migrationBuilder.AddColumn<int>(
                name: "TableID",
                table: "Bill",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Bill_TableID",
                table: "Bill",
                column: "TableID",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Bill_DiningTable_TableID",
                table: "Bill",
                column: "TableID",
                principalTable: "DiningTable",
                principalColumn: "TableID",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_BillChange_User_EmployeeID",
                table: "BillChange",
                column: "EmployeeID",
                principalTable: "User",
                principalColumn: "UserID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bill_DiningTable_TableID",
                table: "Bill");

            migrationBuilder.DropForeignKey(
                name: "FK_BillChange_User_EmployeeID",
                table: "BillChange");

            migrationBuilder.DropIndex(
                name: "IX_Bill_TableID",
                table: "Bill");

            migrationBuilder.DropColumn(
                name: "TableID",
                table: "Bill");

            migrationBuilder.AddColumn<bool>(
                name: "IsBooking",
                table: "DiningTable",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<Guid>(
                name: "EmployeeID",
                table: "BillChange",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)",
                oldNullable: true)
                .OldAnnotation("Relational:Collation", "ascii_general_ci");

            migrationBuilder.AddColumn<decimal>(
                name: "Paid",
                table: "Bill",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "Booking",
                columns: table => new
                {
                    BookingID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    TableID = table.Column<int>(type: "int", nullable: false),
                    UserID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    DeletedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    GuestComment = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NumberOfGuess = table.Column<int>(type: "int", nullable: false),
                    ScheduledTime = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Booking", x => x.BookingID);
                    table.ForeignKey(
                        name: "FK_Booking_DiningTable_TableID",
                        column: x => x.TableID,
                        principalTable: "DiningTable",
                        principalColumn: "TableID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Booking_User_UserID",
                        column: x => x.UserID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "BookingChange",
                columns: table => new
                {
                    ChangeID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    BookingID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    EmployeeID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    BookingStatus = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ChangeAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    comment = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingChange", x => x.ChangeID);
                    table.ForeignKey(
                        name: "FK_BookingChange_Booking_BookingID",
                        column: x => x.BookingID,
                        principalTable: "Booking",
                        principalColumn: "BookingID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BookingChange_User_EmployeeID",
                        column: x => x.EmployeeID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Booking_TableID",
                table: "Booking",
                column: "TableID");

            migrationBuilder.CreateIndex(
                name: "IX_Booking_UserID",
                table: "Booking",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_BookingChange_BookingID",
                table: "BookingChange",
                column: "BookingID",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_BookingChange_EmployeeID",
                table: "BookingChange",
                column: "EmployeeID");

            migrationBuilder.AddForeignKey(
                name: "FK_BillChange_User_EmployeeID",
                table: "BillChange",
                column: "EmployeeID",
                principalTable: "User",
                principalColumn: "UserID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

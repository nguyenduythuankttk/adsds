using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackEnd.Migrations
{
    /// <inheritdoc />
    public partial class afk : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Ticket_User_UserID",
                table: "Ticket");

            migrationBuilder.DropTable(
                name: "TicketCombo");

            migrationBuilder.DropTable(
                name: "TicketProduct");

            migrationBuilder.DropIndex(
                name: "IX_Ticket_UserID",
                table: "Ticket");

            migrationBuilder.DropColumn(
                name: "UserID",
                table: "Ticket");

            migrationBuilder.CreateTable(
                name: "TicketUser",
                columns: table => new
                {
                    UserID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    TicketID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketUser", x => new { x.TicketID, x.UserID });
                    table.ForeignKey(
                        name: "FK_TicketUser_Ticket_TicketID",
                        column: x => x.TicketID,
                        principalTable: "Ticket",
                        principalColumn: "TicketID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TicketUser_User_UserID",
                        column: x => x.UserID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_TicketUser_UserID",
                table: "TicketUser",
                column: "UserID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TicketUser");

            migrationBuilder.AddColumn<Guid>(
                name: "UserID",
                table: "Ticket",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci");

            migrationBuilder.CreateTable(
                name: "TicketCombo",
                columns: table => new
                {
                    TicketID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ComboID = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketCombo", x => new { x.TicketID, x.ComboID });
                    table.ForeignKey(
                        name: "FK_TicketCombo_Combo_ComboID",
                        column: x => x.ComboID,
                        principalTable: "Combo",
                        principalColumn: "ComboID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TicketCombo_Ticket_TicketID",
                        column: x => x.TicketID,
                        principalTable: "Ticket",
                        principalColumn: "TicketID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "TicketProduct",
                columns: table => new
                {
                    TicketID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ProductVarientID = table.Column<int>(type: "int", nullable: false),
                    TicketID1 = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TicketProduct", x => new { x.TicketID, x.ProductVarientID });
                    table.ForeignKey(
                        name: "FK_TicketProduct_ProductVarient_ProductVarientID",
                        column: x => x.ProductVarientID,
                        principalTable: "ProductVarient",
                        principalColumn: "ProductVarientID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TicketProduct_Ticket_TicketID",
                        column: x => x.TicketID,
                        principalTable: "Ticket",
                        principalColumn: "TicketID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TicketProduct_Ticket_TicketID1",
                        column: x => x.TicketID1,
                        principalTable: "Ticket",
                        principalColumn: "TicketID");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Ticket_UserID",
                table: "Ticket",
                column: "UserID");

            migrationBuilder.CreateIndex(
                name: "IX_TicketCombo_ComboID",
                table: "TicketCombo",
                column: "ComboID");

            migrationBuilder.CreateIndex(
                name: "IX_TicketProduct_ProductVarientID",
                table: "TicketProduct",
                column: "ProductVarientID");

            migrationBuilder.CreateIndex(
                name: "IX_TicketProduct_TicketID1",
                table: "TicketProduct",
                column: "TicketID1");

            migrationBuilder.AddForeignKey(
                name: "FK_Ticket_User_UserID",
                table: "Ticket",
                column: "UserID",
                principalTable: "User",
                principalColumn: "UserID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}

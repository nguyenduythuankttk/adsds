using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackEnd.Migrations
{
    /// <inheritdoc />
    public partial class AddTicketUsedFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "UsedAt",
                table: "Ticket",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "UsedBy",
                table: "Ticket",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_Ticket_UsedBy",
                table: "Ticket",
                column: "UsedBy");

            migrationBuilder.AddForeignKey(
                name: "FK_Ticket_User_UsedBy",
                table: "Ticket",
                column: "UsedBy",
                principalTable: "User",
                principalColumn: "UserID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Ticket_User_UsedBy",
                table: "Ticket");

            migrationBuilder.DropIndex(
                name: "IX_Ticket_UsedBy",
                table: "Ticket");

            migrationBuilder.DropColumn(
                name: "UsedAt",
                table: "Ticket");

            migrationBuilder.DropColumn(
                name: "UsedBy",
                table: "Ticket");
        }
    }
}

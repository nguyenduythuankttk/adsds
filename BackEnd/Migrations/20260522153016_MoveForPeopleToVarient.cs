using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackEnd.Migrations
{
    /// <inheritdoc />
    public partial class MoveForPeopleToVarient : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ForPeople",
                table: "Product");

            migrationBuilder.AddColumn<int>(
                name: "ForPeople",
                table: "ProductVarient",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ForPeople",
                table: "ProductVarient");

            migrationBuilder.AddColumn<int>(
                name: "ForPeople",
                table: "Product",
                type: "int",
                nullable: true);
        }
    }
}

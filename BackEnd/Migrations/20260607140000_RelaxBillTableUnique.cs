using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackEnd.Migrations
{
    /// <inheritdoc />
    public partial class RelaxBillTableUnique : Migration
    {
        // Gỡ UNIQUE index trên Bill.TableID (quan hệ Bill↔DiningTable đổi từ 1-1 sang 1-N):
        // một bàn được phép có nhiều hóa đơn theo thời gian. Index UNIQUE cũ khiến hóa đơn
        // dine-in thứ hai trên cùng một bàn vi phạm ràng buộc → lỗi 500 khi xuất hóa đơn.
        // Phải gỡ FK trước rồi mới đổi index (MySQL yêu cầu cột FK luôn có index hỗ trợ),
        // sau đó tạo lại index thường + FK.

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bill_DiningTable_TableID",
                table: "Bill");

            migrationBuilder.DropIndex(
                name: "IX_Bill_TableID",
                table: "Bill");

            migrationBuilder.CreateIndex(
                name: "IX_Bill_TableID",
                table: "Bill",
                column: "TableID");

            migrationBuilder.AddForeignKey(
                name: "FK_Bill_DiningTable_TableID",
                table: "Bill",
                column: "TableID",
                principalTable: "DiningTable",
                principalColumn: "TableID",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Bill_DiningTable_TableID",
                table: "Bill");

            migrationBuilder.DropIndex(
                name: "IX_Bill_TableID",
                table: "Bill");

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
        }
    }
}

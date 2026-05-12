using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackEnd.Migrations
{
    /// <inheritdoc />
    public partial class AddProcessingLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Status",
                table: "POApproval",
                newName: "POStatus");

            migrationBuilder.AddColumn<string>(
                name: "CancelledReason",
                table: "POApproval",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<Guid>(
                name: "GoodsReceiptID",
                table: "InventoryBatch",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)")
                .OldAnnotation("Relational:Collation", "ascii_general_ci");

            migrationBuilder.AddColumn<int>(
                name: "BatchType",
                table: "InventoryBatch",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "ProcessingLog",
                columns: table => new
                {
                    ProcessingID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    EmployeeID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    ProcessedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Note = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessingLog", x => x.ProcessingID);
                    table.ForeignKey(
                        name: "FK_ProcessingLog_User_EmployeeID",
                        column: x => x.EmployeeID,
                        principalTable: "User",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ProcessingDetail",
                columns: table => new
                {
                    ProcessingID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    SourceBatchID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    InputKg = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    OutputIngredientID = table.Column<int>(type: "int", nullable: false),
                    OutputPieces = table.Column<int>(type: "int", nullable: false),
                    BagCount = table.Column<int>(type: "int", nullable: false),
                    PiecesPerBag = table.Column<int>(type: "int", nullable: false),
                    WasteNote = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    OutputBatchID = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProcessingDetail", x => new { x.ProcessingID, x.SourceBatchID });
                    table.ForeignKey(
                        name: "FK_ProcessingDetail_Ingredient_OutputIngredientID",
                        column: x => x.OutputIngredientID,
                        principalTable: "Ingredient",
                        principalColumn: "IngredientID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProcessingDetail_InventoryBatch_OutputBatchID",
                        column: x => x.OutputBatchID,
                        principalTable: "InventoryBatch",
                        principalColumn: "BatchID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProcessingDetail_InventoryBatch_SourceBatchID",
                        column: x => x.SourceBatchID,
                        principalTable: "InventoryBatch",
                        principalColumn: "BatchID",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ProcessingDetail_ProcessingLog_ProcessingID",
                        column: x => x.ProcessingID,
                        principalTable: "ProcessingLog",
                        principalColumn: "ProcessingID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessingDetail_OutputBatchID",
                table: "ProcessingDetail",
                column: "OutputBatchID");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessingDetail_OutputIngredientID",
                table: "ProcessingDetail",
                column: "OutputIngredientID");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessingDetail_SourceBatchID",
                table: "ProcessingDetail",
                column: "SourceBatchID");

            migrationBuilder.CreateIndex(
                name: "IX_ProcessingLog_EmployeeID",
                table: "ProcessingLog",
                column: "EmployeeID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ProcessingDetail");

            migrationBuilder.DropTable(
                name: "ProcessingLog");

            migrationBuilder.DropColumn(
                name: "CancelledReason",
                table: "POApproval");

            migrationBuilder.DropColumn(
                name: "BatchType",
                table: "InventoryBatch");

            migrationBuilder.RenameColumn(
                name: "POStatus",
                table: "POApproval",
                newName: "Status");

            migrationBuilder.AlterColumn<Guid>(
                name: "GoodsReceiptID",
                table: "InventoryBatch",
                type: "char(36)",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)",
                oldNullable: true)
                .OldAnnotation("Relational:Collation", "ascii_general_ci");
        }
    }
}

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
            // Drop FK only if it exists
            migrationBuilder.Sql(@"
                SET @fk := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'DeliveryInfo'
                    AND CONSTRAINT_NAME = 'FK_DeliveryInfo_Bill_BillID' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
                SET @sql := IF(@fk > 0,
                    'ALTER TABLE DeliveryInfo DROP FOREIGN KEY FK_DeliveryInfo_Bill_BillID',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
            ");

            // Drop index only if it exists
            migrationBuilder.Sql(@"
                SET @idx := (SELECT COUNT(*) FROM information_schema.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'DeliveryInfo'
                    AND INDEX_NAME = 'IX_DeliveryInfo_BillID');
                SET @sql := IF(@idx > 0,
                    'ALTER TABLE DeliveryInfo DROP INDEX IX_DeliveryInfo_BillID',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
            ");

            // Add IsActive only if it does not exist
            migrationBuilder.Sql(@"
                SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ProductVarient'
                    AND COLUMN_NAME = 'IsActive');
                SET @sql := IF(@col = 0,
                    'ALTER TABLE ProductVarient ADD IsActive tinyint(1) NOT NULL DEFAULT FALSE',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
            ");

            migrationBuilder.AlterColumn<Guid>(
                name: "EmployeeID",
                table: "DeliveryLog",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci",
                oldClrType: typeof(Guid),
                oldType: "char(36)")
                .OldAnnotation("Relational:Collation", "ascii_general_ci");

            // Add AddressID to Bill only if it does not exist
            migrationBuilder.Sql(@"
                SET @col := (SELECT COUNT(*) FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Bill'
                    AND COLUMN_NAME = 'AddressID');
                SET @sql := IF(@col = 0,
                    'ALTER TABLE Bill ADD COLUMN AddressID char(36) NULL COLLATE ascii_general_ci',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
            ");

            // Create IX_DeliveryInfo_BillID unique index only if not exists
            migrationBuilder.Sql(@"
                SET @idx := (SELECT COUNT(*) FROM information_schema.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'DeliveryInfo'
                    AND INDEX_NAME = 'IX_DeliveryInfo_BillID');
                SET @sql := IF(@idx = 0,
                    'ALTER TABLE DeliveryInfo ADD UNIQUE INDEX IX_DeliveryInfo_BillID (BillID)',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
            ");

            // Create IX_Bill_AddressID only if not exists
            migrationBuilder.Sql(@"
                SET @idx := (SELECT COUNT(*) FROM information_schema.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Bill'
                    AND INDEX_NAME = 'IX_Bill_AddressID');
                SET @sql := IF(@idx = 0,
                    'ALTER TABLE Bill ADD INDEX IX_Bill_AddressID (AddressID)',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
            ");

            // Add FK_Bill_Address_AddressID only if not exists
            migrationBuilder.Sql(@"
                SET @fk := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'Bill'
                    AND CONSTRAINT_NAME = 'FK_Bill_Address_AddressID' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
                SET @sql := IF(@fk = 0,
                    'ALTER TABLE Bill ADD CONSTRAINT FK_Bill_Address_AddressID FOREIGN KEY (AddressID) REFERENCES Address (AddressID)',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
            ");

            migrationBuilder.AddForeignKey(
                name: "FK_DeliveryInfo_Bill_BillID",
                table: "DeliveryInfo",
                column: "BillID",
                principalTable: "Bill",
                principalColumn: "BillID",
                onDelete: ReferentialAction.Cascade);

            // Drop FK_DeliveryLog_User_EmployeeID only if it exists (already created in akd migration)
            migrationBuilder.Sql(@"
                SET @fk := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'DeliveryLog'
                    AND CONSTRAINT_NAME = 'FK_DeliveryLog_User_EmployeeID' AND CONSTRAINT_TYPE = 'FOREIGN KEY');
                SET @sql := IF(@fk > 0,
                    'ALTER TABLE DeliveryLog DROP FOREIGN KEY FK_DeliveryLog_User_EmployeeID',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
            ");

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
                name: "FK_DeliveryInfo_Bill_BillID",
                table: "DeliveryInfo");

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
                name: "FK_DeliveryInfo_Bill_BillID",
                table: "DeliveryInfo",
                column: "BillID",
                principalTable: "Bill",
                principalColumn: "BillID",
                onDelete: ReferentialAction.Cascade);

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

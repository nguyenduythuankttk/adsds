using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackEnd.Migrations
{
    /// <inheritdoc />
    public partial class fixs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Use IF EXISTS so this migration is safe whether or not the column
            // was already absent (e.g. schema created via EnsureCreated).
            migrationBuilder.Sql(@"
                SET @fk_exists = (
                    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
                    WHERE CONSTRAINT_SCHEMA = DATABASE()
                      AND TABLE_NAME        = 'Ticket'
                      AND CONSTRAINT_NAME   = 'FK_Ticket_User_UserID'
                      AND CONSTRAINT_TYPE   = 'FOREIGN KEY'
                );
                SET @sql = IF(@fk_exists > 0,
                    'ALTER TABLE `Ticket` DROP FOREIGN KEY `FK_Ticket_User_UserID`',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
            ");

            migrationBuilder.Sql(@"
                SET @ix_exists = (
                    SELECT COUNT(*) FROM information_schema.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME   = 'Ticket'
                      AND INDEX_NAME   = 'IX_Ticket_UserID'
                );
                SET @sql = IF(@ix_exists > 0,
                    'DROP INDEX `IX_Ticket_UserID` ON `Ticket`',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
            ");

            migrationBuilder.Sql(@"
                SET @col_exists = (
                    SELECT COUNT(*) FROM information_schema.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME   = 'Ticket'
                      AND COLUMN_NAME  = 'UserID'
                );
                SET @sql = IF(@col_exists > 0,
                    'ALTER TABLE `Ticket` DROP COLUMN `UserID`',
                    'SELECT 1');
                PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "UserID",
                table: "Ticket",
                type: "char(36)",
                nullable: true,
                collation: "ascii_general_ci");

            migrationBuilder.CreateIndex(
                name: "IX_Ticket_UserID",
                table: "Ticket",
                column: "UserID");

            migrationBuilder.AddForeignKey(
                name: "FK_Ticket_User_UserID",
                table: "Ticket",
                column: "UserID",
                principalTable: "User",
                principalColumn: "UserID");
        }
    }
}

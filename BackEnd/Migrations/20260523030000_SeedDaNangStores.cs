using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackEnd.Migrations
{
    /// <inheritdoc />
    public partial class SeedDaNangStores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Insert stores only if they don't already exist (check by email)
            migrationBuilder.Sql(@"
                INSERT INTO `Store` (`StoreName`, `Phone`, `Email`, `TotalReviews`, `TotalPoints`, `SeatingCapacity`)
                SELECT 'Chôn Libi Hải Châu', '02363812345', 'haichau@chonlibi.vn', 0, 0, 60
                FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `Store` WHERE `Email` = 'haichau@chonlibi.vn');

                INSERT INTO `Store` (`StoreName`, `Phone`, `Email`, `TotalReviews`, `TotalPoints`, `SeatingCapacity`)
                SELECT 'Chôn Libi Thanh Khê', '02363812346', 'thanhkhe@chonlibi.vn', 0, 0, 50
                FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `Store` WHERE `Email` = 'thanhkhe@chonlibi.vn');

                INSERT INTO `Store` (`StoreName`, `Phone`, `Email`, `TotalReviews`, `TotalPoints`, `SeatingCapacity`)
                SELECT 'Chôn Libi Ngũ Hành Sơn', '02363812347', 'nhs@chonlibi.vn', 0, 0, 70
                FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `Store` WHERE `Email` = 'nhs@chonlibi.vn');

                INSERT INTO `Store` (`StoreName`, `Phone`, `Email`, `TotalReviews`, `TotalPoints`, `SeatingCapacity`)
                SELECT 'Chôn Libi Liên Chiểu', '02363812348', 'lienchieus@chonlibi.vn', 0, 0, 55
                FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `Store` WHERE `Email` = 'lienchieus@chonlibi.vn');
            ");

            // Insert addresses linked to the stores above (lookup StoreID by email)
            migrationBuilder.Sql(@"
                INSERT IGNORE INTO `Address` (`AddressID`, `StreetAddress`, `District`, `Province`, `StoreID`, `Latitude`, `Longitude`, `IsDefault`)
                SELECT 'b1a2e3f4-c5d6-7890-aaaa-111111111111', '74 Bạch Đằng', 'Hải Châu I, Hải Châu', 'Đà Nẵng',
                       s.`StoreID`, 16.0700, 108.2239, 0
                FROM `Store` s WHERE s.`Email` = 'haichau@chonlibi.vn';

                INSERT IGNORE INTO `Address` (`AddressID`, `StreetAddress`, `District`, `Province`, `StoreID`, `Latitude`, `Longitude`, `IsDefault`)
                SELECT 'b1a2e3f4-c5d6-7890-aaaa-222222222222', '18 Ông Ích Khiêm', 'Thanh Khê Đông, Thanh Khê', 'Đà Nẵng',
                       s.`StoreID`, 16.0657, 108.1947, 0
                FROM `Store` s WHERE s.`Email` = 'thanhkhe@chonlibi.vn';

                INSERT IGNORE INTO `Address` (`AddressID`, `StreetAddress`, `District`, `Province`, `StoreID`, `Latitude`, `Longitude`, `IsDefault`)
                SELECT 'b1a2e3f4-c5d6-7890-aaaa-333333333333', '23 Lê Văn Hiến', 'Khuê Mỹ, Ngũ Hành Sơn', 'Đà Nẵng',
                       s.`StoreID`, 16.0027, 108.2592, 0
                FROM `Store` s WHERE s.`Email` = 'nhs@chonlibi.vn';

                INSERT IGNORE INTO `Address` (`AddressID`, `StreetAddress`, `District`, `Province`, `StoreID`, `Latitude`, `Longitude`, `IsDefault`)
                SELECT 'b1a2e3f4-c5d6-7890-aaaa-444444444444', '57 Tôn Đức Thắng', 'Hòa Khánh Nam, Liên Chiểu', 'Đà Nẵng',
                       s.`StoreID`, 16.0897, 108.1472, 0
                FROM `Store` s WHERE s.`Email` = 'lienchieus@chonlibi.vn';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                DELETE FROM `Address` WHERE `AddressID` IN (
                    'b1a2e3f4-c5d6-7890-aaaa-111111111111',
                    'b1a2e3f4-c5d6-7890-aaaa-222222222222',
                    'b1a2e3f4-c5d6-7890-aaaa-333333333333',
                    'b1a2e3f4-c5d6-7890-aaaa-444444444444'
                );
                DELETE FROM `Store` WHERE `Email` IN (
                    'haichau@chonlibi.vn',
                    'thanhkhe@chonlibi.vn',
                    'nhs@chonlibi.vn',
                    'lienchieus@chonlibi.vn'
                );
            ");
        }
    }
}

-- ================================================================
-- FIX SCHEMA: Bổ sung cột và bảng bị thiếu do migration rỗng
--
-- Cách dùng:
--   1. Mở MySQL Workbench (hoặc DBeaver)
--   2. Chạy: USE DBjolibi;
--   3. Chạy toàn bộ file này
-- ================================================================
USE DBjolibi;
SET NAMES utf8mb4;

-- ----------------------------------------------------------------
-- FIX 1: Thêm cột IsActive vào ProductVarient
-- (migration 20260516060829_isV bị rỗng → cột chưa tồn tại)
-- Lỗi: product/get-all trả về 500 → menu không load được
-- ----------------------------------------------------------------
ALTER TABLE `ProductVarient`
    ADD COLUMN IF NOT EXISTS `IsActive` tinyint(1) NOT NULL DEFAULT 1;

-- ----------------------------------------------------------------
-- FIX 2: Tạo bảng GuestCustomer
-- (migration 20260527053016_AddGuestCustomer bị rỗng → bảng chưa tồn tại)
-- Lỗi: user/lookup-by-phone trả về 500
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `GuestCustomer` (
    `Phone`       varchar(10)  NOT NULL,
    `Name`        varchar(100) NULL,
    `LastBillAt`  datetime(6)  NOT NULL,
    PRIMARY KEY (`Phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ----------------------------------------------------------------
-- FIX 3: Đánh dấu 2 migration là đã chạy trong EF Core
-- (để app không cố chạy lại chúng khi restart)
-- ----------------------------------------------------------------
INSERT IGNORE INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES
    ('20260516060829_isV',                 '9.0.0'),
    ('20260527053016_AddGuestCustomer',    '9.0.0');

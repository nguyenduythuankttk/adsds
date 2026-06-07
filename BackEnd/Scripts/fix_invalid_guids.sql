-- ================================================================
-- FIX: invalid-hex Guid IDs in existing DB rows
--
-- Triệu chứng:
--   System.FormatException: Could not parse CHAR(36) value as Guid:
--     del00001-0000-0000-0000-000000000001
--   tại /api/pbl3/delivery/get-all (và mọi endpoint khác đụng phải hàng dữ liệu lỗi).
--
-- Nguyên nhân:
--   seed_mysql.txt cũ dùng prefix `del`, `bil`, `usr`, `emp`, ... — các ký tự
--   như l, i, s, r, u, m, p, t, g, h, o KHÔNG phải hex. MySQL chấp nhận lưu
--   (vì cột là CHAR(36)), nhưng MySqlConnector throw khi parse sang Guid.
--
-- Script này dùng INFORMATION_SCHEMA để bỏ qua cột không tồn tại — chạy được
-- trên mọi state migration trung gian. Idempotent: chạy lại không sao.
-- ================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Helper: chỉ chạy REPLACE nếu cột tồn tại. Bỏ qua nếu không.
DROP PROCEDURE IF EXISTS pbl3_safe_replace;
DELIMITER $$
CREATE PROCEDURE pbl3_safe_replace(
    IN p_table   VARCHAR(64),
    IN p_column  VARCHAR(64),
    IN p_old     VARCHAR(64),
    IN p_new     VARCHAR(64)
)
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = p_table
          AND COLUMN_NAME  = p_column
    ) THEN
        SET @sql := CONCAT(
            'UPDATE `', p_table, '` SET `', p_column, '` = REPLACE(`', p_column, '`, ''',
            p_old, ''', ''', p_new, ''') WHERE `', p_column, '` IS NOT NULL'
        );
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END$$
DELIMITER ;

-- ---- User / Employee --------------------------------------------
CALL pbl3_safe_replace('User',                  'UserID',     'usr00001-', '05c00001-');
CALL pbl3_safe_replace('User',                  'UserID',     'emp00001-', 'eab00001-');
CALL pbl3_safe_replace('Address',               'UserID',     'usr00001-', '05c00001-');
CALL pbl3_safe_replace('UserAddress',           'UserID',     'usr00001-', '05c00001-');
CALL pbl3_safe_replace('EmailVerificationToken','UserID',     'usr00001-', '05c00001-');

-- ---- Ticket -----------------------------------------------------
CALL pbl3_safe_replace('Ticket',                'TicketID',   'tic00001-', '71c00001-');
CALL pbl3_safe_replace('Ticket',                'UserID',     'usr00001-', '05c00001-');
CALL pbl3_safe_replace('Ticket',                'UsedBy',     'usr00001-', '05c00001-');
CALL pbl3_safe_replace('TicketUser',            'TicketID',   'tic00001-', '71c00001-');
CALL pbl3_safe_replace('TicketUser',            'UserID',     'usr00001-', '05c00001-');

-- ---- Shift ------------------------------------------------------
CALL pbl3_safe_replace('Shift',                 'ShiftID',    'shf00001-', '5cf00001-');
CALL pbl3_safe_replace('Shift',                 'EmployeeID', 'emp00001-', 'eab00001-');

-- ---- Purchase Order chain --------------------------------------
CALL pbl3_safe_replace('PurchaseOrder',         'POID',         'po000001-', 'b0000001-');
CALL pbl3_safe_replace('PurchaseOrder',         'PurchaseOrderID', 'po000001-', 'b0000001-');
CALL pbl3_safe_replace('PODetail',              'POID',         'po000001-', 'b0000001-');
CALL pbl3_safe_replace('PODetail',              'PurchaseOrderID', 'po000001-', 'b0000001-');
CALL pbl3_safe_replace('POApproval',            'POApprovalID', 'poa00001-', 'b0a00001-');
CALL pbl3_safe_replace('POApproval',            'POID',         'po000001-', 'b0000001-');
CALL pbl3_safe_replace('POApproval',            'PurchaseOrderID', 'po000001-', 'b0000001-');
CALL pbl3_safe_replace('POApproval',            'EmployeeID',   'emp00001-', 'eab00001-');

-- ---- Receipt chain ---------------------------------------------
CALL pbl3_safe_replace('Receipt',               'ReceiptID',    'rec00001-', 'cec00001-');
CALL pbl3_safe_replace('Receipt',               'EmployeeID',   'emp00001-', 'eab00001-');
CALL pbl3_safe_replace('Receipt',               'POID',         'po000001-', 'b0000001-');
CALL pbl3_safe_replace('Receipt',               'PurchaseOrderID', 'po000001-', 'b0000001-');
CALL pbl3_safe_replace('ReceiptDetail',         'GoodsReceiptID','rec00001-', 'cec00001-');
CALL pbl3_safe_replace('ReceiptDetail',         'ReceiptID',    'rec00001-', 'cec00001-');
CALL pbl3_safe_replace('ReceiptChange',         'ReceiptChangeID','rcg00001-', 'cc900001-');
CALL pbl3_safe_replace('ReceiptChange',         'ReceiptID',    'rec00001-', 'cec00001-');
CALL pbl3_safe_replace('ReceiptChange',         'EmployeeID',   'emp00001-', 'eab00001-');

-- ---- Inventory / Stock -----------------------------------------
CALL pbl3_safe_replace('InventoryBatch',        'BatchID',      'bat00001-', 'ba700001-');
CALL pbl3_safe_replace('InventoryBatch',        'GoodsReceiptID','rec00001-', 'cec00001-');
CALL pbl3_safe_replace('InventoryBatch',        'ReceiptDetailGoodsReceiptID','rec00001-','cec00001-');
CALL pbl3_safe_replace('StockMovement',         'StockMovementID','stm00001-','57a00001-');
CALL pbl3_safe_replace('StockMovement',         'BatchID',      'bat00001-', 'ba700001-');
CALL pbl3_safe_replace('StockMovement',         'EmployeeID',   'emp00001-', 'eab00001-');
-- Lô sơ chế (Processed) seed bằng prefix `proc` (p,r,o không hex) — giữ tham chiếu
-- OutputBatchID ⇄ InventoryBatch.BatchID nhất quán.
CALL pbl3_safe_replace('InventoryBatch',        'BatchID',      'proc',      'b40c');
CALL pbl3_safe_replace('ProcessingDetail',      'OutputBatchID','proc',      'b40c');
CALL pbl3_safe_replace('StockMovement',         'BatchID',      'proc',      'b40c');

-- ---- Processing chain ------------------------------------------
-- ProcessingID seed bằng prefix `pl1` (p,l không hex).
CALL pbl3_safe_replace('ProcessingLog',         'ProcessingID', 'pl1',       'fa1');
CALL pbl3_safe_replace('ProcessingDetail',      'ProcessingID', 'pl1',       'fa1');

-- ---- Bill chain ------------------------------------------------
CALL pbl3_safe_replace('Bill',                  'BillID',       'bil00001-', 'b1100001-');
CALL pbl3_safe_replace('Bill',                  'UserID',       'usr00001-', '05c00001-');
CALL pbl3_safe_replace('Bill',                  'TicketID',     'tic00001-', '71c00001-');
CALL pbl3_safe_replace('Bill',                  'DeliveryInfoID','del00001-', 'de100001-');
CALL pbl3_safe_replace('BillDetail',            'BillID',       'bil00001-', 'b1100001-');
CALL pbl3_safe_replace('BillChange',            'BillChangeID', 'bch00001-', 'bcc00001-');
CALL pbl3_safe_replace('BillChange',            'BillID',       'bil00001-', 'b1100001-');
CALL pbl3_safe_replace('BillChange',            'EmployeeID',   'emp00001-', 'eab00001-');

-- ---- Delivery --------------------------------------------------
CALL pbl3_safe_replace('DeliveryInfo',          'DeliveryID',   'del00001-', 'de100001-');
CALL pbl3_safe_replace('DeliveryInfo',          'BillID',       'bil00001-', 'b1100001-');
CALL pbl3_safe_replace('DeliveryInfo',          'UserID',       'usr00001-', '05c00001-');
-- `dlg` → `d19` bao trùm cả dlg00001 lẫn dlg00002 (bản fix cũ chỉ map dlg00001-).
CALL pbl3_safe_replace('DeliveryLog',           'LogID',        'dlg',       'd19');
CALL pbl3_safe_replace('DeliveryLog',           'DeliveryID',   'del00001-', 'de100001-');
CALL pbl3_safe_replace('DeliveryLog',           'EmployeeID',   'emp00001-', 'eab00001-');

DROP PROCEDURE pbl3_safe_replace;

-- ---- Enum cũ: BatchType 'Import' → 'Raw' ------------------------
-- DB cũ lưu BatchType='Import' cho lô nhập thô; enum hiện tại chỉ còn {Raw, Processed}.
-- Khi EF đọc gặp 'Import' sẽ ném "Cannot convert string value 'Import' ... BatchType enum"
-- (HTTP 400) làm sập toàn bộ màn hình Kho. 'Import' tương đương 'Raw' (lô nhập từ NCC).
UPDATE InventoryBatch SET BatchType = 'Raw' WHERE BatchType = 'Import';

SET FOREIGN_KEY_CHECKS = 1;

-- ---- Sanity check: tất cả phải = 0 -----------------------------
SELECT 'User.UserID broken' AS what,
       COUNT(*) AS bad_rows
FROM `User`
WHERE UserID NOT REGEXP '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
UNION ALL
SELECT 'DeliveryInfo.DeliveryID broken',
       COUNT(*)
FROM DeliveryInfo
WHERE DeliveryID NOT REGEXP '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

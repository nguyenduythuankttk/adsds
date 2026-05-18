-- ================================================================
-- JOLIBEE - SEED SƠ CHẾ (Processing Workflow)
-- Bổ sung: ProcessingLog + ProcessingDetail + InventoryBatch(Processed)
--
-- Yêu cầu: đã chạy seed_full.sql trước
--
-- Luồng dữ liệu:
--   Raw batch (kg/gram)  →  ProcessingLog + ProcessingDetail
--                        →  Processed batch (Unit)
--                        →  StockMovement ×2 (trừ Raw, cộng Processed)
-- ================================================================
USE DBjolibi;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------
-- XOÁ DỮ LIỆU SƠ CHẾ CŨ (chạy lại an toàn)
-- ----------------------------------------------------------------
DELETE FROM ProcessingDetail;
DELETE FROM ProcessingLog;
DELETE FROM StockMovement  WHERE MovementType = 'Processing';
DELETE FROM InventoryBatch WHERE BatchType    = 1;
DELETE FROM Receipe        WHERE ProductVarientID IN (7, 8, 9, 10, 11, 12);
DELETE FROM Ingredient     WHERE IngredientID  >= 11;

SET FOREIGN_KEY_CHECKS = 1;


-- ================================================================
-- A. INGREDIENT — 8 nguyên liệu đã qua sơ chế (đơn vị: Unit)
--    Mỗi loại là kết quả của 1 nguyên liệu thô tương ứng
-- ================================================================
INSERT INTO Ingredient (IngredientID, IngredientName, IngredientUnit, CostPerUnit, DeletedAt)
VALUES
  (11, 'Miếng gà rán',    'Unit', 0, NULL),   -- từ Gà nguyên con  (ID 8, Kilogram)
  (12, 'Phần thịt bò',    'Unit', 0, NULL),   -- từ Thịt bò        (ID 2, Gram)
  (13, 'Phần thịt heo',   'Unit', 0, NULL),   -- từ Thịt heo       (ID 7, Gram)
  (14, 'Phần cà phê đặc', 'Unit', 0, NULL),   -- từ Cà phê rang    (ID 3, Gram)
  (15, 'Phần trà xanh',   'Unit', 0, NULL),   -- từ Trà xanh       (ID 4, Gram)
  (16, 'Phần sữa',        'Unit', 0, NULL),   -- từ Sữa tươi       (ID 5, Liter)
  (17, 'Khẩu phần phở',   'Unit', 0, NULL),   -- từ Bánh phở       (ID 1, Gram)
  (18, 'Phần đường',      'Unit', 0, NULL);   -- từ Đường          (ID 10, Kilogram)


-- ================================================================
-- B. RECEIPE — Công thức cho sản phẩm dùng nguyên liệu đã sơ chế
--    QtyBeforeProcess = 0   (batch đã là Processed, bỏ qua bước này)
--    QtyAfterProcess  = số miếng/phần trừ khỏi kho khi bán 1 sản phẩm
-- ================================================================
INSERT INTO Receipe (IngredientID, ProductVarientID, QtyBeforeProcess, QtyAfterProcess)
VALUES
  -- Gà Rán (Product 4, Variants 10-12)
  (11, 10, 0, 2),   -- Gà Rán S : 2 miếng gà rán
  (11, 11, 0, 3),   -- Gà Rán M : 3 miếng gà rán
  (11, 12, 0, 4),   -- Gà Rán L : 4 miếng gà rán
  -- Cơm Tấm Sườn (Product 3, Variants 7-9)
  (13,  7, 0, 1),   -- Cơm Tấm S : 1 phần thịt heo
  (13,  8, 0, 2),   -- Cơm Tấm M : 2 phần thịt heo
  (13,  9, 0, 3);   -- Cơm Tấm L : 3 phần thịt heo


-- ================================================================
-- C. PROCESSINGLOG (5 phiếu sơ chế — 1 phiếu / chi nhánh)
-- ================================================================
INSERT INTO ProcessingLog (ProcessingID, EmployeeID, ProcessedAt, Note, DeletedAt)
VALUES
  ('prl00001-0000-0000-0000-000000000001', 'emp10001-0000-0000-0000-000000000003', '2026-05-11 08:00:00', 'Sơ chế buổi sáng — Chi nhánh Quận 5',      NULL),
  ('prl00001-0000-0000-0000-000000000002', 'emp20001-0000-0000-0000-000000000003', '2026-05-11 08:00:00', 'Sơ chế buổi sáng — Chi nhánh Quận 1',      NULL),
  ('prl00001-0000-0000-0000-000000000003', 'emp30001-0000-0000-0000-000000000003', '2026-05-11 08:00:00', 'Sơ chế buổi sáng — Chi nhánh Quận 3',      NULL),
  ('prl00001-0000-0000-0000-000000000004', 'emp40001-0000-0000-0000-000000000003', '2026-05-11 08:00:00', 'Sơ chế buổi sáng — Chi nhánh Bình Thạnh', NULL),
  ('prl00001-0000-0000-0000-000000000005', 'emp50001-0000-0000-0000-000000000003', '2026-05-11 08:00:00', 'Sơ chế buổi sáng — Chi nhánh Gò Vấp',     NULL);


-- ================================================================
-- D. INVENTORYBATCH — Batch thành phẩm (BatchType = 1 = Processed)
--    15 batches — 3 per ProcessingLog (tương ứng 3 ProcessingDetail)
--
--    UnitCost = (InputQty × SourceBatch.UnitCost) / OutputPieces
--    GoodsReceiptID = NULL  (batch này từ sơ chế, không từ phiếu nhập)
-- ================================================================
INSERT INTO InventoryBatch (
  BatchID, WarehouseID,
  ImportDate, Exp, Mfd,
  QuantityOriginal, QuantityOnHand, Status, UnitCost,
  UpdatedAt, BatchCode, Note,
  IngredientID, GoodsReceiptID,
  ReceiptDetailGoodsReceiptID, ReceiptDetailIngredientID,
  BatchType
) VALUES

-- ---- ProcessingLog 1 (kho 1 — Quận 5) ----
-- bat10001-001: 500g bánh phở  → 5 khẩu phần phở,  UnitCost = 500×50/5   = 5 000
('pbt10001-0000-0000-0000-000000000001', 1, '2026-05-11 08:30:00', '2026-11-11', '2026-05-11',   5,   5, 'Available',  5000, NULL, 'BTP-PHO-20260511',  NULL, 17, NULL, NULL, NULL, 1),
-- bat10001-002: 300g thịt bò   → 3 phần thịt bò,   UnitCost = 300×200/3  = 20 000
('pbt10001-0000-0000-0000-000000000002', 1, '2026-05-11 08:30:00', '2026-05-25', '2026-05-11',   3,   3, 'Available', 20000, NULL, 'BTP-BO-20260511',   NULL, 12, NULL, NULL, NULL, 1),
-- bat10001-003: 200g cà phê rang → 10 phần cà phê, UnitCost = 200×150/10 = 3 000
('pbt10001-0000-0000-0000-000000000003', 1, '2026-05-11 08:30:00', '2026-11-11', '2026-05-11',  10,  10, 'Available',  3000, NULL, 'BTP-CF-20260511',   NULL, 14, NULL, NULL, NULL, 1),

-- ---- ProcessingLog 2 (kho 2 — Quận 1) ----
-- bat20001-001: 300g trà xanh  → 15 phần trà,      UnitCost = 300×100/15 = 2 000
('pbt20001-0000-0000-0000-000000000001', 2, '2026-05-11 08:30:00', '2026-11-11', '2026-05-11',  15,  15, 'Available',  2000, NULL, 'BTP-TRA-20260511',  NULL, 15, NULL, NULL, NULL, 1),
-- bat20001-002: 2L sữa tươi    → 16 phần sữa,      UnitCost = 2×30000/16 = 3 750
('pbt20001-0000-0000-0000-000000000002', 2, '2026-05-11 08:30:00', '2026-05-20', '2026-05-11',  16,  16, 'Available',  3750, NULL, 'BTP-SUA-20260511',  NULL, 16, NULL, NULL, NULL, 1),
-- bat20001-003: 10 bánh mì     → 10 phần bánh mì,  UnitCost = 10×3000/10 = 3 000
('pbt20001-0000-0000-0000-000000000003', 2, '2026-05-11 08:30:00', '2026-05-18', '2026-05-11',  10,  10, 'Available',  3000, NULL, 'BTP-BM-20260511',   NULL,  6, NULL, NULL, NULL, 1),

-- ---- ProcessingLog 3 (kho 3 — Quận 3) ----
-- bat30001-001: 400g thịt heo  → 4 phần thịt heo,  UnitCost = 400×120/4  = 12 000
('pbt30001-0000-0000-0000-000000000001', 3, '2026-05-11 08:30:00', '2026-05-25', '2026-05-11',   4,   4, 'Available', 12000, NULL, 'BTP-HEO-20260511',  NULL, 13, NULL, NULL, NULL, 1),
-- bat30001-002: 2kg gà nguyên con → 14 miếng gà,   UnitCost = 2×80000/14 ≈ 11 429
('pbt30001-0000-0000-0000-000000000002', 3, '2026-05-11 08:30:00', '2026-05-25', '2026-05-11',  14,  14, 'Available', 11429, NULL, 'BTP-GA-20260511',   NULL, 11, NULL, NULL, NULL, 1),
-- bat30001-003: 20 quả cam     → 20 ly nước cam,   UnitCost = 20×5000/20 = 5 000
('pbt30001-0000-0000-0000-000000000003', 3, '2026-05-11 08:30:00', '2026-05-18', '2026-05-11',  20,  20, 'Available',  5000, NULL, 'BTP-CAM-20260511',  NULL,  9, NULL, NULL, NULL, 1),

-- ---- ProcessingLog 4 (kho 4 — Bình Thạnh) ----
-- bat40001-001: 500g bánh phở  → 5 khẩu phần phở,  UnitCost = 5 000
('pbt40001-0000-0000-0000-000000000001', 4, '2026-05-11 08:30:00', '2026-11-11', '2026-05-11',   5,   5, 'Available',  5000, NULL, 'BTP-PHO2-20260511', NULL, 17, NULL, NULL, NULL, 1),
-- bat40001-002: 1L sữa tươi   → 8 phần sữa,        UnitCost = 1×30000/8  = 3 750
('pbt40001-0000-0000-0000-000000000002', 4, '2026-05-11 08:30:00', '2026-05-20', '2026-05-11',   8,   8, 'Available',  3750, NULL, 'BTP-SUA2-20260511', NULL, 16, NULL, NULL, NULL, 1),
-- bat40001-003: 2kg đường     → 100 phần đường,    UnitCost = 2×20000/100 = 400
('pbt40001-0000-0000-0000-000000000003', 4, '2026-05-11 08:30:00', '2027-05-11', '2026-05-11', 100, 100, 'Available',   400, NULL, 'BTP-DUO-20260511',  NULL, 18, NULL, NULL, NULL, 1),

-- ---- ProcessingLog 5 (kho 5 — Gò Vấp) ----
-- bat50001-001: 300g thịt bò   → 3 phần thịt bò,   UnitCost = 300×200/3  = 20 000
('pbt50001-0000-0000-0000-000000000001', 5, '2026-05-11 08:30:00', '2026-05-25', '2026-05-11',   3,   3, 'Available', 20000, NULL, 'BTP-BO2-20260511',  NULL, 12, NULL, NULL, NULL, 1),
-- bat50001-002: 10 bánh mì     → 10 phần bánh mì,  UnitCost = 3 000
('pbt50001-0000-0000-0000-000000000002', 5, '2026-05-11 08:30:00', '2026-05-18', '2026-05-11',  10,  10, 'Available',  3000, NULL, 'BTP-BM2-20260511',  NULL,  6, NULL, NULL, NULL, 1),
-- bat50001-003: 2kg đường     → 100 phần đường,    UnitCost = 400
('pbt50001-0000-0000-0000-000000000003', 5, '2026-05-11 08:30:00', '2027-05-11', '2026-05-11', 100, 100, 'Available',   400, NULL, 'BTP-DUO2-20260511', NULL, 18, NULL, NULL, NULL, 1);


-- ================================================================
-- E. PROCESSINGDETAIL (15 records — 3 per ProcessingLog)
--    PK composite: (ProcessingID, SourceBatchID)
--    InputKg     : lượng lấy từ batch Raw
--    OutputBatchID: batch Processed tạo ra ở bước D
-- ================================================================
INSERT INTO ProcessingDetail (
  ProcessingID, SourceBatchID,
  InputKg, OutputIngredientID, OutputPieces,
  BagCount, PiecesPerBag, WasteNote,
  OutputBatchID
) VALUES

-- ---- ProcessingLog 1 (Quận 5, kho 1) ----
('prl00001-0000-0000-0000-000000000001', 'bat10001-0000-0000-0000-000000000001',  500, 17,   5,  1,  5, NULL,              'pbt10001-0000-0000-0000-000000000001'),
('prl00001-0000-0000-0000-000000000001', 'bat10001-0000-0000-0000-000000000002',  300, 12,   3,  1,  3, NULL,              'pbt10001-0000-0000-0000-000000000002'),
('prl00001-0000-0000-0000-000000000001', 'bat10001-0000-0000-0000-000000000003',  200, 14,  10,  2,  5, NULL,              'pbt10001-0000-0000-0000-000000000003'),

-- ---- ProcessingLog 2 (Quận 1, kho 2) ----
('prl00001-0000-0000-0000-000000000002', 'bat20001-0000-0000-0000-000000000001',  300, 15,  15,  3,  5, NULL,              'pbt20001-0000-0000-0000-000000000001'),
('prl00001-0000-0000-0000-000000000002', 'bat20001-0000-0000-0000-000000000002',    2, 16,  16,  4,  4, NULL,              'pbt20001-0000-0000-0000-000000000002'),
('prl00001-0000-0000-0000-000000000002', 'bat20001-0000-0000-0000-000000000003',   10,  6,  10,  2,  5, NULL,              'pbt20001-0000-0000-0000-000000000003'),

-- ---- ProcessingLog 3 (Quận 3, kho 3) ----
('prl00001-0000-0000-0000-000000000003', 'bat30001-0000-0000-0000-000000000001',  400, 13,   4,  2,  2, NULL,              'pbt30001-0000-0000-0000-000000000001'),
('prl00001-0000-0000-0000-000000000003', 'bat30001-0000-0000-0000-000000000002',    2, 11,  14,  2,  7, 'Xương vụn ~0.1kg','pbt30001-0000-0000-0000-000000000002'),
('prl00001-0000-0000-0000-000000000003', 'bat30001-0000-0000-0000-000000000003',   20,  9,  20,  4,  5, NULL,              'pbt30001-0000-0000-0000-000000000003'),

-- ---- ProcessingLog 4 (Bình Thạnh, kho 4) ----
('prl00001-0000-0000-0000-000000000004', 'bat40001-0000-0000-0000-000000000001',  500, 17,   5,  1,  5, NULL,              'pbt40001-0000-0000-0000-000000000001'),
('prl00001-0000-0000-0000-000000000004', 'bat40001-0000-0000-0000-000000000002',    1, 16,   8,  2,  4, NULL,              'pbt40001-0000-0000-0000-000000000002'),
('prl00001-0000-0000-0000-000000000004', 'bat40001-0000-0000-0000-000000000003',    2, 18, 100, 10, 10, NULL,              'pbt40001-0000-0000-0000-000000000003'),

-- ---- ProcessingLog 5 (Gò Vấp, kho 5) ----
('prl00001-0000-0000-0000-000000000005', 'bat50001-0000-0000-0000-000000000001',  300, 12,   3,  1,  3, NULL,              'pbt50001-0000-0000-0000-000000000001'),
('prl00001-0000-0000-0000-000000000005', 'bat50001-0000-0000-0000-000000000002',   10,  6,  10,  2,  5, NULL,              'pbt50001-0000-0000-0000-000000000002'),
('prl00001-0000-0000-0000-000000000005', 'bat50001-0000-0000-0000-000000000003',    2, 18, 100, 10, 10, NULL,              'pbt50001-0000-0000-0000-000000000003');


-- ================================================================
-- F. STOCKMOVEMENT — 2 movements per ProcessingDetail = 30 records
--    #1 (prs...): trừ batch Raw    QtyChange âm   MovementType=Processing
--    #2 (pro...): cộng batch Processed QtyChange dương MovementType=Processing
-- ================================================================
INSERT INTO StockMovement (
  StockMovementID, BatchID, EmployeeID,
  QtyChange, MovementType, ReferenceType,
  TimeStamp, Reason, Note, DeleteAt
) VALUES

-- ===== ProcessingLog 1 (emp kitchen Q5) =====
-- Detail 1: 500g bánh phở → 5 khẩu phần phở
('prs00001-0000-0000-0000-000000000001', 'bat10001-0000-0000-0000-000000000001', 'emp10001-0000-0000-0000-000000000003',  -500, 'Processing', 'Manual', '2026-05-11 08:00:00', 'Sơ chế prl001: lấy 500g bánh phở',     NULL, NULL),
('pro00001-0000-0000-0000-000000000001', 'pbt10001-0000-0000-0000-000000000001', 'emp10001-0000-0000-0000-000000000003',     5, 'Processing', 'Manual', '2026-05-11 08:30:00', 'Sơ chế prl001: tạo 5 khẩu phần phở',  NULL, NULL),
-- Detail 2: 300g thịt bò → 3 phần thịt bò
('prs00001-0000-0000-0000-000000000002', 'bat10001-0000-0000-0000-000000000002', 'emp10001-0000-0000-0000-000000000003',  -300, 'Processing', 'Manual', '2026-05-11 08:00:00', 'Sơ chế prl001: lấy 300g thịt bò',      NULL, NULL),
('pro00001-0000-0000-0000-000000000002', 'pbt10001-0000-0000-0000-000000000002', 'emp10001-0000-0000-0000-000000000003',     3, 'Processing', 'Manual', '2026-05-11 08:30:00', 'Sơ chế prl001: tạo 3 phần thịt bò',   NULL, NULL),
-- Detail 3: 200g cà phê rang → 10 phần cà phê
('prs00001-0000-0000-0000-000000000003', 'bat10001-0000-0000-0000-000000000003', 'emp10001-0000-0000-0000-000000000003',  -200, 'Processing', 'Manual', '2026-05-11 08:00:00', 'Sơ chế prl001: lấy 200g cà phê rang',  NULL, NULL),
('pro00001-0000-0000-0000-000000000003', 'pbt10001-0000-0000-0000-000000000003', 'emp10001-0000-0000-0000-000000000003',    10, 'Processing', 'Manual', '2026-05-11 08:30:00', 'Sơ chế prl001: tạo 10 phần cà phê',   NULL, NULL),

-- ===== ProcessingLog 2 (emp kitchen Q1) =====
-- Detail 4: 300g trà xanh → 15 phần trà
('prs00001-0000-0000-0000-000000000004', 'bat20001-0000-0000-0000-000000000001', 'emp20001-0000-0000-0000-000000000003',  -300, 'Processing', 'Manual', '2026-05-11 08:00:00', 'Sơ chế prl002: lấy 300g trà xanh',     NULL, NULL),
('pro00001-0000-0000-0000-000000000004', 'pbt20001-0000-0000-0000-000000000001', 'emp20001-0000-0000-0000-000000000003',    15, 'Processing', 'Manual', '2026-05-11 08:30:00', 'Sơ chế prl002: tạo 15 phần trà xanh', NULL, NULL),
-- Detail 5: 2L sữa tươi → 16 phần sữa
('prs00001-0000-0000-0000-000000000005', 'bat20001-0000-0000-0000-000000000002', 'emp20001-0000-0000-0000-000000000003',    -2, 'Processing', 'Manual', '2026-05-11 08:00:00', 'Sơ chế prl002: lấy 2L sữa tươi',       NULL, NULL),
('pro00001-0000-0000-0000-000000000005', 'pbt20001-0000-0000-0000-000000000002', 'emp20001-0000-0000-0000-000000000003',    16, 'Processing', 'Manual', '2026-05-11 08:30:00', 'Sơ chế prl002: tạo 16 phần sữa',      NULL, NULL),
-- Detail 6: 10 bánh mì → 10 phần bánh mì
('prs00001-0000-0000-0000-000000000006', 'bat20001-0000-0000-0000-000000000003', 'emp20001-0000-0000-0000-000000000003',   -10, 'Processing', 'Manual', '2026-05-11 08:00:00', 'Sơ chế prl002: lấy 10 bánh mì',        NULL, NULL),
('pro00001-0000-0000-0000-000000000006', 'pbt20001-0000-0000-0000-000000000003', 'emp20001-0000-0000-0000-000000000003',    10, 'Processing', 'Manual', '2026-05-11 08:30:00', 'Sơ chế prl002: tạo 10 phần bánh mì',  NULL, NULL),

-- ===== ProcessingLog 3 (emp kitchen Q3) =====
-- Detail 7: 400g thịt heo → 4 phần thịt heo
('prs00001-0000-0000-0000-000000000007', 'bat30001-0000-0000-0000-000000000001', 'emp30001-0000-0000-0000-000000000003',  -400, 'Processing', 'Manual', '2026-05-11 08:00:00', 'Sơ chế prl003: lấy 400g thịt heo',     NULL, NULL),
('pro00001-0000-0000-0000-000000000007', 'pbt30001-0000-0000-0000-000000000001', 'emp30001-0000-0000-0000-000000000003',     4, 'Processing', 'Manual', '2026-05-11 08:30:00', 'Sơ chế prl003: tạo 4 phần thịt heo',  NULL, NULL),
-- Detail 8: 2kg gà nguyên con → 14 miếng gà rán
('prs00001-0000-0000-0000-000000000008', 'bat30001-0000-0000-0000-000000000002', 'emp30001-0000-0000-0000-000000000003',    -2, 'Processing', 'Manual', '2026-05-11 08:00:00', 'Sơ chế prl003: lấy 2kg gà nguyên con', NULL, NULL),
('pro00001-0000-0000-0000-000000000008', 'pbt30001-0000-0000-0000-000000000002', 'emp30001-0000-0000-0000-000000000003',    14, 'Processing', 'Manual', '2026-05-11 08:30:00', 'Sơ chế prl003: tạo 14 miếng gà rán',  NULL, NULL),
-- Detail 9: 20 quả cam → 20 ly nước cam
('prs00001-0000-0000-0000-000000000009', 'bat30001-0000-0000-0000-000000000003', 'emp30001-0000-0000-0000-000000000003',   -20, 'Processing', 'Manual', '2026-05-11 08:00:00', 'Sơ chế prl003: lấy 20 quả cam tươi',   NULL, NULL),
('pro00001-0000-0000-0000-000000000009', 'pbt30001-0000-0000-0000-000000000003', 'emp30001-0000-0000-0000-000000000003',    20, 'Processing', 'Manual', '2026-05-11 08:30:00', 'Sơ chế prl003: tạo 20 ly nước cam',   NULL, NULL),

-- ===== ProcessingLog 4 (emp kitchen Bình Thạnh) =====
-- Detail 10: 500g bánh phở → 5 khẩu phần phở
('prs00001-0000-0000-0000-000000000010', 'bat40001-0000-0000-0000-000000000001', 'emp40001-0000-0000-0000-000000000003',  -500, 'Processing', 'Manual', '2026-05-11 08:00:00', 'Sơ chế prl004: lấy 500g bánh phở',     NULL, NULL),
('pro00001-0000-0000-0000-000000000010', 'pbt40001-0000-0000-0000-000000000001', 'emp40001-0000-0000-0000-000000000003',     5, 'Processing', 'Manual', '2026-05-11 08:30:00', 'Sơ chế prl004: tạo 5 khẩu phần phở',  NULL, NULL),
-- Detail 11: 1L sữa tươi → 8 phần sữa
('prs00001-0000-0000-0000-000000000011', 'bat40001-0000-0000-0000-000000000002', 'emp40001-0000-0000-0000-000000000003',    -1, 'Processing', 'Manual', '2026-05-11 08:00:00', 'Sơ chế prl004: lấy 1L sữa tươi',       NULL, NULL),
('pro00001-0000-0000-0000-000000000011', 'pbt40001-0000-0000-0000-000000000002', 'emp40001-0000-0000-0000-000000000003',     8, 'Processing', 'Manual', '2026-05-11 08:30:00', 'Sơ chế prl004: tạo 8 phần sữa',       NULL, NULL),
-- Detail 12: 2kg đường → 100 phần đường
('prs00001-0000-0000-0000-000000000012', 'bat40001-0000-0000-0000-000000000003', 'emp40001-0000-0000-0000-000000000003',    -2, 'Processing', 'Manual', '2026-05-11 08:00:00', 'Sơ chế prl004: lấy 2kg đường',          NULL, NULL),
('pro00001-0000-0000-0000-000000000012', 'pbt40001-0000-0000-0000-000000000003', 'emp40001-0000-0000-0000-000000000003',   100, 'Processing', 'Manual', '2026-05-11 08:30:00', 'Sơ chế prl004: tạo 100 phần đường',    NULL, NULL),

-- ===== ProcessingLog 5 (emp kitchen Gò Vấp) =====
-- Detail 13: 300g thịt bò → 3 phần thịt bò
('prs00001-0000-0000-0000-000000000013', 'bat50001-0000-0000-0000-000000000001', 'emp50001-0000-0000-0000-000000000003',  -300, 'Processing', 'Manual', '2026-05-11 08:00:00', 'Sơ chế prl005: lấy 300g thịt bò',      NULL, NULL),
('pro00001-0000-0000-0000-000000000013', 'pbt50001-0000-0000-0000-000000000001', 'emp50001-0000-0000-0000-000000000003',     3, 'Processing', 'Manual', '2026-05-11 08:30:00', 'Sơ chế prl005: tạo 3 phần thịt bò',   NULL, NULL),
-- Detail 14: 10 bánh mì → 10 phần bánh mì
('prs00001-0000-0000-0000-000000000014', 'bat50001-0000-0000-0000-000000000002', 'emp50001-0000-0000-0000-000000000003',   -10, 'Processing', 'Manual', '2026-05-11 08:00:00', 'Sơ chế prl005: lấy 10 bánh mì',        NULL, NULL),
('pro00001-0000-0000-0000-000000000014', 'pbt50001-0000-0000-0000-000000000002', 'emp50001-0000-0000-0000-000000000003',    10, 'Processing', 'Manual', '2026-05-11 08:30:00', 'Sơ chế prl005: tạo 10 phần bánh mì',  NULL, NULL),
-- Detail 15: 2kg đường → 100 phần đường
('prs00001-0000-0000-0000-000000000015', 'bat50001-0000-0000-0000-000000000003', 'emp50001-0000-0000-0000-000000000003',    -2, 'Processing', 'Manual', '2026-05-11 08:00:00', 'Sơ chế prl005: lấy 2kg đường',          NULL, NULL),
('pro00001-0000-0000-0000-000000000015', 'pbt50001-0000-0000-0000-000000000003', 'emp50001-0000-0000-0000-000000000003',   100, 'Processing', 'Manual', '2026-05-11 08:30:00', 'Sơ chế prl005: tạo 100 phần đường',    NULL, NULL);


-- ================================================================
-- G. UPDATE QuantityOnHand của 15 batch nguồn (Raw)
--    Giảm đúng số lượng đã lấy vào ProcessingDetail.InputKg
-- ================================================================
UPDATE InventoryBatch SET QuantityOnHand = QuantityOnHand -  500 WHERE BatchID = 'bat10001-0000-0000-0000-000000000001'; -- phở Q5:    4700 → 4200
UPDATE InventoryBatch SET QuantityOnHand = QuantityOnHand -  300 WHERE BatchID = 'bat10001-0000-0000-0000-000000000002'; -- bò Q5:     2850 → 2550
UPDATE InventoryBatch SET QuantityOnHand = QuantityOnHand -  200 WHERE BatchID = 'bat10001-0000-0000-0000-000000000003'; -- cà phê Q5: 1900 → 1700
UPDATE InventoryBatch SET QuantityOnHand = QuantityOnHand -  300 WHERE BatchID = 'bat20001-0000-0000-0000-000000000001'; -- trà Q1:    1900 → 1600
UPDATE InventoryBatch SET QuantityOnHand = QuantityOnHand -    2 WHERE BatchID = 'bat20001-0000-0000-0000-000000000002'; -- sữa Q1:    8    → 6
UPDATE InventoryBatch SET QuantityOnHand = QuantityOnHand -   10 WHERE BatchID = 'bat20001-0000-0000-0000-000000000003'; -- bánh mì Q1: 90   → 80
UPDATE InventoryBatch SET QuantityOnHand = QuantityOnHand -  400 WHERE BatchID = 'bat30001-0000-0000-0000-000000000001'; -- heo Q3:    1800 → 1400
UPDATE InventoryBatch SET QuantityOnHand = QuantityOnHand -    2 WHERE BatchID = 'bat30001-0000-0000-0000-000000000002'; -- gà Q3:     4    → 2
UPDATE InventoryBatch SET QuantityOnHand = QuantityOnHand -   20 WHERE BatchID = 'bat30001-0000-0000-0000-000000000003'; -- cam Q3:    85   → 65
UPDATE InventoryBatch SET QuantityOnHand = QuantityOnHand -  500 WHERE BatchID = 'bat40001-0000-0000-0000-000000000001'; -- phở BT:    2900 → 2400
UPDATE InventoryBatch SET QuantityOnHand = QuantityOnHand -    1 WHERE BatchID = 'bat40001-0000-0000-0000-000000000002'; -- sữa BT:    4    → 3
UPDATE InventoryBatch SET QuantityOnHand = QuantityOnHand -    2 WHERE BatchID = 'bat40001-0000-0000-0000-000000000003'; -- đường BT:  9    → 7
UPDATE InventoryBatch SET QuantityOnHand = QuantityOnHand -  300 WHERE BatchID = 'bat50001-0000-0000-0000-000000000001'; -- bò GV:     1850 → 1550
UPDATE InventoryBatch SET QuantityOnHand = QuantityOnHand -   10 WHERE BatchID = 'bat50001-0000-0000-0000-000000000002'; -- bánh mì GV: 45   → 35
UPDATE InventoryBatch SET QuantityOnHand = QuantityOnHand -    2 WHERE BatchID = 'bat50001-0000-0000-0000-000000000003'; -- đường GV:  9    → 7


-- ================================================================
-- DONE ✓
--
-- TỔNG KẾT DỮ LIỆU SƠ CHẾ:
-- ┌─────────────────────────┬────────┐
-- │ Bảng                    │ Số BG  │
-- ├─────────────────────────┼────────┤
-- │ Ingredient (mới)        │ 8      │
-- │ Receipe (mới)           │ 6      │
-- │ ProcessingLog           │ 5      │
-- │ InventoryBatch(Processed)│ 15    │
-- │ ProcessingDetail        │ 15     │
-- │ StockMovement(Processing)│ 30    │
-- └─────────────────────────┴────────┘
--
-- NGUYÊN LIỆU THÔ → SƠ CHẾ:
-- ┌───────────────────┬───────────────────────┬──────────────┐
-- │ Nguồn (Raw)       │ Thành phẩm (Processed)│ Kho          │
-- ├───────────────────┼───────────────────────┼──────────────┤
-- │ Bánh phở (gram)   │ Khẩu phần phở (Unit)  │ kho 1, kho 4 │
-- │ Thịt bò (gram)    │ Phần thịt bò (Unit)   │ kho 1, kho 5 │
-- │ Cà phê rang (gram)│ Phần cà phê đặc (Unit)│ kho 1        │
-- │ Trà xanh (gram)   │ Phần trà xanh (Unit)  │ kho 2        │
-- │ Sữa tươi (liter)  │ Phần sữa (Unit)       │ kho 2, kho 4 │
-- │ Bánh mì (unit)    │ Phần bánh mì (Unit)   │ kho 2, kho 5 │
-- │ Thịt heo (gram)   │ Phần thịt heo (Unit)  │ kho 3        │
-- │ Gà nguyên con (kg)│ Miếng gà rán (Unit)   │ kho 3        │
-- │ Cam tươi (unit)   │ Ly nước cam (Unit)    │ kho 3        │
-- │ Đường (kg)        │ Phần đường (Unit)     │ kho 4, kho 5 │
-- └───────────────────┴───────────────────────┴──────────────┘
-- ================================================================

-- ================================================================
-- SEED: Đơn hàng ĐANG CHỜ GIAO (DeliveryStatus = Pending)
-- ----------------------------------------------------------------
-- Tạo 4 đơn pending để hiện trong panel "Đơn đang chờ giao" và test
-- luật xác nhận "Đã giao":
--   1. Tiền mặt, chưa thanh toán      -> phải nhập tiền mặt >= tổng (gồm ship)
--   2. Thẻ, ĐÃ thanh toán             -> giao được, không cần tiền mặt
--   3. Thẻ, CHƯA thanh toán           -> KHÔNG cho giao (bị chặn)
--   4. Chuyển khoản, ĐÃ thanh toán    -> giao được, không cần tiền mặt
--
-- Dùng FK có sẵn (User cafe0001-*, Address add00001-*, Store 1..3).
-- ChangeAt đặt ở 2026-06-04 để lọt qua bộ lọc get-all (Min(ChangeAt) <= ngày hiện tại).
-- Idempotent: xoá trước khi chèn lại (theo thứ tự FK an toàn).
-- PaymentStatus: 0=Pending, 1=Paid, 2=Failed.
-- ================================================================

DELETE FROM DeliveryLog  WHERE DeliveryID IN (
  'aacc0001-0000-0000-0000-000000000001','aacc0001-0000-0000-0000-000000000002',
  'aacc0001-0000-0000-0000-000000000003','aacc0001-0000-0000-0000-000000000004');
DELETE FROM DeliveryInfo WHERE DeliveryID IN (
  'aacc0001-0000-0000-0000-000000000001','aacc0001-0000-0000-0000-000000000002',
  'aacc0001-0000-0000-0000-000000000003','aacc0001-0000-0000-0000-000000000004');
DELETE FROM Bill         WHERE BillID IN (
  'aabb0001-0000-0000-0000-000000000001','aabb0001-0000-0000-0000-000000000002',
  'aabb0001-0000-0000-0000-000000000003','aabb0001-0000-0000-0000-000000000004');

-- ── BILL ────────────────────────────────────────────────────────
INSERT INTO Bill
  (BillID, UserID, StoreID, VAT, PaymentMethods, Note, Total,
   MoneyReceived, MoneyGiveBack, TableID, AddressID, Contact, TicketID,
   DeliveryInfoID, DeletedAt, PaymentStatus, PaymentReference, PaidAt, SePayTransactionId)
VALUES
-- 1) Cash, chưa thanh toán
('aabb0001-0000-0000-0000-000000000001','cafe0001-0000-0000-0000-000000000006',1,0.10,'Cash',
  'Cho giao - tien mat', 65000, NULL, NULL, NULL,'add00001-0000-0000-0000-000000000070','0903000001',NULL,
  NULL, NULL, 0, NULL, NULL, NULL),
-- 2) Card, đã thanh toán
('aabb0001-0000-0000-0000-000000000002','cafe0001-0000-0000-0000-000000000007',2,0.10,'Card',
  'Cho giao - the da TT', 88000, NULL, NULL, NULL,'add00001-0000-0000-0000-000000000071','0903000002',NULL,
  NULL, NULL, 1, NULL, '2026-06-04 08:30:00', NULL),
-- 3) Card, chưa thanh toán
('aabb0001-0000-0000-0000-000000000003','cafe0001-0000-0000-0000-000000000008',3,0.10,'Card',
  'Cho giao - the chua TT', 60000, NULL, NULL, NULL,'add00001-0000-0000-0000-000000000072','0903000003',NULL,
  NULL, NULL, 0, NULL, NULL, NULL),
-- 4) BankTransfer, đã thanh toán
('aabb0001-0000-0000-0000-000000000004','cafe0001-0000-0000-0000-00000000000b',1,0.10,'BankTransfer',
  'Cho giao - CK da TT', 120000, NULL, NULL, NULL,'add00001-0000-0000-0000-000000000075','0903000004',NULL,
  NULL, NULL, 1, 'CHONLIBI00000004', '2026-06-04 08:45:00', NULL);

-- ── DELIVERY INFO ───────────────────────────────────────────────
INSERT INTO DeliveryInfo (DeliveryID, BillID, UserID, AddressID, ShippingFee, Note, DeletedAt) VALUES
('aacc0001-0000-0000-0000-000000000001','aabb0001-0000-0000-0000-000000000001','cafe0001-0000-0000-0000-000000000006','add00001-0000-0000-0000-000000000070',15000,NULL,NULL),
('aacc0001-0000-0000-0000-000000000002','aabb0001-0000-0000-0000-000000000002','cafe0001-0000-0000-0000-000000000007','add00001-0000-0000-0000-000000000071',15000,NULL,NULL),
('aacc0001-0000-0000-0000-000000000003','aabb0001-0000-0000-0000-000000000003','cafe0001-0000-0000-0000-000000000008','add00001-0000-0000-0000-000000000072',15000,NULL,NULL),
('aacc0001-0000-0000-0000-000000000004','aabb0001-0000-0000-0000-000000000004','cafe0001-0000-0000-0000-00000000000b','add00001-0000-0000-0000-000000000075',20000,NULL,NULL);

-- ── DELIVERY LOG (chỉ 1 log Pending / đơn — chưa gán nhân viên) ──
INSERT INTO DeliveryLog (LogID, DeliveryID, EmployeeID, Status, ChangeAt, Note) VALUES
('aadd0001-0000-0000-0000-000000000001','aacc0001-0000-0000-0000-000000000001',NULL,'Pending','2026-06-04 09:00:00',NULL),
('aadd0001-0000-0000-0000-000000000002','aacc0001-0000-0000-0000-000000000002',NULL,'Pending','2026-06-04 09:05:00',NULL),
('aadd0001-0000-0000-0000-000000000003','aacc0001-0000-0000-0000-000000000003',NULL,'Pending','2026-06-04 09:10:00',NULL),
('aadd0001-0000-0000-0000-000000000004','aacc0001-0000-0000-0000-000000000004',NULL,'Pending','2026-06-04 09:15:00',NULL);

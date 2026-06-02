-- ================================================================
-- JOLIBEE SEED EXTRA — thêm ~20 bản ghi mỗi bảng chính
-- Chạy SAU seed_full.sql  |  Mật khẩu mọi tài khoản: password
-- ================================================================
USE DBjolibi;
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ================================================================
-- 1. ADDRESS mới
--   030-03e : 15 địa chỉ store  (StoreID 6-20)
--   050-05e : 15 địa chỉ supplier (SupplierID 6-20)
--   070-07e : 15 địa chỉ khách hàng mới
-- ================================================================
INSERT INTO Address (AddressID, HouseNumber, Street, Ward, District, Province, Country, StoreID, SupplierID, UserID, IsDefault) VALUES
-- Store 6-20
('add00001-0000-0000-0000-000000000030',  12, 'Nguyễn Thị Thập',   'Phường Tân Phú',    'Quận 7',      'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-000000000031',  34, 'Phạm Văn Đồng',     'Phường Linh Tây',   'Thủ Đức',     'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-000000000032',  56, 'Lê Đức Thọ',        'Phường 6',          'Quận 11',     'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-000000000033',  78, 'Huỳnh Tấn Phát',    'Phường Phú Mỹ',     'Quận 7',      'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-000000000034',  90, 'Trần Não',          'Phường An Phú',     'Thủ Đức',     'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-000000000035',  11, 'Lý Chiêu Hoàng',    'Phường 8',          'Quận 10',     'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-000000000036',  23, 'Âu Cơ',             'Phường 14',         'Tân Bình',    'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-000000000037',  45, 'Cộng Hòa',          'Phường 12',         'Tân Bình',    'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-000000000038',  67, 'Nguyễn Kiệm',       'Phường 3',          'Gò Vấp',      'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-000000000039',  89, 'Thống Nhất',        'Phường 11',         'Gò Vấp',      'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-00000000003a',  10, 'Hoàng Văn Thụ',     'Phường 4',          'Phú Nhuận',   'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-00000000003b',  22, 'Nguyễn Oanh',       'Phường 7',          'Gò Vấp',      'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-00000000003c',  44, 'Trường Chinh',      'Phường 12',         'Quận 12',     'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-00000000003d', 100, 'Quang Trung',       'Phường 8',          'Hóc Môn',     'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-00000000003e', 200, 'Đinh Tiên Hoàng',   'Phường Phú Hội',    'Quận 1',      'Đà Nẵng',         'Viet Nam', NULL, NULL, NULL, 0),
-- Supplier 6-20
('add00001-0000-0000-0000-000000000050',  16, 'Võ Thị Sáu',        'Phường 6',          'Quận 3',      'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-000000000051',  27, 'Nguyễn Chí Thanh',  'Phường 5',          'Quận 10',     'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-000000000052',  38, 'Lê Hồng Phong',     'Phường 2',          'Quận 10',     'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-000000000053',  49, 'Bùi Viện',          'Phường Phạm Ngũ Lão','Quận 1',     'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-000000000054',  50, 'Phan Văn Hân',      'Phường 3',          'Bình Thạnh',  'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-000000000055',  61, 'Nguyễn Cửu Vân',    'Phường 17',         'Bình Thạnh',  'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-000000000056',  72, 'Bạch Đằng',         'Phường 2',          'Tân Bình',    'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-000000000057',  83, 'Tân Sơn Nhất',      'Phường 2',          'Tân Bình',    'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-000000000058',  94, 'Kinh Dương Vương',  'Phường An Lạc A',   'Bình Tân',    'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-000000000059', 105, 'Tân Kỳ Tân Quý',    'Phường Sơn Kỳ',     'Tân Phú',     'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-00000000005a', 116, 'Lũy Bán Bích',      'Phường Hòa Thạnh',  'Tân Phú',     'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-00000000005b', 127, 'Hòa Bình',          'Phường Hiệp Tân',   'Tân Phú',     'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-00000000005c', 138, 'Lê Trọng Tấn',      'Phường Sơn Kỳ',     'Tân Phú',     'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-00000000005d', 149, 'An Dương Vương',     'Phường 9',          'Quận 5',      'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
('add00001-0000-0000-0000-00000000005e', 160, 'Điện Biên Phủ',     'Phường 25',         'Bình Thạnh',  'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 0),
-- Khách hàng mới 6-20
('add00001-0000-0000-0000-000000000070',   5, 'Đinh Bộ Lĩnh',      'Phường 1',          'Bình Thạnh',  'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 1),
('add00001-0000-0000-0000-000000000071',  16, 'Lê Duẩn',           'Phường Bến Nghé',   'Quận 1',      'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 1),
('add00001-0000-0000-0000-000000000072',  27, 'Hai Bà Trưng',      'Phường Đa Kao',     'Quận 1',      'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 1),
('add00001-0000-0000-0000-000000000073',  38, 'Xô Viết Nghệ Tĩnh', 'Phường 25',         'Bình Thạnh',  'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 1),
('add00001-0000-0000-0000-000000000074',  49, 'Nguyễn Hữu Cảnh',   'Phường 22',         'Bình Thạnh',  'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 1),
('add00001-0000-0000-0000-000000000075',  60, 'Bình Quới',         'Phường 28',         'Bình Thạnh',  'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 1),
('add00001-0000-0000-0000-000000000076',  71, 'Nguyễn Xí',         'Phường 26',         'Bình Thạnh',  'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 1),
('add00001-0000-0000-0000-000000000077',  82, 'Vũ Tùng',           'Phường 2',          'Bình Thạnh',  'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 1),
('add00001-0000-0000-0000-000000000078',  93, 'Phạm Văn Chiêu',    'Phường 9',          'Gò Vấp',      'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 1),
('add00001-0000-0000-0000-000000000079', 104, 'Quang Trung',       'Phường 12',         'Gò Vấp',      'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 1),
('add00001-0000-0000-0000-00000000007a', 115, 'Dương Quảng Hàm',   'Phường 5',          'Gò Vấp',      'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 1),
('add00001-0000-0000-0000-00000000007b', 126, 'Phan Huy Ích',      'Phường 12',         'Gò Vấp',      'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 1),
('add00001-0000-0000-0000-00000000007c', 137, 'Lê Văn Thịnh',      'Phường Bình Trưng Đông','Thủ Đức', 'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 1),
('add00001-0000-0000-0000-00000000007d', 148, 'Kha Vạn Cân',       'Phường Linh Đông',  'Thủ Đức',     'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 1),
('add00001-0000-0000-0000-00000000007e', 159, 'Đặng Văn Bi',       'Phường Trường Thọ', 'Thủ Đức',     'TP. Hồ Chí Minh', 'Viet Nam', NULL, NULL, NULL, 1);


-- ================================================================
-- 2. STORE (15 mới, StoreID 6-20)
-- ================================================================
INSERT INTO Store (StoreID, StoreName, Phone, Email, TotalReviews, TotalPoints, SeatingCapacity, DeletedAt) VALUES
( 6, 'Jolibee - Quận 7',    '0909000006', 'q7@jolibee.vn',      14, 62,  70, NULL),
( 7, 'Jolibee - Thủ Đức',   '0909000007', 'td@jolibee.vn',      11, 48,  55, NULL),
( 8, 'Jolibee - Quận 11',   '0909000008', 'q11@jolibee.vn',     16, 70,  65, NULL),
( 9, 'Jolibee - Bình Tân',  '0909000009', 'binhtan@jolibee.vn',  7, 30,  50, NULL),
(10, 'Jolibee - Tân Phú',   '0909000010', 'tanphu@jolibee.vn',  13, 56,  60, NULL),
(11, 'Jolibee - Quận 10',   '0909000011', 'q10@jolibee.vn',     18, 80,  75, NULL),
(12, 'Jolibee - Gò Vấp 2',  '0909000012', 'gv2@jolibee.vn',      5, 22,  45, NULL),
(13, 'Jolibee - Phú Nhuận', '0909000013', 'pn@jolibee.vn',      20, 90,  80, NULL),
(14, 'Jolibee - Tân Bình',  '0909000014', 'tanbinh@jolibee.vn',  9, 40,  55, NULL),
(15, 'Jolibee - Thủ Đức 2', '0909000015', 'td2@jolibee.vn',      6, 25,  50, NULL),
(16, 'Jolibee - Quận 12',   '0909000016', 'q12@jolibee.vn',      4, 18,  45, NULL),
(17, 'Jolibee - Hóc Môn',   '0909000017', 'hm@jolibee.vn',       3, 12,  40, NULL),
(18, 'Jolibee - Cộng Hòa',  '0909000018', 'congho@jolibee.vn',   8, 35,  60, NULL),
(19, 'Jolibee - Điện Biên', '0909000019', 'dbienphu@jolibee.vn', 2,  8,  30, NULL),
(20, 'Jolibee - Đà Nẵng',   '0909000020', 'danang@jolibee.vn',   1,  5,  35, NULL);

UPDATE Address SET StoreID =  6 WHERE AddressID = 'add00001-0000-0000-0000-000000000030';
UPDATE Address SET StoreID =  7 WHERE AddressID = 'add00001-0000-0000-0000-000000000031';
UPDATE Address SET StoreID =  8 WHERE AddressID = 'add00001-0000-0000-0000-000000000032';
UPDATE Address SET StoreID =  9 WHERE AddressID = 'add00001-0000-0000-0000-000000000033';
UPDATE Address SET StoreID = 10 WHERE AddressID = 'add00001-0000-0000-0000-000000000034';
UPDATE Address SET StoreID = 11 WHERE AddressID = 'add00001-0000-0000-0000-000000000035';
UPDATE Address SET StoreID = 12 WHERE AddressID = 'add00001-0000-0000-0000-000000000036';
UPDATE Address SET StoreID = 13 WHERE AddressID = 'add00001-0000-0000-0000-000000000037';
UPDATE Address SET StoreID = 14 WHERE AddressID = 'add00001-0000-0000-0000-000000000038';
UPDATE Address SET StoreID = 15 WHERE AddressID = 'add00001-0000-0000-0000-000000000039';
UPDATE Address SET StoreID = 16 WHERE AddressID = 'add00001-0000-0000-0000-00000000003a';
UPDATE Address SET StoreID = 17 WHERE AddressID = 'add00001-0000-0000-0000-00000000003b';
UPDATE Address SET StoreID = 18 WHERE AddressID = 'add00001-0000-0000-0000-00000000003c';
UPDATE Address SET StoreID = 19 WHERE AddressID = 'add00001-0000-0000-0000-00000000003d';
UPDATE Address SET StoreID = 20 WHERE AddressID = 'add00001-0000-0000-0000-00000000003e';


-- ================================================================
-- 3. SUPPLIER (15 mới, SupplierID 6-20)
-- ================================================================
INSERT INTO Supplier (SupplierID, SupplierName, Phone, Email, TaxCode, DeletedAt) VALUES
( 6, 'Cty TNHH Thực Phẩm Đông Lạnh',    '02866000006', 'ncc6@donglanh.vn',   '0306606606', NULL),
( 7, 'Cty CP Nước Giải Khát Sài Gòn',   '02877000007', 'ncc7@ngksaigon.vn',  '0307707707', NULL),
( 8, 'HTX Thực Phẩm Sinh Thái',         '02888000008', 'ncc8@sinhtha.vn',    '0308808808', NULL),
( 9, 'DN Tư Nhân Bánh Mì Baguette',     '02899000009', 'ncc9@baguette.vn',   '0309909909', NULL),
(10, 'Cty TNHH Sữa Tươi Đà Lạt',       '02810010010', 'ncc10@dalatmilk.vn', '0310010010', NULL),
(11, 'Cty CP Đường Tinh Luyện',         '02811011011', 'ncc11@duongtl.vn',   '0311011011', NULL),
(12, 'HTX Nông Sản Cao Nguyên',         '02812012012', 'ncc12@caonguyen.vn', '0312012012', NULL),
(13, 'Cty TNHH Gà Sạch Bình Dương',    '02813013013', 'ncc13@gasach.vn',    '0313013013', NULL),
(14, 'DN Tư Nhân Gia Vị Thơm',         '02814014014', 'ncc14@giavitho.vn',  '0314014014', NULL),
(15, 'Cty CP Hải Sản Biển Xanh',       '02815015015', 'ncc15@bienxanh.vn',  '0315015015', NULL),
(16, 'Cty TNHH Rau Củ Quả Sạch',      '02816016016', 'ncc16@raucuqua.vn',  '0316016016', NULL),
(17, 'HTX Cà Phê Buôn Ma Thuột',       '02817017017', 'ncc17@caphebu.vn',   '0317017017', NULL),
(18, 'Cty CP Trà Thái Nguyên',         '02818018018', 'ncc18@trathai.vn',   '0318018018', NULL),
(19, 'DN Tư Nhân Thịt Bò Tươi Sạch',  '02819019019', 'ncc19@thitbotuoi.vn','0319019019', NULL),
(20, 'Cty TNHH Thực Phẩm Sạch TPHCM', '02820020020', 'ncc20@tpsach.vn',    '0320020020', NULL);

UPDATE Address SET SupplierID =  6 WHERE AddressID = 'add00001-0000-0000-0000-000000000050';
UPDATE Address SET SupplierID =  7 WHERE AddressID = 'add00001-0000-0000-0000-000000000051';
UPDATE Address SET SupplierID =  8 WHERE AddressID = 'add00001-0000-0000-0000-000000000052';
UPDATE Address SET SupplierID =  9 WHERE AddressID = 'add00001-0000-0000-0000-000000000053';
UPDATE Address SET SupplierID = 10 WHERE AddressID = 'add00001-0000-0000-0000-000000000054';
UPDATE Address SET SupplierID = 11 WHERE AddressID = 'add00001-0000-0000-0000-000000000055';
UPDATE Address SET SupplierID = 12 WHERE AddressID = 'add00001-0000-0000-0000-000000000056';
UPDATE Address SET SupplierID = 13 WHERE AddressID = 'add00001-0000-0000-0000-000000000057';
UPDATE Address SET SupplierID = 14 WHERE AddressID = 'add00001-0000-0000-0000-000000000058';
UPDATE Address SET SupplierID = 15 WHERE AddressID = 'add00001-0000-0000-0000-000000000059';
UPDATE Address SET SupplierID = 16 WHERE AddressID = 'add00001-0000-0000-0000-00000000005a';
UPDATE Address SET SupplierID = 17 WHERE AddressID = 'add00001-0000-0000-0000-00000000005b';
UPDATE Address SET SupplierID = 18 WHERE AddressID = 'add00001-0000-0000-0000-00000000005c';
UPDATE Address SET SupplierID = 19 WHERE AddressID = 'add00001-0000-0000-0000-00000000005d';
UPDATE Address SET SupplierID = 20 WHERE AddressID = 'add00001-0000-0000-0000-00000000005e';


-- ================================================================
-- 4. USER — KHÁCH HÀNG MỚI (15 mới, tổng 20)
--    Hash "password" cost=12 — tái dùng hash hiện có (khác salt, cùng pass)
-- ================================================================
INSERT INTO `User` (UserID, UserName, HashPassword, BirthDate, CreateAt,
  Email, Phone, FullName, Gender, Discriminator,
  IsVerified, Role, StoreID, BasicSalary, DeletedAt, DeleteAt)
VALUES
('cafe0001-0000-0000-0000-000000000006','nguyen_van_f',
 '$2b$12$WVx3p/PF3Fe32uVArzV4/.JuHgdMp4FB27pSlAfJYKR8nK9tqbmya',
 '1992-04-10','2026-02-01 00:00:00','van.f@gmail.com','0902000001','Nguyễn Văn F','Male','User',1,NULL,NULL,NULL,NULL,NULL),
('cafe0001-0000-0000-0000-000000000007','tran_thi_g',
 '$2b$12$ZbSyN/SGPZdMtRDv0Nr3VutA8/hH1RjySI5fSfAx6/WKoYZ143OOy',
 '1997-08-25','2026-02-02 00:00:00','thi.g@gmail.com','0902000002','Trần Thị G','Female','User',1,NULL,NULL,NULL,NULL,NULL),
('cafe0001-0000-0000-0000-000000000008','le_van_h',
 '$2b$12$mBgoUQpuNLWuFpKSqw/eOONP0EQwiy2vYeKuuc/EPedaJo982EA8e',
 '1994-12-03','2026-02-03 00:00:00','van.h@gmail.com','0902000003','Lê Văn H','Male','User',1,NULL,NULL,NULL,NULL,NULL),
('cafe0001-0000-0000-0000-000000000009','pham_thi_i',
 '$2b$12$98GK8NJc1G6o5FHsqcbGV.W9ty4b6YNNO2/y9Q5YMSU/5dJNZ7ViG',
 '2001-06-17','2026-02-04 00:00:00','thi.i@gmail.com','0902000004','Phạm Thị I','Female','User',1,NULL,NULL,NULL,NULL,NULL),
('cafe0001-0000-0000-0000-00000000000a','hoang_van_j',
 '$2b$12$cmA/UzpK1tbCOW67vFcwrOLRD0GvheMTwGSjHKbSArrwVcSAq.n7.',
 '1989-02-20','2026-02-05 00:00:00','van.j@gmail.com','0902000005','Hoàng Văn J','Male','User',1,NULL,NULL,NULL,NULL,NULL),
('cafe0001-0000-0000-0000-00000000000b','do_thi_k',
 '$2b$12$WVx3p/PF3Fe32uVArzV4/.JuHgdMp4FB27pSlAfJYKR8nK9tqbmya',
 '1996-10-08','2026-02-06 00:00:00','thi.k@gmail.com','0902000006','Đỗ Thị K','Female','User',1,NULL,NULL,NULL,NULL,NULL),
('cafe0001-0000-0000-0000-00000000000c','bui_van_l',
 '$2b$12$ZbSyN/SGPZdMtRDv0Nr3VutA8/hH1RjySI5fSfAx6/WKoYZ143OOy',
 '1991-03-14','2026-02-07 00:00:00','van.l@gmail.com','0902000007','Bùi Văn L','Male','User',1,NULL,NULL,NULL,NULL,NULL),
('cafe0001-0000-0000-0000-00000000000d','vo_thi_m',
 '$2b$12$mBgoUQpuNLWuFpKSqw/eOONP0EQwiy2vYeKuuc/EPedaJo982EA8e',
 '1999-07-31','2026-02-08 00:00:00','thi.m@gmail.com','0902000008','Võ Thị M','Female','User',1,NULL,NULL,NULL,NULL,NULL),
('cafe0001-0000-0000-0000-00000000000e','dang_van_n',
 '$2b$12$98GK8NJc1G6o5FHsqcbGV.W9ty4b6YNNO2/y9Q5YMSU/5dJNZ7ViG',
 '1986-11-22','2026-02-09 00:00:00','van.n@gmail.com','0902000009','Đặng Văn N','Male','User',1,NULL,NULL,NULL,NULL,NULL),
('cafe0001-0000-0000-0000-00000000000f','truong_thi_o',
 '$2b$12$cmA/UzpK1tbCOW67vFcwrOLRD0GvheMTwGSjHKbSArrwVcSAq.n7.',
 '2003-01-09','2026-02-10 00:00:00','thi.o@gmail.com','0902000010','Trương Thị O','Female','User',1,NULL,NULL,NULL,NULL,NULL),
('cafe0001-0000-0000-0000-000000000010','ngo_van_p',
 '$2b$12$WVx3p/PF3Fe32uVArzV4/.JuHgdMp4FB27pSlAfJYKR8nK9tqbmya',
 '1988-05-16','2026-02-11 00:00:00','van.p@gmail.com','0902000011','Ngô Văn P','Male','User',1,NULL,NULL,NULL,NULL,NULL),
('cafe0001-0000-0000-0000-000000000011','dinh_thi_q',
 '$2b$12$ZbSyN/SGPZdMtRDv0Nr3VutA8/hH1RjySI5fSfAx6/WKoYZ143OOy',
 '1995-09-28','2026-02-12 00:00:00','thi.q@gmail.com','0902000012','Đinh Thị Q','Female','User',1,NULL,NULL,NULL,NULL,NULL),
('cafe0001-0000-0000-0000-000000000012','ly_van_r',
 '$2b$12$mBgoUQpuNLWuFpKSqw/eOONP0EQwiy2vYeKuuc/EPedaJo982EA8e',
 '2000-04-05','2026-02-13 00:00:00','van.r@gmail.com','0902000013','Lý Văn R','Male','User',1,NULL,NULL,NULL,NULL,NULL),
('cafe0001-0000-0000-0000-000000000013','nguyen_thi_s',
 '$2b$12$98GK8NJc1G6o5FHsqcbGV.W9ty4b6YNNO2/y9Q5YMSU/5dJNZ7ViG',
 '1993-08-19','2026-02-14 00:00:00','thi.s@gmail.com','0902000014','Nguyễn Thị S','Female','User',1,NULL,NULL,NULL,NULL,NULL),
('cafe0001-0000-0000-0000-000000000014','mai_van_t',
 '$2b$12$cmA/UzpK1tbCOW67vFcwrOLRD0GvheMTwGSjHKbSArrwVcSAq.n7.',
 '1987-12-30','2026-02-15 00:00:00','van.t@gmail.com','0902000015','Mai Văn T','Male','User',1,NULL,NULL,NULL,NULL,NULL);

UPDATE Address SET UserID = 'cafe0001-0000-0000-0000-000000000006' WHERE AddressID = 'add00001-0000-0000-0000-000000000070';
UPDATE Address SET UserID = 'cafe0001-0000-0000-0000-000000000007' WHERE AddressID = 'add00001-0000-0000-0000-000000000071';
UPDATE Address SET UserID = 'cafe0001-0000-0000-0000-000000000008' WHERE AddressID = 'add00001-0000-0000-0000-000000000072';
UPDATE Address SET UserID = 'cafe0001-0000-0000-0000-000000000009' WHERE AddressID = 'add00001-0000-0000-0000-000000000073';
UPDATE Address SET UserID = 'cafe0001-0000-0000-0000-00000000000a' WHERE AddressID = 'add00001-0000-0000-0000-000000000074';
UPDATE Address SET UserID = 'cafe0001-0000-0000-0000-00000000000b' WHERE AddressID = 'add00001-0000-0000-0000-000000000075';
UPDATE Address SET UserID = 'cafe0001-0000-0000-0000-00000000000c' WHERE AddressID = 'add00001-0000-0000-0000-000000000076';
UPDATE Address SET UserID = 'cafe0001-0000-0000-0000-00000000000d' WHERE AddressID = 'add00001-0000-0000-0000-000000000077';
UPDATE Address SET UserID = 'cafe0001-0000-0000-0000-00000000000e' WHERE AddressID = 'add00001-0000-0000-0000-000000000078';
UPDATE Address SET UserID = 'cafe0001-0000-0000-0000-00000000000f' WHERE AddressID = 'add00001-0000-0000-0000-000000000079';
UPDATE Address SET UserID = 'cafe0001-0000-0000-0000-000000000010' WHERE AddressID = 'add00001-0000-0000-0000-00000000007a';
UPDATE Address SET UserID = 'cafe0001-0000-0000-0000-000000000011' WHERE AddressID = 'add00001-0000-0000-0000-00000000007b';
UPDATE Address SET UserID = 'cafe0001-0000-0000-0000-000000000012' WHERE AddressID = 'add00001-0000-0000-0000-00000000007c';
UPDATE Address SET UserID = 'cafe0001-0000-0000-0000-000000000013' WHERE AddressID = 'add00001-0000-0000-0000-00000000007d';
UPDATE Address SET UserID = 'cafe0001-0000-0000-0000-000000000014' WHERE AddressID = 'add00001-0000-0000-0000-00000000007e';


-- ================================================================
-- 5. EMPLOYEE MỚI (20 mới)
--    a) 15 Manager cho Store 6-20
--    b)  5 Counter cho Store 1-5
-- ================================================================
INSERT INTO `User` (UserID, UserName, HashPassword, BirthDate, CreateAt,
  Email, Phone, FullName, Gender, Discriminator,
  IsVerified, Role, StoreID, BasicSalary, DeletedAt, DeleteAt)
VALUES
-- Managers store 6-20
('e0060001-0000-0000-0000-000000000001','manager_q7',
 '$2b$12$R/hwPw7aU/LMt0Za2mZ3jOCYFvwiRvS8nTcMdSTyMfZwi9dGG8FmG',
 '1985-03-20','2026-03-01 00:00:00','manager.q7@jolibee.vn','0912000001','Quản Lý Quận 7','Male','Employee',1,'Manager',6,15000000,NULL,NULL),
('e0070001-0000-0000-0000-000000000001','manager_td',
 '$2b$12$R/hwPw7aU/LMt0Za2mZ3jOCYFvwiRvS8nTcMdSTyMfZwi9dGG8FmG',
 '1987-06-14','2026-03-01 00:00:00','manager.td@jolibee.vn','0912000002','Quản Lý Thủ Đức','Female','Employee',1,'Manager',7,15000000,NULL,NULL),
('e0080001-0000-0000-0000-000000000001','manager_q11',
 '$2b$12$R/hwPw7aU/LMt0Za2mZ3jOCYFvwiRvS8nTcMdSTyMfZwi9dGG8FmG',
 '1983-11-05','2026-03-01 00:00:00','manager.q11@jolibee.vn','0912000003','Quản Lý Quận 11','Male','Employee',1,'Manager',8,15000000,NULL,NULL),
('e0090001-0000-0000-0000-000000000001','manager_bintan',
 '$2b$12$R/hwPw7aU/LMt0Za2mZ3jOCYFvwiRvS8nTcMdSTyMfZwi9dGG8FmG',
 '1990-08-29','2026-03-01 00:00:00','manager.bintan@jolibee.vn','0912000004','Quản Lý Bình Tân','Female','Employee',1,'Manager',9,15000000,NULL,NULL),
('e0100001-0000-0000-0000-000000000001','manager_tanphu',
 '$2b$12$R/hwPw7aU/LMt0Za2mZ3jOCYFvwiRvS8nTcMdSTyMfZwi9dGG8FmG',
 '1986-01-17','2026-03-01 00:00:00','manager.tanphu@jolibee.vn','0912000005','Quản Lý Tân Phú','Male','Employee',1,'Manager',10,15000000,NULL,NULL),
('e0110001-0000-0000-0000-000000000001','manager_q10',
 '$2b$12$R/hwPw7aU/LMt0Za2mZ3jOCYFvwiRvS8nTcMdSTyMfZwi9dGG8FmG',
 '1984-09-22','2026-03-02 00:00:00','manager.q10@jolibee.vn','0912000006','Quản Lý Quận 10','Female','Employee',1,'Manager',11,15000000,NULL,NULL),
('e0120001-0000-0000-0000-000000000001','manager_gv2',
 '$2b$12$R/hwPw7aU/LMt0Za2mZ3jOCYFvwiRvS8nTcMdSTyMfZwi9dGG8FmG',
 '1991-04-11','2026-03-02 00:00:00','manager.gv2@jolibee.vn','0912000007','Quản Lý Gò Vấp 2','Male','Employee',1,'Manager',12,15000000,NULL,NULL),
('e0130001-0000-0000-0000-000000000001','manager_pn',
 '$2b$12$R/hwPw7aU/LMt0Za2mZ3jOCYFvwiRvS8nTcMdSTyMfZwi9dGG8FmG',
 '1982-07-03','2026-03-02 00:00:00','manager.pn@jolibee.vn','0912000008','Quản Lý Phú Nhuận','Female','Employee',1,'Manager',13,15000000,NULL,NULL),
('e0140001-0000-0000-0000-000000000001','manager_tanbinh',
 '$2b$12$R/hwPw7aU/LMt0Za2mZ3jOCYFvwiRvS8nTcMdSTyMfZwi9dGG8FmG',
 '1988-02-28','2026-03-02 00:00:00','manager.tanbinh@jolibee.vn','0912000009','Quản Lý Tân Bình','Male','Employee',1,'Manager',14,15000000,NULL,NULL),
('e0150001-0000-0000-0000-000000000001','manager_td2',
 '$2b$12$R/hwPw7aU/LMt0Za2mZ3jOCYFvwiRvS8nTcMdSTyMfZwi9dGG8FmG',
 '1993-12-15','2026-03-02 00:00:00','manager.td2@jolibee.vn','0912000010','Quản Lý Thủ Đức 2','Female','Employee',1,'Manager',15,15000000,NULL,NULL),
('e0160001-0000-0000-0000-000000000001','manager_q12',
 '$2b$12$R/hwPw7aU/LMt0Za2mZ3jOCYFvwiRvS8nTcMdSTyMfZwi9dGG8FmG',
 '1981-05-07','2026-03-03 00:00:00','manager.q12@jolibee.vn','0912000011','Quản Lý Quận 12','Male','Employee',1,'Manager',16,15000000,NULL,NULL),
('e0170001-0000-0000-0000-000000000001','manager_hm',
 '$2b$12$R/hwPw7aU/LMt0Za2mZ3jOCYFvwiRvS8nTcMdSTyMfZwi9dGG8FmG',
 '1989-10-24','2026-03-03 00:00:00','manager.hm@jolibee.vn','0912000012','Quản Lý Hóc Môn','Female','Employee',1,'Manager',17,15000000,NULL,NULL),
('e0180001-0000-0000-0000-000000000001','manager_congho',
 '$2b$12$R/hwPw7aU/LMt0Za2mZ3jOCYFvwiRvS8nTcMdSTyMfZwi9dGG8FmG',
 '1985-04-19','2026-03-03 00:00:00','manager.congho@jolibee.vn','0912000013','Quản Lý Cộng Hòa','Male','Employee',1,'Manager',18,15000000,NULL,NULL),
('e0190001-0000-0000-0000-000000000001','manager_dbienphu',
 '$2b$12$R/hwPw7aU/LMt0Za2mZ3jOCYFvwiRvS8nTcMdSTyMfZwi9dGG8FmG',
 '1992-08-01','2026-03-03 00:00:00','manager.dbp@jolibee.vn','0912000014','Quản Lý Điện Biên Phủ','Female','Employee',1,'Manager',19,15000000,NULL,NULL),
('e0200001-0000-0000-0000-000000000001','manager_danang',
 '$2b$12$R/hwPw7aU/LMt0Za2mZ3jOCYFvwiRvS8nTcMdSTyMfZwi9dGG8FmG',
 '1980-03-11','2026-03-03 00:00:00','manager.dn@jolibee.vn','0912000015','Quản Lý Đà Nẵng','Male','Employee',1,'Manager',20,15000000,NULL,NULL),
-- Counter cho store 1-5
('ec010001-0000-0000-0000-000000000001','counter_q5',
 '$2b$12$MmAXRX5pOgGRCIGKspy0duSlkfqxZMC6/MwjQMkaVp5nzrjYZ24n2',
 '2000-07-14','2026-03-10 00:00:00','counter.q5@jolibee.vn','0913000001','Nhân Viên Thu Ngân Q5','Female','Employee',1,'Counter',1,7500000,NULL,NULL),
('ec020001-0000-0000-0000-000000000001','counter_q1',
 '$2b$12$MmAXRX5pOgGRCIGKspy0duSlkfqxZMC6/MwjQMkaVp5nzrjYZ24n2',
 '2001-11-23','2026-03-10 00:00:00','counter.q1@jolibee.vn','0913000002','Nhân Viên Thu Ngân Q1','Male','Employee',1,'Counter',2,7500000,NULL,NULL),
('ec030001-0000-0000-0000-000000000001','counter_q3',
 '$2b$12$MmAXRX5pOgGRCIGKspy0duSlkfqxZMC6/MwjQMkaVp5nzrjYZ24n2',
 '1999-04-06','2026-03-10 00:00:00','counter.q3@jolibee.vn','0913000003','Nhân Viên Thu Ngân Q3','Female','Employee',1,'Counter',3,7500000,NULL,NULL),
('ec040001-0000-0000-0000-000000000001','counter_bt',
 '$2b$12$MmAXRX5pOgGRCIGKspy0duSlkfqxZMC6/MwjQMkaVp5nzrjYZ24n2',
 '2002-09-18','2026-03-10 00:00:00','counter.bt@jolibee.vn','0913000004','Nhân Viên Thu Ngân BT','Male','Employee',1,'Counter',4,7500000,NULL,NULL),
('ec050001-0000-0000-0000-000000000001','counter_gv',
 '$2b$12$MmAXRX5pOgGRCIGKspy0duSlkfqxZMC6/MwjQMkaVp5nzrjYZ24n2',
 '1998-02-27','2026-03-10 00:00:00','counter.gv@jolibee.vn','0913000005','Nhân Viên Thu Ngân GV','Female','Employee',1,'Counter',5,7500000,NULL,NULL);


-- ================================================================
-- 6. INGREDIENT (10 mới, ID 11-20)
-- ================================================================
INSERT INTO Ingredient (IngredientID, IngredientName, IngredientUnit, CostPerUnit, DeletedAt) VALUES
(11, 'Dầu ăn',       'Liter',     25000, NULL),
(12, 'Muối',         'Kilogram',   5000, NULL),
(13, 'Hành lá',      'Gram',         80, NULL),
(14, 'Tỏi',          'Gram',        120, NULL),
(15, 'Ớt tươi',      'Gram',        100, NULL),
(16, 'Nấm hương',    'Gram',        200, NULL),
(17, 'Cà chua',      'Gram',         30, NULL),
(18, 'Khoai tây',    'Kilogram',  15000, NULL),
(19, 'Rau xà lách',  'Gram',         50, NULL),
(20, 'Gạo tẻ',       'Kilogram',  18000, NULL);


-- ================================================================
-- 7. PRODUCT (10 mới, ID 11-20)
-- ================================================================
INSERT INTO Product (ProductID, ProductName, ProductType, Image, Description, SoldCount, DeletedAt) VALUES
(11, 'Mì Xào Bò',         'Food',  NULL, 'Mì xào với thịt bò tươi và rau củ',         0, NULL),
(12, 'Súp Gà',            'Food',  NULL, 'Súp gà hầm đậm đà bổ dưỡng',                0, NULL),
(13, 'Hamburger',         'Food',  NULL, 'Hamburger thịt heo thơm giòn',               0, NULL),
(14, 'Khoai Chiên',       'Food',  NULL, 'Khoai tây chiên giòn vàng ươm',              0, NULL),
(15, 'Salad Tươi',        'Food',  NULL, 'Salad rau tươi sốt mè rang',                 0, NULL),
(16, 'Sinh Tố Dâu',       'Drink', NULL, 'Sinh tố dâu tây tươi pha sữa',              0, NULL),
(17, 'Chè Khúc Bạch',     'Drink', NULL, 'Chè khúc bạch thạch lá dứa mát lạnh',       0, NULL),
(18, 'Combo Đặc Biệt',    'Combo', NULL, 'Combo gồm Phở Bò + Gà Rán + Cà Phê + Đường',0, NULL),
(19, 'Combo Gà Khoai',    'Combo', NULL, 'Combo Gà Rán + Khoai Chiên + Nước Cam',     0, NULL),
(20, 'Combo Hamburger',   'Combo', NULL, 'Combo Hamburger + Khoai Chiên + Sinh Tố',   0, NULL);


-- ================================================================
-- 8. PRODUCT VARIANT (20 mới, ID 31-50)
-- ================================================================
INSERT INTO ProductVarient (ProductVarientID, ProductID, Size, Price, ForPeople, IsActive, DeletedAt) VALUES
-- Mì Xào Bò
(31, 11, 'S',  65000, 1, 1, NULL),
(32, 11, 'M',  80000, 2, 1, NULL),
-- Súp Gà
(33, 12, 'S',  55000, 1, 1, NULL),
(34, 12, 'M',  65000, 2, 1, NULL),
-- Hamburger
(35, 13, 'Default', 60000, 1, 1, NULL),
(36, 13, 'L',       80000, 2, 1, NULL),
-- Khoai Chiên
(37, 14, 'S',  25000, NULL, 1, NULL),
(38, 14, 'M',  35000, NULL, 1, NULL),
-- Salad Tươi
(39, 15, 'S',  45000, 1, 1, NULL),
(40, 15, 'M',  55000, 2, 1, NULL),
-- Sinh Tố Dâu
(41, 16, 'S',  35000, 1, 1, NULL),
(42, 16, 'M',  45000, 1, 1, NULL),
-- Chè Khúc Bạch
(43, 17, 'S',  40000, 1, 1, NULL),
(44, 17, 'M',  50000, 2, 1, NULL),
-- Combo Đặc Biệt
(45, 18, 'S', 115000, 3, 1, NULL),
(46, 18, 'M', 140000, 4, 1, NULL),
-- Combo Gà Khoai
(47, 19, 'S', 100000, 2, 1, NULL),
(48, 19, 'M', 125000, 3, 1, NULL),
-- Combo Hamburger
(49, 20, 'S',  95000, 2, 1, NULL),
(50, 20, 'M', 115000, 3, 1, NULL);


-- ================================================================
-- 9. RECIPE — Receipe (20 mới)
-- ================================================================
INSERT INTO Receipe (IngredientID, ProductVarientID, QtyBeforeProcess, QtyAfterProcess) VALUES
-- Mì Xào Bò S (ID 31)
( 2, 31, 100, 90),
(11, 31, 0.02, 0.02),
(13, 31,   20, 18),
-- Mì Xào Bò M (ID 32)
( 2, 32, 150, 130),
(11, 32, 0.03, 0.03),
-- Hamburger Default (ID 35)
( 7, 35, 120, 100),
(17, 35,  50,  45),
(14, 35,   5,   5),
-- Khoai Chiên S (ID 37)
(18, 37, 0.20, 0.18),
(11, 37, 0.02, 0.02),
-- Khoai Chiên M (ID 38)
(18, 38, 0.30, 0.27),
(11, 38, 0.03, 0.03),
-- Salad Tươi S (ID 39)
(19, 39,  50,  45),
(17, 39,  30,  28),
-- Sinh Tố Dâu S (ID 41)
( 5, 41, 0.20, 0.20),
(10, 41, 0.03, 0.03),
-- Sinh Tố Dâu M (ID 42)
( 5, 42, 0.30, 0.30),
(10, 42, 0.05, 0.05),
-- Chè Khúc Bạch S (ID 43)
( 4, 43,  15,  13),
( 5, 43, 0.10, 0.10);


-- ================================================================
-- 10. COMBO DETAIL (16 mới, tổng 20)
-- ================================================================
INSERT INTO ComboDetail (ComboID, ProductID, qty) VALUES
-- Bổ sung cho combo hiện có 9, 10
(9,  7, 1),   -- Combo Phở+CF thêm Nước Cam
(9,  8, 1),   -- Combo Phở+CF thêm Đường Thêm
(10, 7, 1),   -- Combo Cơm+Trà thêm Nước Cam
(10, 8, 1),   -- Combo Cơm+Trà thêm Đường Thêm
-- Combo 18: Đặc Biệt (4 items)
(18,  1, 1),
(18,  4, 1),
(18,  5, 1),
(18,  8, 2),
-- Combo 19: Gà Khoai (5 items)
(19,  4, 2),
(19,  5, 1),
(19,  7, 1),
(19,  8, 1),
(19, 14, 1),
-- Combo 20: Hamburger (3 items)
(20, 13, 1),
(20, 14, 1),
(20, 16, 1);


-- ================================================================
-- 11. DINING TABLE (5 mới, ID 16-20)
-- ================================================================
INSERT INTO DiningTable (TableID, StoreID, TableNumber, Capacity, Status, DeletedAt) VALUES
(16,  6, 1, 4, 'Available', NULL),
(17,  7, 1, 4, 'Available', NULL),
(18,  8, 1, 6, 'Available', NULL),
(19,  9, 1, 4, 'Available', NULL),
(20, 10, 1, 2, 'Available', NULL);


-- ================================================================
-- 12. WAREHOUSE (15 mới, WarehouseID 6-20, mỗi store 6-20 một kho)
-- ================================================================
INSERT INTO Warehouse (WarehouseID, StoreID, Capacity, DeletedAt) VALUES
( 6,  6,  900, NULL),
( 7,  7,  750, NULL),
( 8,  8, 1100, NULL),
( 9,  9,  600, NULL),
(10, 10,  850, NULL),
(11, 11, 1300, NULL),
(12, 12,  500, NULL),
(13, 13, 1400, NULL),
(14, 14,  700, NULL),
(15, 15,  650, NULL),
(16, 16,  550, NULL),
(17, 17,  450, NULL),
(18, 18,  800, NULL),
(19, 19,  400, NULL),
(20, 20,  350, NULL);


-- ================================================================
-- 13. TICKET (15 mới) + TICKET USER (15 mới)
-- ================================================================
INSERT INTO Ticket (TicketID, StartDate, EndDate, Discount, DeletedAt, UsedAt, UsedBy) VALUES
('c1c00002-0000-0000-0000-000000000001','2026-03-01','2026-12-31',0.10,NULL,NULL,NULL),
('c1c00002-0000-0000-0000-000000000002','2026-03-01','2026-12-31',0.15,NULL,NULL,NULL),
('c1c00002-0000-0000-0000-000000000003','2026-04-01','2026-10-31',0.20,NULL,NULL,NULL),
('c1c00002-0000-0000-0000-000000000004','2026-04-01','2026-10-31',0.25,NULL,NULL,NULL),
('c1c00002-0000-0000-0000-000000000005','2026-05-01','2026-12-31',0.30,NULL,NULL,NULL),
('c1c00002-0000-0000-0000-000000000006','2026-05-01','2026-12-31',0.12,NULL,NULL,NULL),
('c1c00002-0000-0000-0000-000000000007','2026-05-01','2026-09-30',0.18,NULL,NULL,NULL),
('c1c00002-0000-0000-0000-000000000008','2026-01-01','2026-06-30',0.22,NULL,NULL,NULL),
('c1c00002-0000-0000-0000-000000000009','2026-06-01','2026-12-31',0.08,NULL,NULL,NULL),
('c1c00002-0000-0000-0000-00000000000a','2026-06-01','2026-12-31',0.35,NULL,NULL,NULL),
('c1c00002-0000-0000-0000-00000000000b','2026-06-15','2026-12-31',0.05,NULL,NULL,NULL),
('c1c00002-0000-0000-0000-00000000000c','2026-07-01','2026-12-31',0.15,NULL,NULL,NULL),
('c1c00002-0000-0000-0000-00000000000d','2026-07-01','2026-12-31',0.20,NULL,NULL,NULL),
('c1c00002-0000-0000-0000-00000000000e','2026-07-15','2026-12-31',0.10,NULL,NULL,NULL),
('c1c00002-0000-0000-0000-00000000000f','2026-08-01','2026-12-31',0.25,NULL,NULL,NULL);

INSERT INTO TicketUser (TicketID, UserID) VALUES
('c1c00002-0000-0000-0000-000000000001','cafe0001-0000-0000-0000-000000000006'),
('c1c00002-0000-0000-0000-000000000002','cafe0001-0000-0000-0000-000000000007'),
('c1c00002-0000-0000-0000-000000000003','cafe0001-0000-0000-0000-000000000008'),
('c1c00002-0000-0000-0000-000000000004','cafe0001-0000-0000-0000-000000000009'),
('c1c00002-0000-0000-0000-000000000005','cafe0001-0000-0000-0000-00000000000a'),
('c1c00002-0000-0000-0000-000000000006','cafe0001-0000-0000-0000-00000000000b'),
('c1c00002-0000-0000-0000-000000000007','cafe0001-0000-0000-0000-00000000000c'),
('c1c00002-0000-0000-0000-000000000008','cafe0001-0000-0000-0000-00000000000d'),
('c1c00002-0000-0000-0000-000000000009','cafe0001-0000-0000-0000-00000000000e'),
('c1c00002-0000-0000-0000-00000000000a','cafe0001-0000-0000-0000-00000000000f'),
('c1c00002-0000-0000-0000-00000000000b','cafe0001-0000-0000-0000-000000000010'),
('c1c00002-0000-0000-0000-00000000000c','cafe0001-0000-0000-0000-000000000011'),
('c1c00002-0000-0000-0000-00000000000d','cafe0001-0000-0000-0000-000000000012'),
('c1c00002-0000-0000-0000-00000000000e','cafe0001-0000-0000-0000-000000000013'),
('c1c00002-0000-0000-0000-00000000000f','cafe0001-0000-0000-0000-000000000014');


-- ================================================================
-- 14. SHIFT (20 mới — 4 ca/ngày × 5 nhân viên bếp, ngày 13-16/05)
-- ================================================================
INSERT INTO Shift (ShiftID, EmployeeID, TimeIn, TimeOut, CheckIn, CheckOut, DeletedAt) VALUES
-- kitchen_q5 — 4 ca
('6f100001-0000-0000-0000-000000000001','e0010001-0000-0000-0000-000000000003','2026-05-13 08:00:00','2026-05-13 17:00:00','2026-05-13 07:58:00','2026-05-13 17:02:00',NULL),
('6f100001-0000-0000-0000-000000000002','e0010001-0000-0000-0000-000000000003','2026-05-14 08:00:00','2026-05-14 17:00:00','2026-05-14 08:05:00','2026-05-14 17:01:00',NULL),
('6f100001-0000-0000-0000-000000000003','e0010001-0000-0000-0000-000000000003','2026-05-15 08:00:00','2026-05-15 17:00:00','2026-05-15 08:00:00','2026-05-15 17:00:00',NULL),
('6f100001-0000-0000-0000-000000000004','e0010001-0000-0000-0000-000000000003','2026-05-16 08:00:00','2026-05-16 17:00:00','2026-05-16 08:03:00','2026-05-16 17:04:00',NULL),
-- kitchen_q1 — 4 ca
('6f100001-0000-0000-0000-000000000005','e0020001-0000-0000-0000-000000000003','2026-05-13 08:00:00','2026-05-13 17:00:00','2026-05-13 08:01:00','2026-05-13 17:00:00',NULL),
('6f100001-0000-0000-0000-000000000006','e0020001-0000-0000-0000-000000000003','2026-05-14 08:00:00','2026-05-14 17:00:00','2026-05-14 07:56:00','2026-05-14 17:02:00',NULL),
('6f100001-0000-0000-0000-000000000007','e0020001-0000-0000-0000-000000000003','2026-05-15 08:00:00','2026-05-15 17:00:00','2026-05-15 08:07:00','2026-05-15 17:03:00',NULL),
('6f100001-0000-0000-0000-000000000008','e0020001-0000-0000-0000-000000000003','2026-05-16 08:00:00','2026-05-16 17:00:00','2026-05-16 08:00:00','2026-05-16 17:00:00',NULL),
-- kitchen_q3 — 4 ca
('6f100001-0000-0000-0000-000000000009','e0030001-0000-0000-0000-000000000003','2026-05-13 08:00:00','2026-05-13 17:00:00','2026-05-13 08:04:00','2026-05-13 17:01:00',NULL),
('6f100001-0000-0000-0000-00000000000a','e0030001-0000-0000-0000-000000000003','2026-05-14 08:00:00','2026-05-14 17:00:00','2026-05-14 08:00:00','2026-05-14 17:05:00',NULL),
('6f100001-0000-0000-0000-00000000000b','e0030001-0000-0000-0000-000000000003','2026-05-15 08:00:00','2026-05-15 17:00:00','2026-05-15 08:10:00','2026-05-15 17:00:00',NULL),
('6f100001-0000-0000-0000-00000000000c','e0030001-0000-0000-0000-000000000003','2026-05-16 08:00:00','2026-05-16 17:00:00','2026-05-16 07:59:00','2026-05-16 17:02:00',NULL),
-- kitchen_bt — 4 ca
('6f100001-0000-0000-0000-00000000000d','e0040001-0000-0000-0000-000000000003','2026-05-13 08:00:00','2026-05-13 17:00:00','2026-05-13 08:00:00','2026-05-13 17:00:00',NULL),
('6f100001-0000-0000-0000-00000000000e','e0040001-0000-0000-0000-000000000003','2026-05-14 08:00:00','2026-05-14 17:00:00','2026-05-14 08:06:00','2026-05-14 17:01:00',NULL),
('6f100001-0000-0000-0000-00000000000f','e0040001-0000-0000-0000-000000000003','2026-05-15 08:00:00','2026-05-15 17:00:00','2026-05-15 08:02:00','2026-05-15 17:03:00',NULL),
('6f100001-0000-0000-0000-000000000010','e0040001-0000-0000-0000-000000000003','2026-05-16 08:00:00','2026-05-16 17:00:00','2026-05-16 08:00:00','2026-05-16 17:00:00',NULL),
-- kitchen_gv — 4 ca
('6f100001-0000-0000-0000-000000000011','e0050001-0000-0000-0000-000000000003','2026-05-13 08:00:00','2026-05-13 17:00:00','2026-05-13 08:08:00','2026-05-13 17:04:00',NULL),
('6f100001-0000-0000-0000-000000000012','e0050001-0000-0000-0000-000000000003','2026-05-14 08:00:00','2026-05-14 17:00:00','2026-05-14 08:00:00','2026-05-14 17:00:00',NULL),
('6f100001-0000-0000-0000-000000000013','e0050001-0000-0000-0000-000000000003','2026-05-15 08:00:00','2026-05-15 17:00:00','2026-05-15 08:03:00','2026-05-15 17:02:00',NULL),
('6f100001-0000-0000-0000-000000000014','e0050001-0000-0000-0000-000000000003','2026-05-16 08:00:00','2026-05-16 17:00:00','2026-05-16 08:01:00','2026-05-16 17:01:00',NULL);


-- ================================================================
-- 15. PURCHASE ORDER (15 mới, ID b0000002-...-001 đến ...-00f)
--     Mỗi PO có 2 PODetail + 2 POApproval
-- ================================================================
INSERT INTO PurchaseOrder (POID, StoreID, SupplierID, TaxRate, Total, DeletedAt) VALUES
('b0000002-0000-0000-0000-000000000001', 1,  6, 0.10,  935000, NULL),
('b0000002-0000-0000-0000-000000000002', 2,  7, 0.10,  660000, NULL),
('b0000002-0000-0000-0000-000000000003', 3,  8, 0.10, 1100000, NULL),
('b0000002-0000-0000-0000-000000000004', 4,  9, 0.10,  440000, NULL),
('b0000002-0000-0000-0000-000000000005', 5, 10, 0.10,  880000, NULL),
('b0000002-0000-0000-0000-000000000006', 1, 11, 0.10,  550000, NULL),
('b0000002-0000-0000-0000-000000000007', 2, 12, 0.10,  770000, NULL),
('b0000002-0000-0000-0000-000000000008', 3, 13, 0.10, 1320000, NULL),
('b0000002-0000-0000-0000-000000000009', 4, 14, 0.10,  495000, NULL),
('b0000002-0000-0000-0000-00000000000a', 5, 15, 0.10,  605000, NULL),
('b0000002-0000-0000-0000-00000000000b', 1, 16, 0.10,  330000, NULL),
('b0000002-0000-0000-0000-00000000000c', 2, 17, 0.10, 1045000, NULL),
('b0000002-0000-0000-0000-00000000000d', 3, 18, 0.10,  715000, NULL),
('b0000002-0000-0000-0000-00000000000e', 4, 19, 0.10, 1210000, NULL),
('b0000002-0000-0000-0000-00000000000f', 5, 20, 0.10,  880000, NULL);

-- PODetail (2 dòng / PO = 30 dòng)
INSERT INTO PODetail (POID, IngredientID, Quantity, UnitPriceExpected) VALUES
('b0000002-0000-0000-0000-000000000001', 11,  20, 25000),
('b0000002-0000-0000-0000-000000000001', 18,  20, 15000),
('b0000002-0000-0000-0000-000000000002', 12,  50,  5000),
('b0000002-0000-0000-0000-000000000002', 13,2000,     80),
('b0000002-0000-0000-0000-000000000003', 14,3000,    120),
('b0000002-0000-0000-0000-000000000003', 15,2000,    100),
('b0000002-0000-0000-0000-000000000004', 16,1000,    200),
('b0000002-0000-0000-0000-000000000004', 17,3000,     30),
('b0000002-0000-0000-0000-000000000005', 19,2000,     50),
('b0000002-0000-0000-0000-000000000005', 20,  30, 18000),
('b0000002-0000-0000-0000-000000000006', 11,  10, 25000),
('b0000002-0000-0000-0000-000000000006', 12,  20,  5000),
('b0000002-0000-0000-0000-000000000007', 13,1500,     80),
('b0000002-0000-0000-0000-000000000007', 14,2500,    120),
('b0000002-0000-0000-0000-000000000008', 15,3000,    100),
('b0000002-0000-0000-0000-000000000008', 16,2000,    200),
('b0000002-0000-0000-0000-000000000009', 17,4000,     30),
('b0000002-0000-0000-0000-000000000009', 18,  15, 15000),
('b0000002-0000-0000-0000-00000000000a', 19,1500,     50),
('b0000002-0000-0000-0000-00000000000a', 20,  20, 18000),
('b0000002-0000-0000-0000-00000000000b', 11,   5, 25000),
('b0000002-0000-0000-0000-00000000000b', 13,1000,     80),
('b0000002-0000-0000-0000-00000000000c', 14,2000,    120),
('b0000002-0000-0000-0000-00000000000c',  3,2000,    150),
('b0000002-0000-0000-0000-00000000000d', 18,  25, 15000),
('b0000002-0000-0000-0000-00000000000d', 19,2500,     50),
('b0000002-0000-0000-0000-00000000000e',  7,2000,    120),
('b0000002-0000-0000-0000-00000000000e',  2,3000,    200),
('b0000002-0000-0000-0000-00000000000f',  8,   5, 80000),
('b0000002-0000-0000-0000-00000000000f',  9, 100,  5000);

-- POApproval (2 bước / PO: Submitted → Ordered)
INSERT INTO POApproval (POApprovalID, POID, EmployeeID, LastUpdated, Comment, CancelledReason, POStatus) VALUES
('b0a00002-0000-0000-0000-000000000001','b0000002-0000-0000-0000-000000000001','e0010001-0000-0000-0000-000000000001','2026-05-13 08:00:00','Tạo đơn',NULL,'Submitted'),
('b0a00002-0000-0000-0000-000000000002','b0000002-0000-0000-0000-000000000001','e0010001-0000-0000-0000-000000000001','2026-05-14 09:00:00','Đã đặt NCC',NULL,'Ordered'),
('b0a00002-0000-0000-0000-000000000003','b0000002-0000-0000-0000-000000000002','e0020001-0000-0000-0000-000000000001','2026-05-13 08:30:00','Tạo đơn',NULL,'Submitted'),
('b0a00002-0000-0000-0000-000000000004','b0000002-0000-0000-0000-000000000002','e0020001-0000-0000-0000-000000000001','2026-05-14 09:30:00','Đã đặt NCC',NULL,'Ordered'),
('b0a00002-0000-0000-0000-000000000005','b0000002-0000-0000-0000-000000000003','e0030001-0000-0000-0000-000000000001','2026-05-13 09:00:00','Tạo đơn',NULL,'Submitted'),
('b0a00002-0000-0000-0000-000000000006','b0000002-0000-0000-0000-000000000003','e0030001-0000-0000-0000-000000000001','2026-05-14 10:00:00','Đã đặt NCC',NULL,'Ordered'),
('b0a00002-0000-0000-0000-000000000007','b0000002-0000-0000-0000-000000000004','e0040001-0000-0000-0000-000000000001','2026-05-13 09:30:00','Tạo đơn',NULL,'Submitted'),
('b0a00002-0000-0000-0000-000000000008','b0000002-0000-0000-0000-000000000004','e0040001-0000-0000-0000-000000000001','2026-05-14 10:30:00','Đã đặt NCC',NULL,'Ordered'),
('b0a00002-0000-0000-0000-000000000009','b0000002-0000-0000-0000-000000000005','e0050001-0000-0000-0000-000000000001','2026-05-13 10:00:00','Tạo đơn',NULL,'Submitted'),
('b0a00002-0000-0000-0000-00000000000a','b0000002-0000-0000-0000-000000000005','e0050001-0000-0000-0000-000000000001','2026-05-14 11:00:00','Đã đặt NCC',NULL,'Ordered'),
('b0a00002-0000-0000-0000-00000000000b','b0000002-0000-0000-0000-000000000006','e0010001-0000-0000-0000-000000000001','2026-05-14 08:00:00','Tạo đơn',NULL,'Submitted'),
('b0a00002-0000-0000-0000-00000000000c','b0000002-0000-0000-0000-000000000006','e0010001-0000-0000-0000-000000000001','2026-05-15 09:00:00','Đã đặt NCC',NULL,'Ordered'),
('b0a00002-0000-0000-0000-00000000000d','b0000002-0000-0000-0000-000000000007','e0020001-0000-0000-0000-000000000001','2026-05-14 08:30:00','Tạo đơn',NULL,'Submitted'),
('b0a00002-0000-0000-0000-00000000000e','b0000002-0000-0000-0000-000000000007','e0020001-0000-0000-0000-000000000001','2026-05-15 09:30:00','Đã đặt NCC',NULL,'Ordered'),
('b0a00002-0000-0000-0000-00000000000f','b0000002-0000-0000-0000-000000000008','e0030001-0000-0000-0000-000000000001','2026-05-14 09:00:00','Tạo đơn',NULL,'Submitted'),
('b0a00002-0000-0000-0000-000000000010','b0000002-0000-0000-0000-000000000008','e0030001-0000-0000-0000-000000000001','2026-05-15 10:00:00','Đã đặt NCC',NULL,'Ordered'),
('b0a00002-0000-0000-0000-000000000011','b0000002-0000-0000-0000-000000000009','e0040001-0000-0000-0000-000000000001','2026-05-14 09:30:00','Tạo đơn',NULL,'Submitted'),
('b0a00002-0000-0000-0000-000000000012','b0000002-0000-0000-0000-000000000009','e0040001-0000-0000-0000-000000000001','2026-05-15 10:30:00','Đã đặt NCC',NULL,'Ordered'),
('b0a00002-0000-0000-0000-000000000013','b0000002-0000-0000-0000-00000000000a','e0050001-0000-0000-0000-000000000001','2026-05-14 10:00:00','Tạo đơn',NULL,'Submitted'),
('b0a00002-0000-0000-0000-000000000014','b0000002-0000-0000-0000-00000000000a','e0050001-0000-0000-0000-000000000001','2026-05-15 11:00:00','Đã đặt NCC',NULL,'Ordered'),
('b0a00002-0000-0000-0000-000000000015','b0000002-0000-0000-0000-00000000000b','e0010001-0000-0000-0000-000000000001','2026-05-15 08:00:00','Tạo đơn',NULL,'Submitted'),
('b0a00002-0000-0000-0000-000000000016','b0000002-0000-0000-0000-00000000000b','e0010001-0000-0000-0000-000000000001','2026-05-16 09:00:00','Đã đặt NCC',NULL,'Ordered'),
('b0a00002-0000-0000-0000-000000000017','b0000002-0000-0000-0000-00000000000c','e0020001-0000-0000-0000-000000000001','2026-05-15 08:30:00','Tạo đơn',NULL,'Submitted'),
('b0a00002-0000-0000-0000-000000000018','b0000002-0000-0000-0000-00000000000c','e0020001-0000-0000-0000-000000000001','2026-05-16 09:30:00','Đã đặt NCC',NULL,'Ordered'),
('b0a00002-0000-0000-0000-000000000019','b0000002-0000-0000-0000-00000000000d','e0030001-0000-0000-0000-000000000001','2026-05-15 09:00:00','Tạo đơn',NULL,'Submitted'),
('b0a00002-0000-0000-0000-00000000001a','b0000002-0000-0000-0000-00000000000d','e0030001-0000-0000-0000-000000000001','2026-05-16 10:00:00','Đã đặt NCC',NULL,'Ordered'),
('b0a00002-0000-0000-0000-00000000001b','b0000002-0000-0000-0000-00000000000e','e0040001-0000-0000-0000-000000000001','2026-05-15 09:30:00','Tạo đơn',NULL,'Submitted'),
('b0a00002-0000-0000-0000-00000000001c','b0000002-0000-0000-0000-00000000000e','e0040001-0000-0000-0000-000000000001','2026-05-16 10:30:00','Đã đặt NCC',NULL,'Ordered'),
('b0a00002-0000-0000-0000-00000000001d','b0000002-0000-0000-0000-00000000000f','e0050001-0000-0000-0000-000000000001','2026-05-15 10:00:00','Tạo đơn',NULL,'Submitted'),
('b0a00002-0000-0000-0000-00000000001e','b0000002-0000-0000-0000-00000000000f','e0050001-0000-0000-0000-000000000001','2026-05-16 11:00:00','Đã đặt NCC',NULL,'Ordered');


-- ================================================================
-- 16. RECEIPT (15 mới) + RECEIPT DETAIL (30 mới) + RECEIPT CHANGE (30 mới)
-- ================================================================
INSERT INTO Receipt (ReceiptID, DateReceive, DeletedAt, EmployeeID, StoreID, SupplierID, POID) VALUES
('6ec00002-0000-0000-0000-000000000001','2026-05-15 10:00:00',NULL,'e0010001-0000-0000-0000-000000000003',1, 6,'b0000002-0000-0000-0000-000000000001'),
('6ec00002-0000-0000-0000-000000000002','2026-05-15 10:30:00',NULL,'e0020001-0000-0000-0000-000000000003',2, 7,'b0000002-0000-0000-0000-000000000002'),
('6ec00002-0000-0000-0000-000000000003','2026-05-15 11:00:00',NULL,'e0030001-0000-0000-0000-000000000003',3, 8,'b0000002-0000-0000-0000-000000000003'),
('6ec00002-0000-0000-0000-000000000004','2026-05-15 11:30:00',NULL,'e0040001-0000-0000-0000-000000000003',4, 9,'b0000002-0000-0000-0000-000000000004'),
('6ec00002-0000-0000-0000-000000000005','2026-05-15 12:00:00',NULL,'e0050001-0000-0000-0000-000000000003',5,10,'b0000002-0000-0000-0000-000000000005'),
('6ec00002-0000-0000-0000-000000000006','2026-05-16 09:00:00',NULL,'e0010001-0000-0000-0000-000000000003',1,11,'b0000002-0000-0000-0000-000000000006'),
('6ec00002-0000-0000-0000-000000000007','2026-05-16 09:30:00',NULL,'e0020001-0000-0000-0000-000000000003',2,12,'b0000002-0000-0000-0000-000000000007'),
('6ec00002-0000-0000-0000-000000000008','2026-05-16 10:00:00',NULL,'e0030001-0000-0000-0000-000000000003',3,13,'b0000002-0000-0000-0000-000000000008'),
('6ec00002-0000-0000-0000-000000000009','2026-05-16 10:30:00',NULL,'e0040001-0000-0000-0000-000000000003',4,14,'b0000002-0000-0000-0000-000000000009'),
('6ec00002-0000-0000-0000-00000000000a','2026-05-16 11:00:00',NULL,'e0050001-0000-0000-0000-000000000003',5,15,'b0000002-0000-0000-0000-00000000000a'),
('6ec00002-0000-0000-0000-00000000000b','2026-05-17 09:00:00',NULL,'e0010001-0000-0000-0000-000000000003',1,16,'b0000002-0000-0000-0000-00000000000b'),
('6ec00002-0000-0000-0000-00000000000c','2026-05-17 09:30:00',NULL,'e0020001-0000-0000-0000-000000000003',2,17,'b0000002-0000-0000-0000-00000000000c'),
('6ec00002-0000-0000-0000-00000000000d','2026-05-17 10:00:00',NULL,'e0030001-0000-0000-0000-000000000003',3,18,'b0000002-0000-0000-0000-00000000000d'),
('6ec00002-0000-0000-0000-00000000000e','2026-05-17 10:30:00',NULL,'e0040001-0000-0000-0000-000000000003',4,19,'b0000002-0000-0000-0000-00000000000e'),
('6ec00002-0000-0000-0000-00000000000f','2026-05-17 11:00:00',NULL,'e0050001-0000-0000-0000-000000000003',5,20,'b0000002-0000-0000-0000-00000000000f');

INSERT INTO ReceiptDetail (GoodsReceiptID, IngredientID, Quantity, GoodQuantity, UnitPrice) VALUES
('6ec00002-0000-0000-0000-000000000001', 11,  20,  20, 25000),
('6ec00002-0000-0000-0000-000000000001', 18,  20,  19, 15000),
('6ec00002-0000-0000-0000-000000000002', 12,  50,  50,  5000),
('6ec00002-0000-0000-0000-000000000002', 13,2000,1980,    80),
('6ec00002-0000-0000-0000-000000000003', 14,3000,2950,   120),
('6ec00002-0000-0000-0000-000000000003', 15,2000,1960,   100),
('6ec00002-0000-0000-0000-000000000004', 16,1000,1000,   200),
('6ec00002-0000-0000-0000-000000000004', 17,3000,2950,    30),
('6ec00002-0000-0000-0000-000000000005', 19,2000,1980,    50),
('6ec00002-0000-0000-0000-000000000005', 20,  30,  30, 18000),
('6ec00002-0000-0000-0000-000000000006', 11,  10,  10, 25000),
('6ec00002-0000-0000-0000-000000000006', 12,  20,  20,  5000),
('6ec00002-0000-0000-0000-000000000007', 13,1500,1480,    80),
('6ec00002-0000-0000-0000-000000000007', 14,2500,2450,   120),
('6ec00002-0000-0000-0000-000000000008', 15,3000,2900,   100),
('6ec00002-0000-0000-0000-000000000008', 16,2000,1980,   200),
('6ec00002-0000-0000-0000-000000000009', 17,4000,3950,    30),
('6ec00002-0000-0000-0000-000000000009', 18,  15,  15, 15000),
('6ec00002-0000-0000-0000-00000000000a', 19,1500,1480,    50),
('6ec00002-0000-0000-0000-00000000000a', 20,  20,  20, 18000),
('6ec00002-0000-0000-0000-00000000000b', 11,   5,   5, 25000),
('6ec00002-0000-0000-0000-00000000000b', 13,1000, 990,    80),
('6ec00002-0000-0000-0000-00000000000c', 14,2000,1980,   120),
('6ec00002-0000-0000-0000-00000000000c',  3,2000,1980,   150),
('6ec00002-0000-0000-0000-00000000000d', 18,  25,  25, 15000),
('6ec00002-0000-0000-0000-00000000000d', 19,2500,2450,    50),
('6ec00002-0000-0000-0000-00000000000e',  7,2000,1950,   120),
('6ec00002-0000-0000-0000-00000000000e',  2,3000,3000,   200),
('6ec00002-0000-0000-0000-00000000000f',  8,   5,   5, 80000),
('6ec00002-0000-0000-0000-00000000000f',  9, 100,  99,  5000);

INSERT INTO ReceiptChange (ReceiptChangeID, ReceiptID, Status, EmployeeID, UpdateAt) VALUES
('6c000002-0000-0000-0000-000000000001','6ec00002-0000-0000-0000-000000000001','Preparing', 'e0010001-0000-0000-0000-000000000003','2026-05-15 09:00:00'),
('6c000002-0000-0000-0000-000000000002','6ec00002-0000-0000-0000-000000000001','Received',  'e0010001-0000-0000-0000-000000000003','2026-05-15 11:00:00'),
('6c000002-0000-0000-0000-000000000003','6ec00002-0000-0000-0000-000000000002','Preparing', 'e0020001-0000-0000-0000-000000000003','2026-05-15 09:30:00'),
('6c000002-0000-0000-0000-000000000004','6ec00002-0000-0000-0000-000000000002','Received',  'e0020001-0000-0000-0000-000000000003','2026-05-15 11:30:00'),
('6c000002-0000-0000-0000-000000000005','6ec00002-0000-0000-0000-000000000003','Preparing', 'e0030001-0000-0000-0000-000000000003','2026-05-15 10:00:00'),
('6c000002-0000-0000-0000-000000000006','6ec00002-0000-0000-0000-000000000003','Received',  'e0030001-0000-0000-0000-000000000003','2026-05-15 12:00:00'),
('6c000002-0000-0000-0000-000000000007','6ec00002-0000-0000-0000-000000000004','Preparing', 'e0040001-0000-0000-0000-000000000003','2026-05-15 10:30:00'),
('6c000002-0000-0000-0000-000000000008','6ec00002-0000-0000-0000-000000000004','Received',  'e0040001-0000-0000-0000-000000000003','2026-05-15 12:30:00'),
('6c000002-0000-0000-0000-000000000009','6ec00002-0000-0000-0000-000000000005','Preparing', 'e0050001-0000-0000-0000-000000000003','2026-05-15 11:00:00'),
('6c000002-0000-0000-0000-00000000000a','6ec00002-0000-0000-0000-000000000005','Received',  'e0050001-0000-0000-0000-000000000003','2026-05-15 13:00:00'),
('6c000002-0000-0000-0000-00000000000b','6ec00002-0000-0000-0000-000000000006','Preparing', 'e0010001-0000-0000-0000-000000000003','2026-05-16 08:00:00'),
('6c000002-0000-0000-0000-00000000000c','6ec00002-0000-0000-0000-000000000006','Received',  'e0010001-0000-0000-0000-000000000003','2026-05-16 10:00:00'),
('6c000002-0000-0000-0000-00000000000d','6ec00002-0000-0000-0000-000000000007','Preparing', 'e0020001-0000-0000-0000-000000000003','2026-05-16 08:30:00'),
('6c000002-0000-0000-0000-00000000000e','6ec00002-0000-0000-0000-000000000007','Received',  'e0020001-0000-0000-0000-000000000003','2026-05-16 10:30:00'),
('6c000002-0000-0000-0000-00000000000f','6ec00002-0000-0000-0000-000000000008','Preparing', 'e0030001-0000-0000-0000-000000000003','2026-05-16 09:00:00'),
('6c000002-0000-0000-0000-000000000010','6ec00002-0000-0000-0000-000000000008','Received',  'e0030001-0000-0000-0000-000000000003','2026-05-16 11:00:00'),
('6c000002-0000-0000-0000-000000000011','6ec00002-0000-0000-0000-000000000009','Preparing', 'e0040001-0000-0000-0000-000000000003','2026-05-16 09:30:00'),
('6c000002-0000-0000-0000-000000000012','6ec00002-0000-0000-0000-000000000009','Received',  'e0040001-0000-0000-0000-000000000003','2026-05-16 11:30:00'),
('6c000002-0000-0000-0000-000000000013','6ec00002-0000-0000-0000-00000000000a','Preparing', 'e0050001-0000-0000-0000-000000000003','2026-05-16 10:00:00'),
('6c000002-0000-0000-0000-000000000014','6ec00002-0000-0000-0000-00000000000a','Received',  'e0050001-0000-0000-0000-000000000003','2026-05-16 12:00:00'),
('6c000002-0000-0000-0000-000000000015','6ec00002-0000-0000-0000-00000000000b','Preparing', 'e0010001-0000-0000-0000-000000000003','2026-05-17 08:00:00'),
('6c000002-0000-0000-0000-000000000016','6ec00002-0000-0000-0000-00000000000b','Received',  'e0010001-0000-0000-0000-000000000003','2026-05-17 10:00:00'),
('6c000002-0000-0000-0000-000000000017','6ec00002-0000-0000-0000-00000000000c','Preparing', 'e0020001-0000-0000-0000-000000000003','2026-05-17 08:30:00'),
('6c000002-0000-0000-0000-000000000018','6ec00002-0000-0000-0000-00000000000c','Received',  'e0020001-0000-0000-0000-000000000003','2026-05-17 10:30:00'),
('6c000002-0000-0000-0000-000000000019','6ec00002-0000-0000-0000-00000000000d','Preparing', 'e0030001-0000-0000-0000-000000000003','2026-05-17 09:00:00'),
('6c000002-0000-0000-0000-00000000001a','6ec00002-0000-0000-0000-00000000000d','Received',  'e0030001-0000-0000-0000-000000000003','2026-05-17 11:00:00'),
('6c000002-0000-0000-0000-00000000001b','6ec00002-0000-0000-0000-00000000000e','Preparing', 'e0040001-0000-0000-0000-000000000003','2026-05-17 09:30:00'),
('6c000002-0000-0000-0000-00000000001c','6ec00002-0000-0000-0000-00000000000e','Received',  'e0040001-0000-0000-0000-000000000003','2026-05-17 11:30:00'),
('6c000002-0000-0000-0000-00000000001d','6ec00002-0000-0000-0000-00000000000f','Preparing', 'e0050001-0000-0000-0000-000000000003','2026-05-17 10:00:00'),
('6c000002-0000-0000-0000-00000000001e','6ec00002-0000-0000-0000-00000000000f','Received',  'e0050001-0000-0000-0000-000000000003','2026-05-17 12:00:00');


-- ================================================================
-- 17. INVENTORY BATCH (20 mới — BatchType = 'Processed')
--     Phân bổ: 4 lô/kho cho kho 1-5
-- ================================================================
INSERT INTO InventoryBatch (
  BatchID, WarehouseID, ImportDate, Exp, Mfd,
  QuantityOriginal, QuantityOnHand, Status, UnitCost,
  UpdatedAt, BatchCode, Note,
  IngredientID, GoodsReceiptID,
  ReceiptDetailGoodsReceiptID, ReceiptDetailIngredientID,
  BatchType
) VALUES
-- Kho 1: 4 lô processed
('bab00001-0000-0000-0000-000000000001',1,'2026-05-15 12:00:00','2026-08-15','2026-05-15', 80, 80,'Available',25000,NULL,'PROC-DAU-20260515', NULL,11,NULL,NULL,NULL,'Processed'),
('bab00001-0000-0000-0000-000000000002',1,'2026-05-15 12:00:00','2026-11-15','2026-05-15',200,200,'Available', 5000,NULL,'PROC-MUOI-20260515',NULL,12,NULL,NULL,NULL,'Processed'),
('bab00001-0000-0000-0000-000000000003',1,'2026-05-15 12:00:00','2026-06-30','2026-05-15',500,500,'Available',  120,NULL,'PROC-TOI-20260515', NULL,14,NULL,NULL,NULL,'Processed'),
('bab00001-0000-0000-0000-000000000004',1,'2026-05-15 12:00:00','2026-07-15','2026-05-15', 60, 60,'Available',15000,NULL,'PROC-KHOAI-20260515',NULL,18,NULL,NULL,NULL,'Processed'),
-- Kho 2: 4 lô processed
('bab00001-0000-0000-0000-000000000005',2,'2026-05-16 09:00:00','2026-06-16','2026-05-16',800,800,'Available',   80,NULL,'PROC-HANH-20260516', NULL,13,NULL,NULL,NULL,'Processed'),
('bab00001-0000-0000-0000-000000000006',2,'2026-05-16 09:00:00','2026-06-16','2026-05-16',500,500,'Available',  100,NULL,'PROC-OT-20260516',   NULL,15,NULL,NULL,NULL,'Processed'),
('bab00001-0000-0000-0000-000000000007',2,'2026-05-16 09:00:00','2026-07-16','2026-05-16',300,300,'Available',  200,NULL,'PROC-NAM-20260516',  NULL,16,NULL,NULL,NULL,'Processed'),
('bab00001-0000-0000-0000-000000000008',2,'2026-05-16 09:00:00','2026-06-30','2026-05-16',600,600,'Available',   30,NULL,'PROC-CHUA-20260516', NULL,17,NULL,NULL,NULL,'Processed'),
-- Kho 3: 4 lô processed
('bab00001-0000-0000-0000-000000000009',3,'2026-05-16 10:00:00','2026-06-16','2026-05-16',400,400,'Available',   50,NULL,'PROC-RAU-20260516',  NULL,19,NULL,NULL,NULL,'Processed'),
('bab00001-0000-0000-0000-00000000000a',3,'2026-05-16 10:00:00','2026-11-16','2026-05-16', 50, 50,'Available',18000,NULL,'PROC-GAO-20260516',  NULL,20,NULL,NULL,NULL,'Processed'),
('bab00001-0000-0000-0000-00000000000b',3,'2026-05-16 10:00:00','2026-08-16','2026-05-16', 40, 40,'Available',25000,NULL,'PROC-DAU2-20260516', NULL,11,NULL,NULL,NULL,'Processed'),
('bab00001-0000-0000-0000-00000000000c',3,'2026-05-16 10:00:00','2026-11-16','2026-05-16',100,100,'Available', 5000,NULL,'PROC-MUOI2-20260516',NULL,12,NULL,NULL,NULL,'Processed'),
-- Kho 4: 4 lô processed
('bab00001-0000-0000-0000-00000000000d',4,'2026-05-17 09:00:00','2026-07-17','2026-05-17',700,700,'Available',  120,NULL,'PROC-TOI2-20260517', NULL,14,NULL,NULL,NULL,'Processed'),
('bab00001-0000-0000-0000-00000000000e',4,'2026-05-17 09:00:00','2026-06-30','2026-05-17',200,200,'Available',  100,NULL,'PROC-OT2-20260517',  NULL,15,NULL,NULL,NULL,'Processed'),
('bab00001-0000-0000-0000-00000000000f',4,'2026-05-17 09:00:00','2026-07-17','2026-05-17',150,150,'Available',  200,NULL,'PROC-NAM2-20260517', NULL,16,NULL,NULL,NULL,'Processed'),
('bab00001-0000-0000-0000-000000000010',4,'2026-05-17 09:00:00','2026-06-30','2026-05-17',400,400,'Available',   30,NULL,'PROC-CHUA2-20260517',NULL,17,NULL,NULL,NULL,'Processed'),
-- Kho 5: 4 lô processed
('bab00001-0000-0000-0000-000000000011',5,'2026-05-17 10:00:00','2026-06-17','2026-05-17',300,300,'Available',   50,NULL,'PROC-RAU2-20260517', NULL,19,NULL,NULL,NULL,'Processed'),
('bab00001-0000-0000-0000-000000000012',5,'2026-05-17 10:00:00','2026-11-17','2026-05-17', 30, 30,'Available',18000,NULL,'PROC-GAO2-20260517', NULL,20,NULL,NULL,NULL,'Processed'),
('bab00001-0000-0000-0000-000000000013',5,'2026-05-17 10:00:00','2026-09-17','2026-05-17', 60, 60,'Available',15000,NULL,'PROC-KHOAI2-20260517',NULL,18,NULL,NULL,NULL,'Processed'),
('bab00001-0000-0000-0000-000000000014',5,'2026-05-17 10:00:00','2026-08-17','2026-05-17', 25, 25,'Available',25000,NULL,'PROC-DAU3-20260517', NULL,11,NULL,NULL,NULL,'Processed');


-- ================================================================
-- 18. STOCK MOVEMENT (20 mới — nhập kho processed từ sơ chế)
-- ================================================================
INSERT INTO StockMovement (StockMovementID, BatchID, EmployeeID, QtyChange, MovementType, ReferenceType, TimeStamp, Reason, Note, DeleteAt) VALUES
('5ba00001-0000-0000-0000-000000000001','bab00001-0000-0000-0000-000000000001','e0010001-0000-0000-0000-000000000003',  80,'Processing','Manual','2026-05-15 12:30:00','Nhập lô dầu ăn đã sơ chế',NULL,NULL),
('5ba00001-0000-0000-0000-000000000002','bab00001-0000-0000-0000-000000000002','e0010001-0000-0000-0000-000000000003', 200,'Processing','Manual','2026-05-15 12:30:00','Nhập lô muối đã sơ chế',NULL,NULL),
('5ba00001-0000-0000-0000-000000000003','bab00001-0000-0000-0000-000000000003','e0010001-0000-0000-0000-000000000003', 500,'Processing','Manual','2026-05-15 12:30:00','Nhập lô tỏi đã sơ chế',NULL,NULL),
('5ba00001-0000-0000-0000-000000000004','bab00001-0000-0000-0000-000000000004','e0010001-0000-0000-0000-000000000003',  60,'Processing','Manual','2026-05-15 12:30:00','Nhập lô khoai tây đã sơ chế',NULL,NULL),
('5ba00001-0000-0000-0000-000000000005','bab00001-0000-0000-0000-000000000005','e0020001-0000-0000-0000-000000000003', 800,'Processing','Manual','2026-05-16 09:30:00','Nhập lô hành lá đã sơ chế',NULL,NULL),
('5ba00001-0000-0000-0000-000000000006','bab00001-0000-0000-0000-000000000006','e0020001-0000-0000-0000-000000000003', 500,'Processing','Manual','2026-05-16 09:30:00','Nhập lô ớt tươi đã sơ chế',NULL,NULL),
('5ba00001-0000-0000-0000-000000000007','bab00001-0000-0000-0000-000000000007','e0020001-0000-0000-0000-000000000003', 300,'Processing','Manual','2026-05-16 09:30:00','Nhập lô nấm hương đã sơ chế',NULL,NULL),
('5ba00001-0000-0000-0000-000000000008','bab00001-0000-0000-0000-000000000008','e0020001-0000-0000-0000-000000000003', 600,'Processing','Manual','2026-05-16 09:30:00','Nhập lô cà chua đã sơ chế',NULL,NULL),
('5ba00001-0000-0000-0000-000000000009','bab00001-0000-0000-0000-000000000009','e0030001-0000-0000-0000-000000000003', 400,'Processing','Manual','2026-05-16 10:30:00','Nhập lô rau xà lách đã sơ chế',NULL,NULL),
('5ba00001-0000-0000-0000-00000000000a','bab00001-0000-0000-0000-00000000000a','e0030001-0000-0000-0000-000000000003',  50,'Processing','Manual','2026-05-16 10:30:00','Nhập lô gạo đã sơ chế',NULL,NULL),
('5ba00001-0000-0000-0000-00000000000b','bab00001-0000-0000-0000-00000000000b','e0030001-0000-0000-0000-000000000003',  40,'Processing','Manual','2026-05-16 10:30:00','Nhập lô dầu ăn (kho 3)',NULL,NULL),
('5ba00001-0000-0000-0000-00000000000c','bab00001-0000-0000-0000-00000000000c','e0030001-0000-0000-0000-000000000003', 100,'Processing','Manual','2026-05-16 10:30:00','Nhập lô muối (kho 3)',NULL,NULL),
('5ba00001-0000-0000-0000-00000000000d','bab00001-0000-0000-0000-00000000000d','e0040001-0000-0000-0000-000000000003', 700,'Processing','Manual','2026-05-17 09:30:00','Nhập lô tỏi đã sơ chế (kho 4)',NULL,NULL),
('5ba00001-0000-0000-0000-00000000000e','bab00001-0000-0000-0000-00000000000e','e0040001-0000-0000-0000-000000000003', 200,'Processing','Manual','2026-05-17 09:30:00','Nhập lô ớt đã sơ chế (kho 4)',NULL,NULL),
('5ba00001-0000-0000-0000-00000000000f','bab00001-0000-0000-0000-00000000000f','e0040001-0000-0000-0000-000000000003', 150,'Processing','Manual','2026-05-17 09:30:00','Nhập lô nấm đã sơ chế (kho 4)',NULL,NULL),
('5ba00001-0000-0000-0000-000000000010','bab00001-0000-0000-0000-000000000010','e0040001-0000-0000-0000-000000000003', 400,'Processing','Manual','2026-05-17 09:30:00','Nhập lô cà chua (kho 4)',NULL,NULL),
('5ba00001-0000-0000-0000-000000000011','bab00001-0000-0000-0000-000000000011','e0050001-0000-0000-0000-000000000003', 300,'Processing','Manual','2026-05-17 10:30:00','Nhập lô rau (kho 5)',NULL,NULL),
('5ba00001-0000-0000-0000-000000000012','bab00001-0000-0000-0000-000000000012','e0050001-0000-0000-0000-000000000003',  30,'Processing','Manual','2026-05-17 10:30:00','Nhập lô gạo (kho 5)',NULL,NULL),
('5ba00001-0000-0000-0000-000000000013','bab00001-0000-0000-0000-000000000013','e0050001-0000-0000-0000-000000000003',  60,'Processing','Manual','2026-05-17 10:30:00','Nhập lô khoai (kho 5)',NULL,NULL),
('5ba00001-0000-0000-0000-000000000014','bab00001-0000-0000-0000-000000000014','e0050001-0000-0000-0000-000000000003',  25,'Processing','Manual','2026-05-17 10:30:00','Nhập lô dầu ăn (kho 5)',NULL,NULL);

-- ================================================================
-- 19. BILL (20 mới — tất cả giao hàng)
-- ================================================================
INSERT INTO Bill (
  BillID, UserID, StoreID, VAT, PaymentMethods, Note,
  Total, MoneyReceived, MoneyGiveBack,
  TableID, AddressID, Contact, TicketID, DeliveryInfoID, DeletedAt
) VALUES
('b1000002-0000-0000-0000-000000000001','cafe0001-0000-0000-0000-000000000006',1,0.10,'Cash',  'Giao hang tan noi', 71500, 72000, 500, NULL,'add00001-0000-0000-0000-000000000070','0902000001',NULL,'de000002-0000-0000-0000-000000000001',NULL),
('b1000002-0000-0000-0000-000000000002','cafe0001-0000-0000-0000-000000000007',2,0.10,'Cash',  'Giao hang tan noi', 88000, 90000,2000, NULL,'add00001-0000-0000-0000-000000000071','0902000002',NULL,'de000002-0000-0000-0000-000000000002',NULL),
('b1000002-0000-0000-0000-000000000003','cafe0001-0000-0000-0000-000000000008',3,0.10,'Cash',  'Giao hang tan noi', 60500, 61000, 500, NULL,'add00001-0000-0000-0000-000000000072','0902000003',NULL,'de000002-0000-0000-0000-000000000003',NULL),
('b1000002-0000-0000-0000-000000000004','cafe0001-0000-0000-0000-000000000009',4,0.10,'Card',  'Giao hang tan noi', 71500, 71500,   0, NULL,'add00001-0000-0000-0000-000000000073','0902000004',NULL,'de000002-0000-0000-0000-000000000004',NULL),
('b1000002-0000-0000-0000-000000000005','cafe0001-0000-0000-0000-00000000000a',5,0.10,'Cash',  'Giao hang tan noi', 66000, 70000,4000, NULL,'add00001-0000-0000-0000-000000000074','0902000005',NULL,'de000002-0000-0000-0000-000000000005',NULL),
('b1000002-0000-0000-0000-000000000006','cafe0001-0000-0000-0000-00000000000b',1,0.10,'Card',  'Giao hang tan noi', 88000, 88000,   0, NULL,'add00001-0000-0000-0000-000000000075','0902000006',NULL,'de000002-0000-0000-0000-000000000006',NULL),
('b1000002-0000-0000-0000-000000000007','cafe0001-0000-0000-0000-00000000000c',2,0.10,'Cash',  'Giao hang tan noi', 27500, 30000,2500, NULL,'add00001-0000-0000-0000-000000000076','0902000007',NULL,'de000002-0000-0000-0000-000000000007',NULL),
('b1000002-0000-0000-0000-000000000008','cafe0001-0000-0000-0000-00000000000d',3,0.10,'Cash',  'Giao hang tan noi', 38500, 40000,1500, NULL,'add00001-0000-0000-0000-000000000077','0902000008',NULL,'de000002-0000-0000-0000-000000000008',NULL),
('b1000002-0000-0000-0000-000000000009','cafe0001-0000-0000-0000-00000000000e',4,0.10,'Card',  'Giao hang tan noi', 49500, 49500,   0, NULL,'add00001-0000-0000-0000-000000000078','0902000009',NULL,'de000002-0000-0000-0000-000000000009',NULL),
('b1000002-0000-0000-0000-00000000000a','cafe0001-0000-0000-0000-00000000000f',5,0.10,'Cash',  'Giao hang tan noi', 60500, 61000, 500, NULL,'add00001-0000-0000-0000-000000000079','0902000010',NULL,'de000002-0000-0000-0000-00000000000a',NULL),
('b1000002-0000-0000-0000-00000000000b','cafe0001-0000-0000-0000-000000000010',1,0.10,'Card',  'Giao hang tan noi', 38500, 38500,   0, NULL,'add00001-0000-0000-0000-00000000007a','0902000011',NULL,'de000002-0000-0000-0000-00000000000b',NULL),
('b1000002-0000-0000-0000-00000000000c','cafe0001-0000-0000-0000-000000000011',2,0.10,'Cash',  'Giao hang tan noi', 49500, 50000, 500, NULL,'add00001-0000-0000-0000-00000000007b','0902000012',NULL,'de000002-0000-0000-0000-00000000000c',NULL),
('b1000002-0000-0000-0000-00000000000d','cafe0001-0000-0000-0000-000000000012',3,0.10,'Card',  'Giao hang tan noi', 44000, 44000,   0, NULL,'add00001-0000-0000-0000-00000000007c','0902000013',NULL,'de000002-0000-0000-0000-00000000000d',NULL),
('b1000002-0000-0000-0000-00000000000e','cafe0001-0000-0000-0000-000000000013',4,0.10,'Cash',  'Giao hang tan noi', 55000, 55000,   0, NULL,'add00001-0000-0000-0000-00000000007d','0902000014',NULL,'de000002-0000-0000-0000-00000000000e',NULL),
('b1000002-0000-0000-0000-00000000000f','cafe0001-0000-0000-0000-000000000014',5,0.10,'Card',  'Giao hang tan noi',126500,126500,   0, NULL,'add00001-0000-0000-0000-00000000007e','0902000015',NULL,'de000002-0000-0000-0000-00000000000f',NULL),
('b1000002-0000-0000-0000-000000000010','cafe0001-0000-0000-0000-000000000006',1,0.10,'Card',  'Giao hang tan noi',154000,154000,   0, NULL,'add00001-0000-0000-0000-000000000070','0902000001',NULL,'de000002-0000-0000-0000-000000000010',NULL),
('b1000002-0000-0000-0000-000000000011','cafe0001-0000-0000-0000-000000000007',2,0.10,'Card',  'Giao hang tan noi',110000,110000,   0, NULL,'add00001-0000-0000-0000-000000000071','0902000002',NULL,'de000002-0000-0000-0000-000000000011',NULL),
('b1000002-0000-0000-0000-000000000012','cafe0001-0000-0000-0000-000000000008',3,0.10,'Cash',  'Giao hang tan noi',137500,140000,2500, NULL,'add00001-0000-0000-0000-000000000072','0902000003',NULL,'de000002-0000-0000-0000-000000000012',NULL),
('b1000002-0000-0000-0000-000000000013','cafe0001-0000-0000-0000-000000000009',4,0.10,'Cash',  'Giao hang tan noi',104500,105000, 500, NULL,'add00001-0000-0000-0000-000000000073','0902000004',NULL,'de000002-0000-0000-0000-000000000013',NULL),
('b1000002-0000-0000-0000-000000000014','cafe0001-0000-0000-0000-00000000000a',5,0.10,'Card',  'Giao hang tan noi',126500,126500,   0, NULL,'add00001-0000-0000-0000-000000000074','0902000005',NULL,'de000002-0000-0000-0000-000000000014',NULL);


-- ================================================================
-- 20. BILL DETAIL (20 moi — 1 san pham / bill, variant 31-50)
-- ================================================================
INSERT INTO BillDetail (BillID, ProductVarientID, Quantity, Price, InlineTotal) VALUES
('b1000002-0000-0000-0000-000000000001', 31, 1,  65000,  65000),
('b1000002-0000-0000-0000-000000000002', 32, 1,  80000,  80000),
('b1000002-0000-0000-0000-000000000003', 33, 1,  55000,  55000),
('b1000002-0000-0000-0000-000000000004', 34, 1,  65000,  65000),
('b1000002-0000-0000-0000-000000000005', 35, 1,  60000,  60000),
('b1000002-0000-0000-0000-000000000006', 36, 1,  80000,  80000),
('b1000002-0000-0000-0000-000000000007', 37, 1,  25000,  25000),
('b1000002-0000-0000-0000-000000000008', 38, 1,  35000,  35000),
('b1000002-0000-0000-0000-000000000009', 39, 1,  45000,  45000),
('b1000002-0000-0000-0000-00000000000a', 40, 1,  55000,  55000),
('b1000002-0000-0000-0000-00000000000b', 41, 1,  35000,  35000),
('b1000002-0000-0000-0000-00000000000c', 42, 1,  45000,  45000),
('b1000002-0000-0000-0000-00000000000d', 43, 1,  40000,  40000),
('b1000002-0000-0000-0000-00000000000e', 44, 1,  50000,  50000),
('b1000002-0000-0000-0000-00000000000f', 45, 1, 115000, 115000),
('b1000002-0000-0000-0000-000000000010', 46, 1, 140000, 140000),
('b1000002-0000-0000-0000-000000000011', 47, 1, 100000, 100000),
('b1000002-0000-0000-0000-000000000012', 48, 1, 125000, 125000),
('b1000002-0000-0000-0000-000000000013', 49, 1,  95000,  95000),
('b1000002-0000-0000-0000-000000000014', 50, 1, 115000, 115000);


-- ================================================================
-- 21. BILL CHANGE (20 moi — trang thai Paid cho moi bill)
-- ================================================================
INSERT INTO BillChange (BillChangeID, BillID, EmployeeID, ChangeAt, Status) VALUES
('bc000002-0000-0000-0000-000000000001','b1000002-0000-0000-0000-000000000001','e0010001-0000-0000-0000-000000000002','2026-05-20 10:30:00','Paid'),
('bc000002-0000-0000-0000-000000000002','b1000002-0000-0000-0000-000000000002','e0020001-0000-0000-0000-000000000002','2026-05-20 11:00:00','Paid'),
('bc000002-0000-0000-0000-000000000003','b1000002-0000-0000-0000-000000000003','e0030001-0000-0000-0000-000000000002','2026-05-20 11:30:00','Paid'),
('bc000002-0000-0000-0000-000000000004','b1000002-0000-0000-0000-000000000004','e0040001-0000-0000-0000-000000000002','2026-05-20 12:00:00','Paid'),
('bc000002-0000-0000-0000-000000000005','b1000002-0000-0000-0000-000000000005','e0050001-0000-0000-0000-000000000002','2026-05-20 12:30:00','Paid'),
('bc000002-0000-0000-0000-000000000006','b1000002-0000-0000-0000-000000000006','e0010001-0000-0000-0000-000000000002','2026-05-21 09:00:00','Paid'),
('bc000002-0000-0000-0000-000000000007','b1000002-0000-0000-0000-000000000007','e0020001-0000-0000-0000-000000000002','2026-05-21 09:30:00','Paid'),
('bc000002-0000-0000-0000-000000000008','b1000002-0000-0000-0000-000000000008','e0030001-0000-0000-0000-000000000002','2026-05-21 10:00:00','Paid'),
('bc000002-0000-0000-0000-000000000009','b1000002-0000-0000-0000-000000000009','e0040001-0000-0000-0000-000000000002','2026-05-21 10:30:00','Paid'),
('bc000002-0000-0000-0000-00000000000a','b1000002-0000-0000-0000-00000000000a','e0050001-0000-0000-0000-000000000002','2026-05-21 11:00:00','Paid'),
('bc000002-0000-0000-0000-00000000000b','b1000002-0000-0000-0000-00000000000b','e0010001-0000-0000-0000-000000000002','2026-05-22 09:00:00','Paid'),
('bc000002-0000-0000-0000-00000000000c','b1000002-0000-0000-0000-00000000000c','e0020001-0000-0000-0000-000000000002','2026-05-22 09:30:00','Paid'),
('bc000002-0000-0000-0000-00000000000d','b1000002-0000-0000-0000-00000000000d','e0030001-0000-0000-0000-000000000002','2026-05-22 10:00:00','Paid'),
('bc000002-0000-0000-0000-00000000000e','b1000002-0000-0000-0000-00000000000e','e0040001-0000-0000-0000-000000000002','2026-05-22 10:30:00','Paid'),
('bc000002-0000-0000-0000-00000000000f','b1000002-0000-0000-0000-00000000000f','e0050001-0000-0000-0000-000000000002','2026-05-22 11:00:00','Paid'),
('bc000002-0000-0000-0000-000000000010','b1000002-0000-0000-0000-000000000010','e0010001-0000-0000-0000-000000000002','2026-05-23 09:00:00','Paid'),
('bc000002-0000-0000-0000-000000000011','b1000002-0000-0000-0000-000000000011','e0020001-0000-0000-0000-000000000002','2026-05-23 09:30:00','Paid'),
('bc000002-0000-0000-0000-000000000012','b1000002-0000-0000-0000-000000000012','e0030001-0000-0000-0000-000000000002','2026-05-23 10:00:00','Paid'),
('bc000002-0000-0000-0000-000000000013','b1000002-0000-0000-0000-000000000013','e0040001-0000-0000-0000-000000000002','2026-05-23 10:30:00','Paid'),
('bc000002-0000-0000-0000-000000000014','b1000002-0000-0000-0000-000000000014','e0050001-0000-0000-0000-000000000002','2026-05-23 11:00:00','Paid');


-- ================================================================
-- 22. DELIVERY INFO (20 moi — 1 don / bill)
-- ================================================================
INSERT INTO DeliveryInfo (DeliveryID, BillID, UserID, AddressID, ShippingFee, Note, DeletedAt) VALUES
('de000002-0000-0000-0000-000000000001','b1000002-0000-0000-0000-000000000001','cafe0001-0000-0000-0000-000000000006','add00001-0000-0000-0000-000000000070',15000,NULL,NULL),
('de000002-0000-0000-0000-000000000002','b1000002-0000-0000-0000-000000000002','cafe0001-0000-0000-0000-000000000007','add00001-0000-0000-0000-000000000071',15000,NULL,NULL),
('de000002-0000-0000-0000-000000000003','b1000002-0000-0000-0000-000000000003','cafe0001-0000-0000-0000-000000000008','add00001-0000-0000-0000-000000000072',15000,NULL,NULL),
('de000002-0000-0000-0000-000000000004','b1000002-0000-0000-0000-000000000004','cafe0001-0000-0000-0000-000000000009','add00001-0000-0000-0000-000000000073',20000,NULL,NULL),
('de000002-0000-0000-0000-000000000005','b1000002-0000-0000-0000-000000000005','cafe0001-0000-0000-0000-00000000000a','add00001-0000-0000-0000-000000000074',20000,NULL,NULL),
('de000002-0000-0000-0000-000000000006','b1000002-0000-0000-0000-000000000006','cafe0001-0000-0000-0000-00000000000b','add00001-0000-0000-0000-000000000075',15000,NULL,NULL),
('de000002-0000-0000-0000-000000000007','b1000002-0000-0000-0000-000000000007','cafe0001-0000-0000-0000-00000000000c','add00001-0000-0000-0000-000000000076',15000,NULL,NULL),
('de000002-0000-0000-0000-000000000008','b1000002-0000-0000-0000-000000000008','cafe0001-0000-0000-0000-00000000000d','add00001-0000-0000-0000-000000000077',15000,NULL,NULL),
('de000002-0000-0000-0000-000000000009','b1000002-0000-0000-0000-000000000009','cafe0001-0000-0000-0000-00000000000e','add00001-0000-0000-0000-000000000078',20000,NULL,NULL),
('de000002-0000-0000-0000-00000000000a','b1000002-0000-0000-0000-00000000000a','cafe0001-0000-0000-0000-00000000000f','add00001-0000-0000-0000-000000000079',20000,NULL,NULL),
('de000002-0000-0000-0000-00000000000b','b1000002-0000-0000-0000-00000000000b','cafe0001-0000-0000-0000-000000000010','add00001-0000-0000-0000-00000000007a',15000,NULL,NULL),
('de000002-0000-0000-0000-00000000000c','b1000002-0000-0000-0000-00000000000c','cafe0001-0000-0000-0000-000000000011','add00001-0000-0000-0000-00000000007b',15000,NULL,NULL),
('de000002-0000-0000-0000-00000000000d','b1000002-0000-0000-0000-00000000000d','cafe0001-0000-0000-0000-000000000012','add00001-0000-0000-0000-00000000007c',15000,NULL,NULL),
('de000002-0000-0000-0000-00000000000e','b1000002-0000-0000-0000-00000000000e','cafe0001-0000-0000-0000-000000000013','add00001-0000-0000-0000-00000000007d',20000,NULL,NULL),
('de000002-0000-0000-0000-00000000000f','b1000002-0000-0000-0000-00000000000f','cafe0001-0000-0000-0000-000000000014','add00001-0000-0000-0000-00000000007e',20000,NULL,NULL),
('de000002-0000-0000-0000-000000000010','b1000002-0000-0000-0000-000000000010','cafe0001-0000-0000-0000-000000000006','add00001-0000-0000-0000-000000000070',15000,NULL,NULL),
('de000002-0000-0000-0000-000000000011','b1000002-0000-0000-0000-000000000011','cafe0001-0000-0000-0000-000000000007','add00001-0000-0000-0000-000000000071',15000,NULL,NULL),
('de000002-0000-0000-0000-000000000012','b1000002-0000-0000-0000-000000000012','cafe0001-0000-0000-0000-000000000008','add00001-0000-0000-0000-000000000072',15000,NULL,NULL),
('de000002-0000-0000-0000-000000000013','b1000002-0000-0000-0000-000000000013','cafe0001-0000-0000-0000-000000000009','add00001-0000-0000-0000-000000000073',20000,NULL,NULL),
('de000002-0000-0000-0000-000000000014','b1000002-0000-0000-0000-000000000014','cafe0001-0000-0000-0000-00000000000a','add00001-0000-0000-0000-000000000074',20000,NULL,NULL);


-- ================================================================
-- 23. DELIVERY LOG (20 moi — 1 log Delivered / don)
-- ================================================================
INSERT INTO DeliveryLog (LogID, DeliveryID, EmployeeID, Status, ChangeAt, Note) VALUES
('d1000002-0000-0000-0000-000000000001','de000002-0000-0000-0000-000000000001','e0010001-0000-0000-0000-000000000002','Delivered','2026-05-20 12:00:00',NULL),
('d1000002-0000-0000-0000-000000000002','de000002-0000-0000-0000-000000000002','e0020001-0000-0000-0000-000000000002','Delivered','2026-05-20 12:30:00',NULL),
('d1000002-0000-0000-0000-000000000003','de000002-0000-0000-0000-000000000003','e0030001-0000-0000-0000-000000000002','Delivered','2026-05-20 13:00:00',NULL),
('d1000002-0000-0000-0000-000000000004','de000002-0000-0000-0000-000000000004','e0040001-0000-0000-0000-000000000002','Delivered','2026-05-20 13:30:00',NULL),
('d1000002-0000-0000-0000-000000000005','de000002-0000-0000-0000-000000000005','e0050001-0000-0000-0000-000000000002','Delivered','2026-05-20 14:00:00',NULL),
('d1000002-0000-0000-0000-000000000006','de000002-0000-0000-0000-000000000006','e0010001-0000-0000-0000-000000000002','Delivered','2026-05-21 11:00:00',NULL),
('d1000002-0000-0000-0000-000000000007','de000002-0000-0000-0000-000000000007','e0020001-0000-0000-0000-000000000002','Delivered','2026-05-21 11:30:00',NULL),
('d1000002-0000-0000-0000-000000000008','de000002-0000-0000-0000-000000000008','e0030001-0000-0000-0000-000000000002','Delivered','2026-05-21 12:00:00',NULL),
('d1000002-0000-0000-0000-000000000009','de000002-0000-0000-0000-000000000009','e0040001-0000-0000-0000-000000000002','Delivered','2026-05-21 12:30:00',NULL),
('d1000002-0000-0000-0000-00000000000a','de000002-0000-0000-0000-00000000000a','e0050001-0000-0000-0000-000000000002','Delivered','2026-05-21 13:00:00',NULL),
('d1000002-0000-0000-0000-00000000000b','de000002-0000-0000-0000-00000000000b','e0010001-0000-0000-0000-000000000002','Delivered','2026-05-22 11:30:00',NULL),
('d1000002-0000-0000-0000-00000000000c','de000002-0000-0000-0000-00000000000c','e0020001-0000-0000-0000-000000000002','Delivered','2026-05-22 12:00:00',NULL),
('d1000002-0000-0000-0000-00000000000d','de000002-0000-0000-0000-00000000000d','e0030001-0000-0000-0000-000000000002','Delivered','2026-05-22 12:30:00',NULL),
('d1000002-0000-0000-0000-00000000000e','de000002-0000-0000-0000-00000000000e','e0040001-0000-0000-0000-000000000002','Delivered','2026-05-22 13:00:00',NULL),
('d1000002-0000-0000-0000-00000000000f','de000002-0000-0000-0000-00000000000f','e0050001-0000-0000-0000-000000000002','Delivered','2026-05-22 13:30:00',NULL),
('d1000002-0000-0000-0000-000000000010','de000002-0000-0000-0000-000000000010','e0010001-0000-0000-0000-000000000002','Delivered','2026-05-23 11:00:00',NULL),
('d1000002-0000-0000-0000-000000000011','de000002-0000-0000-0000-000000000011','e0020001-0000-0000-0000-000000000002','Delivered','2026-05-23 11:30:00',NULL),
('d1000002-0000-0000-0000-000000000012','de000002-0000-0000-0000-000000000012','e0030001-0000-0000-0000-000000000002','Delivered','2026-05-23 12:00:00',NULL),
('d1000002-0000-0000-0000-000000000013','de000002-0000-0000-0000-000000000013','e0040001-0000-0000-0000-000000000002','Delivered','2026-05-23 12:30:00',NULL),
('d1000002-0000-0000-0000-000000000014','de000002-0000-0000-0000-000000000014','e0050001-0000-0000-0000-000000000002','Delivered','2026-05-23 13:00:00',NULL);


-- ================================================================
-- 24. GUEST CUSTOMER (14 moi — tong 20)
-- ================================================================
INSERT INTO GuestCustomer (Phone, Name, LastBillAt) VALUES
('0901111101','Pham Thi Anh',    '2026-05-20 10:00:00'),
('0901111102','Nguyen Van Binh', '2026-05-20 11:00:00'),
('0901111103','Le Thi Chau',     '2026-05-21 09:30:00'),
('0901111104','Tran Van Dung',   '2026-05-21 10:30:00'),
('0901111105','Hoang Thi Em',    '2026-05-21 14:00:00'),
('0901111106','Do Van Phuc',     '2026-05-22 09:00:00'),
('0901111107','Vu Thi Giang',    '2026-05-22 10:00:00'),
('0901111108','Bui Van Hai',     '2026-05-22 11:30:00'),
('0901111109','Dang Thi Y',      '2026-05-22 14:00:00'),
('0901111110','Ngo Van Kien',    '2026-05-23 08:30:00'),
('0901111111','Dinh Thi Lan',    '2026-05-23 10:00:00'),
('0901111112','Ly Van Minh',     '2026-05-23 11:00:00'),
('0901111113','To Thi Nga',      '2026-05-24 09:00:00'),
('0901111114','Cao Van Oanh',    '2026-05-24 10:30:00');


-- ================================================================
-- 25. PROCESSING LOG (20 moi)
-- ================================================================
INSERT INTO ProcessingLog (ProcessingID, EmployeeID, ProcessedAt, Note, DeletedAt) VALUES
('b1a00001-0000-0000-0000-000000000001','e0010001-0000-0000-0000-000000000003','2026-05-15 12:00:00','So che dau an lo 1',NULL),
('b1a00001-0000-0000-0000-000000000002','e0010001-0000-0000-0000-000000000003','2026-05-15 12:30:00','So che muoi lo 1',NULL),
('b1a00001-0000-0000-0000-000000000003','e0010001-0000-0000-0000-000000000003','2026-05-15 13:00:00','So che toi lo 1',NULL),
('b1a00001-0000-0000-0000-000000000004','e0010001-0000-0000-0000-000000000003','2026-05-15 13:30:00','So che khoai tay lo 1',NULL),
('b1a00001-0000-0000-0000-000000000005','e0020001-0000-0000-0000-000000000003','2026-05-16 09:00:00','So che hanh la lo 1',NULL),
('b1a00001-0000-0000-0000-000000000006','e0020001-0000-0000-0000-000000000003','2026-05-16 09:30:00','So che ot tuoi lo 1',NULL),
('b1a00001-0000-0000-0000-000000000007','e0020001-0000-0000-0000-000000000003','2026-05-16 10:00:00','So che nam huong lo 1',NULL),
('b1a00001-0000-0000-0000-000000000008','e0020001-0000-0000-0000-000000000003','2026-05-16 10:30:00','So che ca chua lo 1',NULL),
('b1a00001-0000-0000-0000-000000000009','e0030001-0000-0000-0000-000000000003','2026-05-16 11:00:00','So che rau xa lach lo 1',NULL),
('b1a00001-0000-0000-0000-00000000000a','e0030001-0000-0000-0000-000000000003','2026-05-16 11:30:00','So che gao te lo 1',NULL),
('b1a00001-0000-0000-0000-00000000000b','e0030001-0000-0000-0000-000000000003','2026-05-16 12:00:00','So che dau an lo 2',NULL),
('b1a00001-0000-0000-0000-00000000000c','e0040001-0000-0000-0000-000000000003','2026-05-16 12:30:00','So che muoi lo 2',NULL),
('b1a00001-0000-0000-0000-00000000000d','e0040001-0000-0000-0000-000000000003','2026-05-17 09:00:00','So che toi lo 2',NULL),
('b1a00001-0000-0000-0000-00000000000e','e0040001-0000-0000-0000-000000000003','2026-05-17 09:30:00','So che ot tuoi lo 2',NULL),
('b1a00001-0000-0000-0000-00000000000f','e0050001-0000-0000-0000-000000000003','2026-05-17 10:00:00','So che nam huong lo 2',NULL),
('b1a00001-0000-0000-0000-000000000010','e0050001-0000-0000-0000-000000000003','2026-05-17 10:30:00','So che ca chua lo 2',NULL),
('b1a00001-0000-0000-0000-000000000011','e0010001-0000-0000-0000-000000000003','2026-05-18 09:00:00','So che rau xa lach lo 2',NULL),
('b1a00001-0000-0000-0000-000000000012','e0010001-0000-0000-0000-000000000003','2026-05-18 09:30:00','So che gao te lo 2',NULL),
('b1a00001-0000-0000-0000-000000000013','e0020001-0000-0000-0000-000000000003','2026-05-19 09:00:00','So che khoai tay lo 2',NULL),
('b1a00001-0000-0000-0000-000000000014','e0030001-0000-0000-0000-000000000003','2026-05-20 09:00:00','So che dau an lo 3',NULL);


-- ================================================================
-- 26. PROCESSING DETAIL (20 moi — composite PK ProcessingID+SourceBatchID)
--     SourceBatchID: lo nguyen lieu tho (tu seed_full.sql)
--     OutputBatchID: lo thanh pham (tu section 17 tren)
-- ================================================================
INSERT INTO ProcessingDetail
  (ProcessingID, SourceBatchID, InputKg, OutputIngredientID, OutputPieces, BagCount, PiecesPerBag, WasteNote, OutputBatchID)
VALUES
('b1a00001-0000-0000-0000-000000000001','ba100001-0000-0000-0000-000000000001',100,11, 80, 8,10,NULL,'bab00001-0000-0000-0000-000000000001'),
('b1a00001-0000-0000-0000-000000000002','ba100001-0000-0000-0000-000000000002',220,12,200,10,20,NULL,'bab00001-0000-0000-0000-000000000002'),
('b1a00001-0000-0000-0000-000000000003','ba100001-0000-0000-0000-000000000003', 60,14,500,10,50,NULL,'bab00001-0000-0000-0000-000000000003'),
('b1a00001-0000-0000-0000-000000000004','ba200001-0000-0000-0000-000000000001', 70,18, 60, 6,10,NULL,'bab00001-0000-0000-0000-000000000004'),
('b1a00001-0000-0000-0000-000000000005','ba200001-0000-0000-0000-000000000002',  1,13,800,20,40,NULL,'bab00001-0000-0000-0000-000000000005'),
('b1a00001-0000-0000-0000-000000000006','ba200001-0000-0000-0000-000000000003', 10,15,500,10,50,NULL,'bab00001-0000-0000-0000-000000000006'),
('b1a00001-0000-0000-0000-000000000007','ba300001-0000-0000-0000-000000000001',200,16,300,10,30,NULL,'bab00001-0000-0000-0000-000000000007'),
('b1a00001-0000-0000-0000-000000000008','ba300001-0000-0000-0000-000000000002',  1,17,600,20,30,NULL,'bab00001-0000-0000-0000-000000000008'),
('b1a00001-0000-0000-0000-000000000009','ba300001-0000-0000-0000-000000000003', 10,19,400,10,40,NULL,'bab00001-0000-0000-0000-000000000009'),
('b1a00001-0000-0000-0000-00000000000a','ba400001-0000-0000-0000-000000000001',  5,20, 50, 5,10,NULL,'bab00001-0000-0000-0000-00000000000a'),
('b1a00001-0000-0000-0000-00000000000b','ba400001-0000-0000-0000-000000000002',  1,11, 40, 4,10,NULL,'bab00001-0000-0000-0000-00000000000b'),
('b1a00001-0000-0000-0000-00000000000c','ba400001-0000-0000-0000-000000000003',  1,12,100,10,10,NULL,'bab00001-0000-0000-0000-00000000000c'),
('b1a00001-0000-0000-0000-00000000000d','ba500001-0000-0000-0000-000000000001', 10,14,700,14,50,NULL,'bab00001-0000-0000-0000-00000000000d'),
('b1a00001-0000-0000-0000-00000000000e','ba500001-0000-0000-0000-000000000002',  1,15,200,10,20,NULL,'bab00001-0000-0000-0000-00000000000e'),
('b1a00001-0000-0000-0000-00000000000f','ba500001-0000-0000-0000-000000000003',  1,16,150, 5,30,NULL,'bab00001-0000-0000-0000-00000000000f'),
('b1a00001-0000-0000-0000-000000000010','ba100001-0000-0000-0000-000000000001',  5,17,400,20,20,NULL,'bab00001-0000-0000-0000-000000000010'),
('b1a00001-0000-0000-0000-000000000011','ba100001-0000-0000-0000-000000000002',  2,19,300,10,30,NULL,'bab00001-0000-0000-0000-000000000011'),
('b1a00001-0000-0000-0000-000000000012','ba100001-0000-0000-0000-000000000003',  3,20, 30, 3,10,NULL,'bab00001-0000-0000-0000-000000000012'),
('b1a00001-0000-0000-0000-000000000013','ba200001-0000-0000-0000-000000000001',0.8,18, 60, 6,10,NULL,'bab00001-0000-0000-0000-000000000013'),
('b1a00001-0000-0000-0000-000000000014','ba200001-0000-0000-0000-000000000002',0.5,11, 25, 5, 5,NULL,'bab00001-0000-0000-0000-000000000014');


SET FOREIGN_KEY_CHECKS = 1;

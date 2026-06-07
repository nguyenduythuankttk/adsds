# Luồng hoạt động — Đặt Bill & Nhập/Xuất Kho

> Sơ đồ vẽ theo **đúng code hiện tại** (`BillService`, `DeliveryService`, `ReceiptService`,
> `PurchaseOrderService`, `ProcessingService`, `SePayService`). Mở bằng VS Code
> (Markdown Preview) hoặc bất kỳ trình xem Mermaid nào.

Quy ước lane (làn bơi):
- 👤 **Khách / User** (web) · 🧑‍🍳 **Nhân viên** · 👔 **Quản lý** · ⚙️ **Backend/Hệ thống** · 💳 **SePay**

---

## 1) Đặt bill TẠI QUÁN (DineIn) — nhân viên là người thao tác

```mermaid
flowchart TD
    subgraph NV["🧑‍🍳 Nhân viên (tại quầy)"]
        N1["Đăng nhập → tự động check-in ca"]
        N2{"Có ca làm hôm nay?"}
        N3["⛔ Bị chặn thao tác đơn (requireShift)"]
        N4["Chọn bàn (tuỳ chọn) + món + SĐT khách + hình thức TT"]
        N5["Bấm tạo hóa đơn"]
        N6["Đưa QR cho khách"]
        N7["✅ In hóa đơn / ra món"]
    end
    subgraph BE["⚙️ Backend — CreateDineInBill (1 transaction)"]
        B1["Kiểm tra: có món, có EmployeeID, cửa hàng tồn tại"]
        B2{"Bàn còn hóa đơn CHƯA thanh toán?"}
        B3["❌ Báo lỗi: bàn đang bận"]
        B4["Total = Σ(giá×SL)×(1+VAT 10%) → áp ticket → làm tròn"]
        B5{"Hình thức thanh toán?"}
        B6["Tiền mặt/Thẻ → PaymentStatus=Paid ngay + tính tiền thối"]
        B7["Chuyển khoản → Pending + sinh mã CK + QR"]
        B8["ConsumeIngredients: TRỪ KHO ngay (FEFO, lô đã sơ chế)"]
        B9{"Đủ nguyên liệu?"}
        B10["❌ Rollback CẢ bill — 'Món X đã hết hàng'"]
        B11["Ghi BillChange=Create → lưu DB → commit"]
    end
    subgraph KH["👤 Khách"]
        K1["Quét QR & chuyển khoản"]
    end
    SEPAY["💳 SePay webhook xác nhận đủ tiền → PaymentStatus=Paid, BillChange=Paid"]
    CANCEL["⏱️ Quá 3 phút chưa trả → CancelUnpaidBill → Failed (BillChange=Delete)"]

    N1 --> N2
    N2 -- Không --> N3
    N2 -- Có --> N4 --> N5 --> B1 --> B2
    B2 -- Có --> B3
    B2 -- Không --> B4 --> B5
    B5 -- "Tiền mặt/Thẻ" --> B6 --> B8
    B5 -- "Chuyển khoản" --> B7 --> B8
    B8 --> B9
    B9 -- Không --> B10
    B9 -- Có --> B11 --> N7
    B7 -. hiện QR .-> N6 --> K1 --> SEPAY
    K1 -. không trả .-> CANCEL
```

**Lưu ý quan trọng:** DineIn **trừ kho ngay lúc tạo bill** (kể cả đơn chuyển khoản còn Pending).
Nếu thiếu nguyên liệu → rollback toàn bộ, hóa đơn không được tạo.

---

## 2) Đặt bill GIAO HÀNG (Delivery) — khách đặt, nhân viên xử lý

```mermaid
flowchart TD
    subgraph KH["👤 Khách (web)"]
        U1["Duyệt menu (index/menu) → thêm vào giỏ"]
        U2["Mở checkout (cq-modal): chọn địa chỉ, cửa hàng, TT, hẹn giờ, ticket"]
        U3["Đặt đơn"]
        U4["Quét QR & chuyển khoản (nếu CK)"]
        U5["Theo dõi trạng thái đơn"]
    end
    subgraph BE["⚙️ Backend — CreateDeliveryBill (1 transaction)"]
        B1["Kiểm tra: có món, cửa hàng & user tồn tại"]
        B2["Resolve địa chỉ (đã chọn / mặc định)"]
        B3["Resolve cửa hàng: ƯU TIÊN cửa hàng khách chọn, else gần nhất"]
        B4["EnsureIngredientsAvailable — CHỈ kiểm tra, KHÔNG trừ"]
        B5{"Cửa hàng đủ nguyên liệu?"}
        B6["❌ Báo: 'Vui lòng chọn cửa hàng khác'"]
        B7["Total + phí ship (Haversine; tối thiểu 15k; chặn nếu > max km)"]
        B8{"Hình thức TT?"}
        B9["Tiền mặt/Thẻ → Paid + tạo DeliveryLog=Pending"]
        B10["Chuyển khoản → Pending + QR (CHƯA tạo log)"]
        B11["Lưu Bill + DeliveryInfo (KHÔNG trừ kho) → commit"]
    end
    SEPAY["💳 SePay webhook → Paid → tạo DeliveryLog=Pending (vào hàng chờ giao)"]
    subgraph NVS["🧑‍🍳 Nhân viên cửa hàng (có ca) — UpdateDelivery"]
        D1["Pending → Confirmed"]
        D2["→ Preparing: ConsumeIngredientsForDelivery TRỪ KHO (idempotent; rollback nếu thiếu)"]
        D3["→ OnTheWay (đơn hẹn giờ: chỉ từ 15' trước giờ hẹn)"]
        D4{"→ Delivered: hình thức TT?"}
        D5["Tiền mặt: nhập tiền khách ≥ tổng+ship → Paid"]
        D6["Thẻ/CK: bắt buộc đã Paid mới cho giao"]
        D7["✅ Hoàn tất"]
    end

    U1 --> U2 --> U3 --> B1 --> B2 --> B3 --> B4 --> B5
    B5 -- Không --> B6
    B5 -- Có --> B7 --> B8
    B8 -- "Tiền mặt/Thẻ" --> B9 --> B11
    B8 -- "Chuyển khoản" --> B10 --> B11
    B11 --> U5
    B9 --> D1
    B10 -. khách trả .-> U4 --> SEPAY --> D1
    D1 --> D2 --> D3 --> D4
    D4 -- "Tiền mặt" --> D5 --> D7
    D4 -- "Thẻ/CK" --> D6 --> D7
    D7 -.-> U5
```

**Khác biệt cốt lõi với DineIn:** Delivery **KHÔNG trừ kho lúc đặt** — chỉ kiểm tra đủ hàng.
Kho bị trừ khi bếp chuyển **"Đang chuẩn bị" (Preparing)**. Đơn chuyển khoản chỉ vào hàng
chờ giao **sau khi** SePay xác nhận tiền.

---

## 3) NHẬP KHO — từ đặt mua đến lên kệ (đã sơ chế)

```mermaid
flowchart TD
    subgraph NV["🧑‍🍳 Nhân viên kho/cửa hàng"]
        N1["Tạo PO: chọn NCC, nguyên liệu, SL, giá kỳ vọng, thuế"]
        N3["Hàng về → Tạo Receipt từ PO (prefill; nhập SL/giá thực tế, hàng tốt)"]
        N3b["(hoặc) Tạo phiếu nhập TRỰC TIẾP — không qua PO"]
        N4["Bấm 'Xác nhận nhập kho'"]
        N5["Tạo phiếu sơ chế: chọn lô thô, nhập kg, đếm số miếng/túi"]
    end
    subgraph QL["👔 Quản lý"]
        M1{"Duyệt PO?"}
        M2["Rejected — kết thúc"]
        M3["Ordered → đặt hàng NCC → in PO"]
        M4["Cancelled (sau Ordered, bắt buộc lý do)"]
    end
    subgraph BE["⚙️ Backend / Kho"]
        C1["PurchaseOrder + PODetail + POApproval = Submitted"]
        C2["Receipt + ReceiptDetail (Status=Preparing)"]
        C3["Mỗi dòng → InventoryBatch(Raw, Available)<br/>+ StockMovement(PurchaseReceipt, +kg)<br/>→ PO = Received"]
        C4["InventoryBatch(Processed): UnitCost=(InputKg×giá lô)/số miếng<br/>+ StockMovement Processing (−kg lô thô, +miếng lô chín)<br/>+ ProcessingLog + ProcessingDetail"]
    end

    N1 --> C1 --> M1
    M1 -- Từ chối --> M2
    M1 -- Duyệt --> M3 --> N3
    M3 -. có thể hủy .-> M4
    N3 --> C2 --> N4
    N3b --> C2
    N4 --> C3 --> N5 --> C4
```

**2 loại nguyên liệu:** lô **Raw** (kg, nhập từ NCC) → qua **sơ chế** thành lô **Processed**
(miếng/Unit). Chỉ lô **Processed** mới được dùng để bán (trừ cho Bill).

---

## 4) XUẤT KHO — các đường tiêu hao tồn kho

```mermaid
flowchart TD
    S0["📦 Kho: InventoryBatch (Processed, Available, QuantityOnHand > 0)"]
    subgraph OUT["📤 Các đường xuất kho"]
        O1["Bán DineIn → trừ NGAY khi tạo bill (ConsumeIngredients)"]
        O2["Bán Delivery → trừ khi chuyển 'Đang chuẩn bị' (ConsumeIngredientsForDelivery)"]
        O3["Huỷ phiếu sơ chế → hoàn/điều chỉnh kho (ManualAdjustment)"]
        O4["Hao hụt / điều chỉnh tay (Waste / ManualAdjustment)"]
    end
    M["StockMovement(Consumption, ref=Bill, −SL)<br/>FEFO: cận hạn → lô còn ít nhất → nhập sớm nhất"]
    D{"Lô về 0?"}
    DEP["Batch.Status = Depleted (lần bán sau bỏ qua)"]
    OK["Còn hàng → Available"]

    S0 --> O1 --> M
    S0 --> O2 --> M
    M --> D
    D -- Có --> DEP
    D -- Không --> OK
    S0 --> O3
    S0 --> O4
```

---

## Bảng tóm tắt — thời điểm trừ kho & trạng thái

| Loại | Ai khởi tạo | Trừ kho khi nào | Hết hàng thì sao |
|---|---|---|---|
| **DineIn** | Nhân viên | **Ngay lúc tạo bill** (`ConsumeIngredients`) | Rollback cả bill |
| **Delivery** | Khách (web) | Khi nhân viên chuyển **Preparing** (`ConsumeIngredientsForDelivery`) | Lúc đặt: báo chọn cửa hàng khác. Lúc Preparing: rollback chuyển trạng thái |

| Dòng | Trạng thái |
|---|---|
| **Bill** (`BillStatus`) | Create → (UnPaid) → Paid → Delete |
| **Thanh toán** (`PaymentStatus`) | Pending → Paid / Failed |
| **Giao hàng** (`DeliveryStatus`) | Pending → Confirmed → Preparing → OnTheWay → Delivered _(/ Cancelled / Failed)_ |
| **PO** (`PO_Status`) | Submitted → Ordered → Received _(/ Rejected / Cancelled)_ |
| **Phiếu nhập** (`ReceiptStatus`) | Preparing → Delivering → Received _(/ Deleted)_ |
| **Lô kho** (`BatchStatus`) | Available → Depleted |
| **Loại lô** (`BatchType`) | Raw (kg) → Processed (miếng) |
```

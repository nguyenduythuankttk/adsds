// Kiểm tra quyền
(function guard() {
    var role = localStorage.getItem('role');
    var name = localStorage.getItem('fullName');
    if (!role || role !== 'employee') {
        alert('Vui lòng đăng nhập với tài khoản nhân viên!');
        window.location.href = 'index.html';
        return;
    }
    if (isTokenExpired()) {
        clearAuth();
        window.location.href = 'index.html';
        return;
    }
    var el = document.getElementById('header-name');
    if (el) el.textContent = name || 'Nhân viên';
    var avatarEl = document.getElementById('dash-avatar');
    if (avatarEl) {
        var parts = (name || '').trim().split(' ');
        avatarEl.textContent = parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : (name || 'NV').slice(0, 2).toUpperCase();
    }
})();
setInterval(function(){if(isTokenExpired()){clearAuth();window.location.href='index.html';}},60000);

function logout() {
    apiPost('/auth/logout').then(function () {
        clearAuth();
        window.location.href = 'index.html';
    }).catch(function () {
        clearAuth();
        window.location.href = 'index.html';
    });
}

function toast(msg, type) {
    var t = document.getElementById('emp-toast');
    t.textContent = msg;
    t.className = 'show ' + (type || 'success');
    clearTimeout(t._timer);
    t._timer = setTimeout(function () { t.className = ''; }, 2800);
}

function showTab(name) {
    document.querySelectorAll('.emp-section').forEach(function (s) { s.classList.remove('active'); });
    document.querySelectorAll('.sidebar-item').forEach(function (t) { t.classList.remove('active'); });
    var sec = document.getElementById('section-' + name);
    if (sec) sec.classList.add('active');
    var tab = document.getElementById('tab-' + name);
    if (tab) tab.classList.add('active');

    // Polling chỉ chạy khi đang ở tab invoice (đỡ tốn request)
    stopInvoicePolling();

    var renders = {
        dashboard:  renderDashboard,
        invoice:    function () { renderInvCatTabs(); renderInvMenu(); loadAvailableTickets(); loadInvoicesFromAPI(true); loadAvailableTables(); onInvTypeChange(); startInvoicePolling(); },
        table:      renderTables,
        warehouse:  renderWarehouse,
        processing: renderProcessing,
        stockmove:  renderStockMove,
        recipe:     renderRecipe,
        delivery:   renderDelivery,
        viewstock:  renderViewStock
    };
    if (renders[name]) renders[name]();
}

function startInvoicePolling() {
    stopInvoicePolling();
    INV_POLL_TIMER = setInterval(function () {
        if (document.hidden) return;
        loadInvoicesFromAPI(false);
    }, 15000);
}

function stopInvoicePolling() {
    if (INV_POLL_TIMER) { clearInterval(INV_POLL_TIMER); INV_POLL_TIMER = null; }
}

var MENU             = [];
var MENU_RAW         = [];
var INV_CART         = {};
var INV_CURRENT_CAT  = 'all';
var PHONE_LOOKUP_TIMER = null;
var INV_POLL_TIMER   = null;
var INV_LAST_IDS     = {};

var INVOICES = [
    { id:'HD-001', customer:'Nguyễn Văn An',    phone:'0901234567', items:'Gà rán (L) ×2, Coca ×1',         total:285000,  type:'dine-in',  time:'08:15' },
    { id:'HD-002', customer:'Trần Thị Bích',    phone:'0912345678', items:'Gà rán (M) ×1',                  total:125000,  type:'takeaway', time:'08:42' },
    { id:'HD-003', customer:'Lê Văn Cường',     phone:'0923456789', items:'Combo 2 người ×1, Nước cam ×2',  total:420000,  type:'dine-in',  time:'09:10' },
    { id:'HD-004', customer:'Phạm Thị Dung',    phone:'0934567890', items:'Gà rán (S) ×3, Pepsi ×2',       total:198000,  type:'delivery', time:'09:35' },
    { id:'HD-005', customer:'Hoàng Văn Em',     phone:'0945678901', items:'Combo gia đình ×1',              total:650000,  type:'dine-in',  time:'10:00' },
    { id:'HD-006', customer:'Đinh Thị Phương',  phone:'0956789012', items:'Gà rán (L) ×1, Khoai tây ×1',  total:195000,  type:'takeaway', time:'10:22' },
    { id:'HD-007', customer:'Vũ Văn Giang',     phone:'0967890123', items:'Gà rán (M) ×2, Pepsi ×2',       total:310000,  type:'dine-in',  time:'10:55' },
    { id:'HD-008', customer:'Bùi Thị Hoa',      phone:'0978901234', items:'Combo 2 người ×2',               total:840000,  type:'dine-in',  time:'11:15' },
    { id:'HD-009', customer:'Đỗ Văn Ích',       phone:'0989012345', items:'Gà rán (S) ×2',                  total:150000,  type:'takeaway', time:'11:40' },
    { id:'HD-010', customer:'Ngô Thị Kim',      phone:'0990123456', items:'Gà rán (L) ×3, Nước cam ×3',   total:495000,  type:'delivery', time:'12:00' },
    { id:'HD-011', customer:'Trương Văn Long',  phone:'0901234568', items:'Combo gia đình ×1, Pepsi ×2',   total:720000,  type:'dine-in',  time:'12:30' },
    { id:'HD-012', customer:'Lý Thị Mai',       phone:'0912345679', items:'Gà rán (M) ×1, Khoai ×2',      total:235000,  type:'takeaway', time:'13:05' },
    { id:'HD-013', customer:'Phan Văn Nam',     phone:'0923456780', items:'Gà rán (L) ×2, Coca ×2',        total:380000,  type:'dine-in',  time:'13:25' },
    { id:'HD-014', customer:'Tô Thị Oanh',      phone:'0934567891', items:'Combo 2 người ×1',               total:420000,  type:'dine-in',  time:'13:50' },
    { id:'HD-015', customer:'Châu Văn Phú',     phone:'0945678902', items:'Gà rán (S) ×4',                  total:300000,  type:'delivery', time:'14:15' },
    { id:'HD-016', customer:'Khách lẻ',         phone:'',           items:'Gà rán (M) ×2',                  total:250000,  type:'takeaway', time:'14:40' },
    { id:'HD-017', customer:'Lưu Thị Quyên',    phone:'0967890124', items:'Combo gia đình ×2',              total:1300000, type:'dine-in',  time:'15:00' },
    { id:'HD-018', customer:'Mai Văn Rộng',     phone:'0978901235', items:'Gà rán (L) ×1',                  total:165000,  type:'takeaway', time:'15:30' },
    { id:'HD-019', customer:'Ninh Thị Sương',   phone:'0989012346', items:'Gà rán (M) ×3, Nước cam ×1',   total:415000,  type:'dine-in',  time:'16:00' },
    { id:'HD-020', customer:'Ông Văn Tuấn',     phone:'0990123457', items:'Combo 2 người ×1, Pepsi ×2',    total:490000,  type:'delivery', time:'16:20' },
];

var TABLES = [
    { TableID: 1,  TableNumber: 1,  SeatingCapacity:2, Status:'Available' },
    { TableID: 2,  TableNumber: 2,  SeatingCapacity:4, Status:'Occupied'  },
    { TableID: 3,  TableNumber: 3,  SeatingCapacity:4, Status:'Available' },
    { TableID: 4,  TableNumber: 4,  SeatingCapacity:6, Status:'Reserved'  },
    { TableID: 5,  TableNumber: 5,  SeatingCapacity:4, Status:'Occupied'  },
    { TableID: 6,  TableNumber: 6,  SeatingCapacity:2, Status:'Available' },
    { TableID: 7,  TableNumber: 7,  SeatingCapacity:4, Status:'Available' },
    { TableID: 8,  TableNumber: 8,  SeatingCapacity:8, Status:'Occupied'  },
    { TableID: 9,  TableNumber: 9,  SeatingCapacity:4, Status:'Reserved'  },
    { TableID:10,  TableNumber:10,  SeatingCapacity:2, Status:'Available' },
    { TableID:11,  TableNumber:11,  SeatingCapacity:4, Status:'Occupied'  },
    { TableID:12,  TableNumber:12,  SeatingCapacity:6, Status:'Available' },
    { TableID:13,  TableNumber:13,  SeatingCapacity:4, Status:'Available' },
    { TableID:14,  TableNumber:14,  SeatingCapacity:2, Status:'Reserved'  },
    { TableID:15,  TableNumber:15,  SeatingCapacity:4, Status:'Occupied'  },
    { TableID:16,  TableNumber:16,  SeatingCapacity:8, Status:'Available' },
    { TableID:17,  TableNumber:17,  SeatingCapacity:4, Status:'Available' },
    { TableID:18,  TableNumber:18,  SeatingCapacity:6, Status:'Occupied'  },
    { TableID:19,  TableNumber:19,  SeatingCapacity:4, Status:'Reserved'  },
    { TableID:20,  TableNumber:20,  SeatingCapacity:2, Status:'Available' },
];

var WAREHOUSE_LOG = [];

var STOCK_MOVEMENTS = [
    { item:'Gà tươi',     type:'import',  qty:'+50 kg',    note:'Nhập từ nhà CC buổi sáng',      time:'07:30 25/05/2026' },
    { item:'Dầu ăn',      type:'import',  qty:'+20 lít',   note:'Bổ sung dầu chiên đầu ca',      time:'07:45 25/05/2026' },
    { item:'Gà tươi',     type:'consume', qty:'−5 kg',     note:'Chế biến ca sáng',               time:'08:00 25/05/2026' },
    { item:'Muối',        type:'import',  qty:'+10 kg',    note:'Nhập muối mới từ kho',           time:'08:15 25/05/2026' },
    { item:'Khoai tây',   type:'import',  qty:'+30 kg',    note:'Nhập khoai tây từ CC',           time:'08:30 25/05/2026' },
    { item:'Dầu ăn',      type:'consume', qty:'−3 lít',    note:'Chiên gà ca sáng',               time:'09:00 25/05/2026' },
    { item:'Gà tươi',     type:'waste',   qty:'−0.5 kg',   note:'Hao hụt trong sơ chế',          time:'09:30 25/05/2026' },
    { item:'Bột chiên',   type:'import',  qty:'+15 kg',    note:'Nhập bột chiên giòn',            time:'09:45 25/05/2026' },
    { item:'Khoai tây',   type:'consume', qty:'−8 kg',     note:'Chiên khoai tây ca trưa',        time:'10:30 25/05/2026' },
    { item:'Coca Cola',   type:'import',  qty:'+48 cái',   note:'Nhập lon nước ngọt',             time:'10:45 25/05/2026' },
    { item:'Gà tươi',     type:'consume', qty:'−10 kg',    note:'Chế biến ca trưa',               time:'11:00 25/05/2026' },
    { item:'Dầu ăn',      type:'consume', qty:'−5 lít',    note:'Chiên gà ca trưa',               time:'11:30 25/05/2026' },
    { item:'Muối',        type:'consume', qty:'−0.5 kg',   note:'Ướp gà ca trưa',                time:'12:00 25/05/2026' },
    { item:'Bột chiên',   type:'consume', qty:'−3 kg',     note:'Tẩm bột chiên ca trưa',         time:'12:15 25/05/2026' },
    { item:'Nước cam',    type:'import',  qty:'+24 cái',   note:'Nhập nước cam tươi',             time:'12:30 25/05/2026' },
    { item:'Khoai tây',   type:'waste',   qty:'−1 kg',     note:'Khoai hỏng phải thanh lý',      time:'13:00 25/05/2026' },
    { item:'Gà tươi',     type:'adjust',  qty:'±2 kg',     note:'Điều chỉnh sau kiểm kê',        time:'13:30 25/05/2026' },
    { item:'Dầu ăn',      type:'import',  qty:'+10 lít',   note:'Bổ sung dầu cho ca chiều',      time:'14:00 25/05/2026' },
    { item:'Gà tươi',     type:'consume', qty:'−8 kg',     note:'Chế biến ca chiều',              time:'14:30 25/05/2026' },
    { item:'Pepsi',       type:'import',  qty:'+36 cái',   note:'Nhập Pepsi bổ sung tủ lạnh',    time:'15:00 25/05/2026' },
];

var DELIVERIES = [];

// ── MOCK FALLBACK DATA ────────────────────────────────────────────────────────
var MOCK_DELIVERIES = [
    { BillID:'DH-2001', FullName:'Nguyễn Thị Ánh',   Address:'12 Lý Thường Kiệt, Q.10',      status:'pending',   Note:'' },
    { BillID:'DH-2002', FullName:'Trần Văn Bảo',     Address:'45 Nguyễn Trãi, Q.1',          status:'pending',   Note:'' },
    { BillID:'DH-2003', FullName:'Lê Thị Cẩm',       Address:'78 Cách Mạng Tháng 8, Q.3',    status:'pending',   Note:'' },
    { BillID:'DH-2004', FullName:'Phạm Văn Đạt',     Address:'23 Điện Biên Phủ, Bình Thạnh', status:'Delivered', DeliveredAt:'09:15', DeliveredBy:'Phạm Thị Nga', Note:'Giao đúng giờ' },
    { BillID:'DH-2005', FullName:'Hoàng Thị Emilia', Address:'56 Võ Văn Tần, Q.3',           status:'Delivered', DeliveredAt:'09:45', DeliveredBy:'Phạm Thị Nga', Note:'Khách vui' },
    { BillID:'DH-2006', FullName:'Đinh Văn Phúc',    Address:'89 Trường Chinh, Tân Bình',    status:'pending',   Note:'' },
    { BillID:'DH-2007', FullName:'Vũ Thị Giang',     Address:'11 Lê Văn Sỹ, Q.3',           status:'Delivered', DeliveredAt:'10:20', DeliveredBy:'Phạm Thị Nga', Note:'' },
    { BillID:'DH-2008', FullName:'Bùi Văn Hải',      Address:'34 Hoàng Văn Thụ, Phú Nhuận', status:'pending',   Note:'' },
    { BillID:'DH-2009', FullName:'Đỗ Thị Iris',      Address:'67 Bùi Thị Xuân, Q.1',        status:'Delivered', DeliveredAt:'11:00', DeliveredBy:'Phạm Thị Nga', Note:'Giao trước giờ' },
    { BillID:'DH-2010', FullName:'Ngô Văn Kiên',     Address:'90 Nam Kỳ Khởi Nghĩa, Q.1',   status:'pending',   Note:'' },
    { BillID:'DH-2011', FullName:'Trương Thị Liên',  Address:'13 Pasteur, Q.1',              status:'Delivered', DeliveredAt:'11:30', DeliveredBy:'Phạm Thị Nga', Note:'' },
    { BillID:'DH-2012', FullName:'Lý Văn Minh',      Address:'46 Hai Bà Trưng, Q.1',        status:'pending',   Note:'' },
    { BillID:'DH-2013', FullName:'Phan Thị Nhung',   Address:'79 Nguyễn Đình Chiểu, Q.3',   status:'Delivered', DeliveredAt:'12:15', DeliveredBy:'Phạm Thị Nga', Note:'Khách hài lòng' },
    { BillID:'DH-2014', FullName:'Tô Văn Oai',       Address:'22 Lê Duẩn, Q.1',             status:'pending',   Note:'' },
    { BillID:'DH-2015', FullName:'Châu Thị Phụng',   Address:'55 Đồng Khởi, Q.1',           status:'Delivered', DeliveredAt:'13:00', DeliveredBy:'Phạm Thị Nga', Note:'' },
    { BillID:'DH-2016', FullName:'Khách lẻ #16',     Address:'88 Nguyễn Huệ, Q.1',          status:'pending',   Note:'' },
    { BillID:'DH-2017', FullName:'Lưu Văn Quang',    Address:'21 Phạm Ngọc Thạch, Q.3',     status:'Delivered', DeliveredAt:'13:45', DeliveredBy:'Phạm Thị Nga', Note:'Giao đúng giờ' },
    { BillID:'DH-2018', FullName:'Mai Thị Rin',      Address:'54 Tôn Đức Thắng, Q.1',       status:'pending',   Note:'' },
    { BillID:'DH-2019', FullName:'Ninh Văn Sơn',     Address:'87 Bến Nghé, Q.1',            status:'Delivered', DeliveredAt:'14:30', DeliveredBy:'Phạm Thị Nga', Note:'' },
    { BillID:'DH-2020', FullName:'Ông Thị Thủy',     Address:'20 Bùi Viện, Q.1',            status:'pending',   Note:'' },
];

var MOCK_WAREHOUSE_LOG = [
    { ReceiptID:'rc-a1b2c3d4', POID:'po-11111111', Employee:{FullName:'Phạm Thị Nga'},   DateReceive:'2026-05-25T07:30:00', Status:'Confirmed' },
    { ReceiptID:'rc-b2c3d4e5', POID:'po-22222222', Employee:{FullName:'Trần Văn Bảo'},   DateReceive:'2026-05-24T08:00:00', Status:'Confirmed' },
    { ReceiptID:'rc-c3d4e5f6', POID:'po-33333333', Employee:{FullName:'Lê Thị Cẩm'},    DateReceive:'2026-05-24T09:15:00', Status:'Confirmed' },
    { ReceiptID:'rc-d4e5f6g7', POID:'po-44444444', Employee:{FullName:'Phạm Thị Nga'},   DateReceive:'2026-05-23T07:45:00', Status:'Confirmed' },
    { ReceiptID:'rc-e5f6g7h8', POID:'po-55555555', Employee:{FullName:'Nguyễn Văn An'},  DateReceive:'2026-05-23T10:00:00', Status:'Confirmed' },
    { ReceiptID:'rc-f6g7h8i9', POID:'po-66666666', Employee:{FullName:'Trần Văn Bảo'},   DateReceive:'2026-05-22T08:30:00', Status:'Confirmed' },
    { ReceiptID:'rc-g7h8i9j0', POID:'po-77777777', Employee:{FullName:'Lê Thị Cẩm'},    DateReceive:'2026-05-22T11:00:00', Status:'Pending'   },
    { ReceiptID:'rc-h8i9j0k1', POID:'po-88888888', Employee:{FullName:'Phạm Thị Nga'},   DateReceive:'2026-05-21T07:00:00', Status:'Confirmed' },
    { ReceiptID:'rc-i9j0k1l2', POID:'po-99999999', Employee:{FullName:'Nguyễn Văn An'},  DateReceive:'2026-05-21T09:30:00', Status:'Confirmed' },
    { ReceiptID:'rc-j0k1l2m3', POID:'po-aaaaaaaa', Employee:{FullName:'Trần Văn Bảo'},   DateReceive:'2026-05-20T08:15:00', Status:'Confirmed' },
    { ReceiptID:'rc-k1l2m3n4', POID:'po-bbbbbbbb', Employee:{FullName:'Lê Thị Cẩm'},    DateReceive:'2026-05-20T10:45:00', Status:'Confirmed' },
    { ReceiptID:'rc-l2m3n4o5', POID:'po-cccccccc', Employee:{FullName:'Phạm Thị Nga'},   DateReceive:'2026-05-19T07:30:00', Status:'Confirmed' },
    { ReceiptID:'rc-m3n4o5p6', POID:'po-dddddddd', Employee:{FullName:'Nguyễn Văn An'},  DateReceive:'2026-05-19T09:00:00', Status:'Confirmed' },
    { ReceiptID:'rc-n4o5p6q7', POID:'po-eeeeeeee', Employee:{FullName:'Trần Văn Bảo'},   DateReceive:'2026-05-18T08:00:00', Status:'Confirmed' },
    { ReceiptID:'rc-o5p6q7r8', POID:'po-ffffffff', Employee:{FullName:'Lê Thị Cẩm'},    DateReceive:'2026-05-18T11:30:00', Status:'Pending'   },
    { ReceiptID:'rc-p6q7r8s9', POID:'po-gggggggg', Employee:{FullName:'Phạm Thị Nga'},   DateReceive:'2026-05-17T07:15:00', Status:'Confirmed' },
    { ReceiptID:'rc-q7r8s9t0', POID:'po-hhhhhhhh', Employee:{FullName:'Nguyễn Văn An'},  DateReceive:'2026-05-17T09:45:00', Status:'Confirmed' },
    { ReceiptID:'rc-r8s9t0u1', POID:'po-iiiiiiii', Employee:{FullName:'Trần Văn Bảo'},   DateReceive:'2026-05-16T08:30:00', Status:'Confirmed' },
    { ReceiptID:'rc-s9t0u1v2', POID:'po-jjjjjjjj', Employee:{FullName:'Lê Thị Cẩm'},   DateReceive:'2026-05-16T10:00:00', Status:'Confirmed' },
    { ReceiptID:'rc-t0u1v2w3', POID:'po-kkkkkkkk', Employee:{FullName:'Phạm Thị Nga'},   DateReceive:'2026-05-15T07:00:00', Status:'Confirmed' },
];

var MOCK_PO_LIST = [
    { POID:'po-po000001', Supplier:{Name:'Công ty Gà Việt'},    PODetail:[{Ingredient:{Name:'Gà tươi'},      IngredientID:1}],                                          Total:4750000, TaxRate:0.10, POApproval:[{POStatus:1,LastUpdated:'2026-05-25T06:00:00'}] },
    { POID:'po-po000002', Supplier:{Name:'Cty Dầu Ăn Tốt'},    PODetail:[{Ingredient:{Name:'Dầu ăn'},       IngredientID:2}],                                          Total:1200000, TaxRate:0.10, POApproval:[{POStatus:1,LastUpdated:'2026-05-25T06:30:00'}] },
    { POID:'po-po000003', Supplier:{Name:'Nông Sản Tươi Ngon'}, PODetail:[{Ingredient:{Name:'Khoai tây'},    IngredientID:3},{Ingredient:{Name:'Muối'},IngredientID:4}], Total:850000,  TaxRate:0.05, POApproval:[{POStatus:1,LastUpdated:'2026-05-24T18:00:00'}] },
    { POID:'po-po000004', Supplier:{Name:'Bột Chiên Số 1'},     PODetail:[{Ingredient:{Name:'Bột chiên giòn'},IngredientID:5}],                                          Total:600000,  TaxRate:0.10, POApproval:[{POStatus:1,LastUpdated:'2026-05-24T15:00:00'}] },
    { POID:'po-po000005', Supplier:{Name:'Cty Nước Giải Khát'}, PODetail:[{Ingredient:{Name:'Coca Cola'},    IngredientID:6},{Ingredient:{Name:'Pepsi'},IngredientID:7}], Total:2400000, TaxRate:0.10, POApproval:[{POStatus:1,LastUpdated:'2026-05-24T10:00:00'}] },
];

var MOCK_RAW_BATCHES = [
    { BatchID: 1, BatchCode:'BT-GA-001',    Ingredient:{Name:'Gà tươi'},        QuantityOnHand:35.5, UnitCost: 95000, Exp:'2026-05-27' },
    { BatchID: 2, BatchCode:'BT-GA-002',    Ingredient:{Name:'Gà tươi'},        QuantityOnHand:22.0, UnitCost: 95000, Exp:'2026-05-28' },
    { BatchID: 3, BatchCode:'BT-DAU-001',   Ingredient:{Name:'Dầu ăn'},         QuantityOnHand:15.0, UnitCost: 45000, Exp:'2026-11-25' },
    { BatchID: 4, BatchCode:'BT-DAU-002',   Ingredient:{Name:'Dầu ăn'},         QuantityOnHand: 8.5, UnitCost: 45000, Exp:'2026-12-01' },
    { BatchID: 5, BatchCode:'BT-KHOAI-001', Ingredient:{Name:'Khoai tây'},      QuantityOnHand:18.0, UnitCost: 25000, Exp:'2026-06-05' },
    { BatchID: 6, BatchCode:'BT-KHOAI-002', Ingredient:{Name:'Khoai tây'},      QuantityOnHand:12.5, UnitCost: 25000, Exp:'2026-06-07' },
    { BatchID: 7, BatchCode:'BT-BOT-001',   Ingredient:{Name:'Bột chiên giòn'}, QuantityOnHand:11.0, UnitCost: 38000, Exp:'2026-09-25' },
    { BatchID: 8, BatchCode:'BT-BOT-002',   Ingredient:{Name:'Bột chiên giòn'}, QuantityOnHand: 9.5, UnitCost: 38000, Exp:'2026-10-01' },
    { BatchID: 9, BatchCode:'BT-MUOI-001',  Ingredient:{Name:'Muối'},           QuantityOnHand: 8.0, UnitCost:  8000, Exp:'2027-05-25' },
    { BatchID:10, BatchCode:'BT-MUOI-002',  Ingredient:{Name:'Muối'},           QuantityOnHand: 6.0, UnitCost:  8000, Exp:'2027-06-01' },
    { BatchID:11, BatchCode:'BT-OT-001',    Ingredient:{Name:'Ớt bột'},         QuantityOnHand: 3.5, UnitCost: 55000, Exp:'2026-08-15' },
    { BatchID:12, BatchCode:'BT-TOI-001',   Ingredient:{Name:'Tỏi'},            QuantityOnHand: 5.0, UnitCost: 40000, Exp:'2026-06-20' },
    { BatchID:13, BatchCode:'BT-HANH-001',  Ingredient:{Name:'Hành tím'},       QuantityOnHand: 4.0, UnitCost: 30000, Exp:'2026-06-15' },
    { BatchID:14, BatchCode:'BT-NUOC-001',  Ingredient:{Name:'Nước mắm'},       QuantityOnHand: 6.0, UnitCost: 35000, Exp:'2027-01-01' },
    { BatchID:15, BatchCode:'BT-DUONG-001', Ingredient:{Name:'Đường'},          QuantityOnHand: 7.5, UnitCost: 22000, Exp:'2027-05-01' },
    { BatchID:16, BatchCode:'BT-TIEU-001',  Ingredient:{Name:'Tiêu đen'},       QuantityOnHand: 2.5, UnitCost: 80000, Exp:'2026-11-01' },
    { BatchID:17, BatchCode:'BT-GUNG-001',  Ingredient:{Name:'Gừng'},           QuantityOnHand: 3.0, UnitCost: 35000, Exp:'2026-06-30' },
    { BatchID:18, BatchCode:'BT-SAUCE-001', Ingredient:{Name:'Sốt cay'},        QuantityOnHand: 4.5, UnitCost: 65000, Exp:'2026-10-15' },
    { BatchID:19, BatchCode:'BT-BREAD-001', Ingredient:{Name:'Bánh mì'},        QuantityOnHand:50.0, UnitCost: 15000, Exp:'2026-05-27' },
    { BatchID:20, BatchCode:'BT-BUTTE-001', Ingredient:{Name:'Bơ thực vật'},    QuantityOnHand: 6.0, UnitCost: 55000, Exp:'2026-08-01' },
];

var MOCK_PROC_HISTORY = [
    { ProcessingID:'pc-0001', Employee:{FullName:'Phạm Thị Nga'},   ProcessedAt:'2026-05-25T07:30:00', Note:'Sơ chế gà ca sáng — 10kg' },
    { ProcessingID:'pc-0002', Employee:{FullName:'Trần Văn Bảo'},   ProcessedAt:'2026-05-25T08:00:00', Note:'Sơ chế gà ca trưa — 15kg' },
    { ProcessingID:'pc-0003', Employee:{FullName:'Lê Thị Cẩm'},     ProcessedAt:'2026-05-24T07:15:00', Note:'Sơ chế gà buổi sáng' },
    { ProcessingID:'pc-0004', Employee:{FullName:'Phạm Thị Nga'},   ProcessedAt:'2026-05-24T09:30:00', Note:'Cắt khoai tây sợi' },
    { ProcessingID:'pc-0005', Employee:{FullName:'Nguyễn Văn An'},  ProcessedAt:'2026-05-24T13:00:00', Note:'Sơ chế gà ca chiều' },
    { ProcessingID:'pc-0006', Employee:{FullName:'Trần Văn Bảo'},   ProcessedAt:'2026-05-23T07:30:00', Note:'Sơ chế gà ca sáng' },
    { ProcessingID:'pc-0007', Employee:{FullName:'Lê Thị Cẩm'},     ProcessedAt:'2026-05-23T09:00:00', Note:'Tẩm ướp gà spicy' },
    { ProcessingID:'pc-0008', Employee:{FullName:'Phạm Thị Nga'},   ProcessedAt:'2026-05-23T13:30:00', Note:'Sơ chế gà ca tối' },
    { ProcessingID:'pc-0009', Employee:{FullName:'Nguyễn Văn An'},  ProcessedAt:'2026-05-22T07:00:00', Note:'Sơ chế gà đầu tuần' },
    { ProcessingID:'pc-0010', Employee:{FullName:'Trần Văn Bảo'},   ProcessedAt:'2026-05-22T10:00:00', Note:'Cắt khoai tây, ướp gà' },
    { ProcessingID:'pc-0011', Employee:{FullName:'Lê Thị Cẩm'},     ProcessedAt:'2026-05-22T14:00:00', Note:'Sơ chế gà ca chiều' },
    { ProcessingID:'pc-0012', Employee:{FullName:'Phạm Thị Nga'},   ProcessedAt:'2026-05-21T07:30:00', Note:'Sơ chế gà ca sáng' },
    { ProcessingID:'pc-0013', Employee:{FullName:'Nguyễn Văn An'},  ProcessedAt:'2026-05-21T09:00:00', Note:'Bổ sung gà ướp sẵn' },
    { ProcessingID:'pc-0014', Employee:{FullName:'Trần Văn Bảo'},   ProcessedAt:'2026-05-21T13:00:00', Note:'Sơ chế gà ca trưa' },
    { ProcessingID:'pc-0015', Employee:{FullName:'Lê Thị Cẩm'},     ProcessedAt:'2026-05-20T07:15:00', Note:'Sơ chế gà ca sáng' },
    { ProcessingID:'pc-0016', Employee:{FullName:'Phạm Thị Nga'},   ProcessedAt:'2026-05-20T11:00:00', Note:'Cắt gà cho ca chiều' },
    { ProcessingID:'pc-0017', Employee:{FullName:'Nguyễn Văn An'},  ProcessedAt:'2026-05-20T14:30:00', Note:'Sơ chế gà ca tối' },
    { ProcessingID:'pc-0018', Employee:{FullName:'Trần Văn Bảo'},   ProcessedAt:'2026-05-19T07:30:00', Note:'Sơ chế gà ca sáng' },
    { ProcessingID:'pc-0019', Employee:{FullName:'Lê Thị Cẩm'},     ProcessedAt:'2026-05-19T10:00:00', Note:'Ướp gà cay cho ca trưa' },
    { ProcessingID:'pc-0020', Employee:{FullName:'Phạm Thị Nga'},   ProcessedAt:'2026-05-19T14:00:00', Note:'Sơ chế gà và khoai ca chiều' },
];

var MOCK_RECIPES = [
    { IngredientID:1, ProductVarientID:1, Ingredient:{Name:'Gà tươi'},        ProductVarient:{ProductName:'Gà rán (S)'},          QtyAfterProcess:2,    BatchSize:1, IsConsumable:false },
    { IngredientID:1, ProductVarientID:2, Ingredient:{Name:'Gà tươi'},        ProductVarient:{ProductName:'Gà rán (M)'},          QtyAfterProcess:3,    BatchSize:1, IsConsumable:false },
    { IngredientID:1, ProductVarientID:3, Ingredient:{Name:'Gà tươi'},        ProductVarient:{ProductName:'Gà rán (L)'},          QtyAfterProcess:5,    BatchSize:1, IsConsumable:false },
    { IngredientID:2, ProductVarientID:1, Ingredient:{Name:'Dầu ăn'},         ProductVarient:{ProductName:'Gà rán (S)'},          QtyAfterProcess:0.3,  BatchSize:1, IsConsumable:true  },
    { IngredientID:2, ProductVarientID:2, Ingredient:{Name:'Dầu ăn'},         ProductVarient:{ProductName:'Gà rán (M)'},          QtyAfterProcess:0.4,  BatchSize:1, IsConsumable:true  },
    { IngredientID:2, ProductVarientID:3, Ingredient:{Name:'Dầu ăn'},         ProductVarient:{ProductName:'Gà rán (L)'},          QtyAfterProcess:0.55, BatchSize:1, IsConsumable:true  },
    { IngredientID:4, ProductVarientID:1, Ingredient:{Name:'Muối'},            ProductVarient:{ProductName:'Gà rán (S)'},          QtyAfterProcess:0.02, BatchSize:1, IsConsumable:true  },
    { IngredientID:5, ProductVarientID:1, Ingredient:{Name:'Bột chiên giòn'}, ProductVarient:{ProductName:'Gà rán (S)'},          QtyAfterProcess:0.05, BatchSize:1, IsConsumable:true  },
    { IngredientID:5, ProductVarientID:2, Ingredient:{Name:'Bột chiên giòn'}, ProductVarient:{ProductName:'Gà rán (M)'},          QtyAfterProcess:0.07, BatchSize:1, IsConsumable:true  },
    { IngredientID:3, ProductVarientID:4, Ingredient:{Name:'Khoai tây'},       ProductVarient:{ProductName:'Khoai tây chiên (S)'},QtyAfterProcess:3,    BatchSize:1, IsConsumable:false },
    { IngredientID:3, ProductVarientID:5, Ingredient:{Name:'Khoai tây'},       ProductVarient:{ProductName:'Khoai tây chiên (L)'},QtyAfterProcess:5,    BatchSize:1, IsConsumable:false },
    { IngredientID:2, ProductVarientID:4, Ingredient:{Name:'Dầu ăn'},         ProductVarient:{ProductName:'Khoai tây chiên (S)'},QtyAfterProcess:0.2,  BatchSize:1, IsConsumable:true  },
    { IngredientID:1, ProductVarientID:6, Ingredient:{Name:'Gà tươi'},        ProductVarient:{ProductName:'Combo 2 người'},       QtyAfterProcess:6,    BatchSize:1, IsConsumable:false },
    { IngredientID:3, ProductVarientID:6, Ingredient:{Name:'Khoai tây'},       ProductVarient:{ProductName:'Combo 2 người'},       QtyAfterProcess:4,    BatchSize:1, IsConsumable:false },
    { IngredientID:2, ProductVarientID:6, Ingredient:{Name:'Dầu ăn'},         ProductVarient:{ProductName:'Combo 2 người'},       QtyAfterProcess:0.8,  BatchSize:1, IsConsumable:true  },
    { IngredientID:1, ProductVarientID:7, Ingredient:{Name:'Gà tươi'},        ProductVarient:{ProductName:'Combo gia đình'},      QtyAfterProcess:12,   BatchSize:1, IsConsumable:false },
    { IngredientID:3, ProductVarientID:7, Ingredient:{Name:'Khoai tây'},       ProductVarient:{ProductName:'Combo gia đình'},      QtyAfterProcess:8,    BatchSize:1, IsConsumable:false },
    { IngredientID:2, ProductVarientID:7, Ingredient:{Name:'Dầu ăn'},         ProductVarient:{ProductName:'Combo gia đình'},      QtyAfterProcess:1.5,  BatchSize:1, IsConsumable:true  },
    { IngredientID:5, ProductVarientID:7, Ingredient:{Name:'Bột chiên giòn'}, ProductVarient:{ProductName:'Combo gia đình'},      QtyAfterProcess:0.2,  BatchSize:1, IsConsumable:true  },
    { IngredientID:1, ProductVarientID:8, Ingredient:{Name:'Gà tươi'},        ProductVarient:{ProductName:'Gà cay (M)'},          QtyAfterProcess:3,    BatchSize:1, IsConsumable:false },
];

var TYPE_LABEL  = { takeaway: 'Mang về', 'dine-in': 'Tại quán', delivery: 'Giao hàng' };
var MOVE_LABEL  = { import: 'Nhập mới', consume: 'Chế biến', waste: 'Hao hụt', adjust: 'Điều chỉnh' };
var MOVE_BADGE  = { import: 'badge-green', consume: 'badge-orange', waste: 'badge-red', adjust: 'badge-blue' };
var TABLE_STATUS_LABEL = { Available: 'Trống', Occupied: 'Đang dùng', Reserved: 'Đã đặt', available: 'Trống', occupied: 'Đang dùng', reserved: 'Đã đặt' };
var TABLE_STATUS_CYCLE = ['Available', 'Occupied', 'Reserved'];

// Load menu và ticket từ API khi trang tải
(function loadMenu() {
    apiGet('/product/get-all').then(function (r) { return r.json(); }).then(function (data) {
        MENU_RAW = data.filter(function (p) { return !(p.deletedAt || p.DeletedAt); });
        MENU = [];
        MENU_RAW.forEach(function (p) {
            var variants = p.productVarient || p.ProductVarient || [];
            variants.forEach(function (v) {
                if (v.deletedAt || v.DeletedAt || v.isActive === false || v.IsActive === false) return;
                var size     = v.size || v.Size || '';
                var sizePart = size && size !== 'Default' ? ' (' + size + ')' : '';
                var name     = p.productName || p.ProductName || '';
                MENU.push({
                    id:          v.productVarientID || v.ProductVarientID,
                    name:        name + sizePart,
                    price:       v.price || v.Price,
                    image:       p.image || p.Image || null,
                    type:        p.productType || p.ProductType || 'Food',
                    productName: name,
                    forPeople:   v.forPeople || v.ForPeople || null
                });
            });
        });
        renderInvCatTabs();
        renderInvMenu();
    }).catch(function (err) { console.error('[loadMenu]', err); });
})();

function loadAvailableTickets() {
    var sel = document.getElementById('inv-ticket');
    if (!sel) return;
    var today = new Date().toISOString().slice(0, 10);
    var end7  = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    apiGet('/ticket/get-all/' + today + '/' + end7)
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (data) {
            var now = today;
            var valid = (data || []).filter(function (tk) {
                return !tk.usedAt && !tk.deletedAt &&
                       (tk.startDate || '') <= now &&
                       (tk.endDate   || '') >= now;
            });
            sel.innerHTML = '<option value="">-- Không dùng mã --</option>';
            valid.forEach(function (tk) {
                var code = (tk.ticketID || '').toString().slice(0, 8).toUpperCase();
                var discPct = Math.round((tk.discount || 0) * 100);
                var opt = document.createElement('option');
                opt.value = tk.ticketID || '';
                opt.dataset.discount = tk.discount || 0;
                opt.textContent = code + ' – Giảm ' + discPct + '% (HSD: ' + (tk.endDate || '') + ')';
                sel.appendChild(opt);
            });
            sel.dataset.ticketId = '';
            sel.dataset.discount = 0;
        })
        .catch(function () {});
}

function onTicketSelect(sel) {
    if (!sel.value) {
        sel.dataset.ticketId = '';
        sel.dataset.discount = 0;
    } else {
        var opt = sel.options[sel.selectedIndex];
        var discountRate = parseFloat(opt.dataset.discount) || 0;
        var subtotal = getInvSubtotal();
        var afterVat = subtotal * 1.1;
        sel.dataset.ticketId = sel.value;
        sel.dataset.discount = Math.round(afterVat * discountRate);
    }
    updateInvTotal();
    calcChange();
}

// LẬP HÓA ĐƠN
var CAT_EMOJI = { Food: '🍗', Drink: '🥤', Addon: '🍟', Combo: '🎁' };
var CAT_LABEL = { all: 'Tất cả', Food: '🍗 Đồ ăn', Drink: '🥤 Nước', Addon: '🍟 Thêm', Combo: '🎁 Combo' };

function renderInvCatTabs() {
    var container = document.getElementById('inv-cat-tabs');
    if (!container) return;
    var types = ['all'];
    MENU.forEach(function (m) { if (m.type && types.indexOf(m.type) === -1) types.push(m.type); });
    container.innerHTML = types.map(function (t) {
        var active = (t === INV_CURRENT_CAT) ? ' active' : '';
        return '<button class="cat-tab' + active + '" onclick="setMenuCat(\'' + t + '\')">'
            + (CAT_LABEL[t] || t) + '</button>';
    }).join('');
}

function setMenuCat(cat) {
    INV_CURRENT_CAT = cat;
    renderInvCatTabs();
    renderInvMenu();
}

function filterMenuCards(val) {
    renderInvMenu();
}

function renderInvMenu() {
    var container = document.getElementById('inv-menu');
    if (!container) return;
    if (!MENU.length) {
        container.innerHTML = '<p style="color:var(--muted);padding:16px;grid-column:1/-1">Đang tải menu...</p>';
        return;
    }
    var search = (document.getElementById('inv-menu-search') || {}).value || '';
    var filtered = MENU.filter(function (m) {
        var matchCat    = INV_CURRENT_CAT === 'all' || m.type === INV_CURRENT_CAT;
        var matchSearch = !search || m.name.toLowerCase().indexOf(search.toLowerCase()) !== -1;
        return matchCat && matchSearch;
    });
    if (!filtered.length) {
        container.innerHTML = '<p style="color:var(--muted);padding:16px;grid-column:1/-1">Không tìm thấy món nào.</p>';
        updateInvTotal();
        return;
    }
    container.innerHTML = filtered.map(function (m) {
        var qty        = INV_CART[m.id] || 0;
        var selected   = qty > 0 ? ' selected' : '';
        var emoji      = CAT_EMOJI[m.type] || '🍽️';
        var imgHtml    = m.image
            ? '<img class="menu-card-img" src="' + m.image + '" alt="' + m.name
              + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'
              + '<div class="menu-card-img-placeholder" style="display:none">' + emoji + '</div>'
            : '<div class="menu-card-img-placeholder">' + emoji + '</div>';
        var forPeople  = m.forPeople ? '<div class="menu-card-for">👥 ' + m.forPeople + ' người</div>' : '';
        return '<div class="menu-card' + selected + '" id="menu-card-' + m.id + '">'
            + imgHtml
            + '<div class="menu-card-body">'
            +   '<div class="menu-card-name">' + m.name + '</div>'
            +   '<div class="menu-card-price">' + Number(m.price).toLocaleString('vi-VN') + 'đ</div>'
            +   forPeople
            + '</div>'
            + '<div class="menu-card-ctrl">'
            +   '<button class="qty-btn" onclick="invQty(' + m.id + ',-1)">−</button>'
            +   '<span class="qty-num" id="inv-qty-' + m.id + '">' + qty + '</span>'
            +   '<button class="qty-btn" onclick="invQty(' + m.id + ',1)">+</button>'
            + '</div>'
            + '</div>';
    }).join('');
    updateInvTotal();
}

function invQty(id, delta) {
    INV_CART[id] = Math.max(0, (INV_CART[id] || 0) + delta);
    if (!INV_CART[id]) delete INV_CART[id];
    var el = document.getElementById('inv-qty-' + id);
    if (el) el.textContent = INV_CART[id] || 0;
    var card = document.getElementById('menu-card-' + id);
    if (card) {
        if (INV_CART[id]) card.classList.add('selected');
        else card.classList.remove('selected');
    }
    updateInvTotal();
    calcChange();
}

function getInvSubtotal() {
    return Object.keys(INV_CART).reduce(function (s, id) {
        var item = MENU.find(function (m) { return m.id == id; });
        return s + (item ? item.price * INV_CART[id] : 0);
    }, 0);
}

function updateInvTotal() {
    var subtotal  = getInvSubtotal();
    var vat       = Math.round(subtotal * 0.1);
    var ticketEl  = document.getElementById('inv-ticket');
    var discount  = ticketEl ? (parseInt(ticketEl.dataset.discount) || 0) : 0;
    var total     = subtotal + vat - discount;
    var totalEl   = document.getElementById('inv-total');
    if (totalEl) totalEl.textContent = total.toLocaleString('vi-VN') + ' đ';
    return total;
}


function calcChange() {
    var total    = updateInvTotal();
    var received = parseInt(document.getElementById('inv-received').value) || 0;
    var change   = received >= total ? received - total : 0;
    document.getElementById('inv-change').value = change;
}

function setReceived(amount) {
    var el = document.getElementById('inv-received');
    if (el) { el.value = amount; calcChange(); }
}

function setReceivedExact() {
    setReceived(updateInvTotal());
}

function createInvoice() {
    var customer   = document.getElementById('inv-customer').value.trim();
    var phone      = document.getElementById('inv-phone').value.trim();
    var type       = document.getElementById('inv-type').value;
    var tableNo    = document.getElementById('inv-table').value.trim();
    var received   = parseInt(document.getElementById('inv-received').value) || 0;
    var storeId    = localStorage.getItem('storeId');
    var employeeId = localStorage.getItem('employeeId');

    if (!Object.keys(INV_CART).length) { toast('Vui lòng chọn ít nhất 1 món!', 'error'); return; }

    var total  = updateInvTotal();
    var change = received >= total ? received - total : 0;

    var products = Object.keys(INV_CART).map(function (id) {
        return { ProductVarientID: parseInt(id, 10), qty: INV_CART[id] };
    });

    var tableId = null;
    if (type === 'dine-in') {
        var tblVal = document.getElementById('inv-table').value;
        tableId = tblVal ? parseInt(tblVal) : null;
    }

    var ticketEl = document.getElementById('inv-ticket');
    var ticketId = ticketEl ? (ticketEl.dataset.ticketId || null) : null;

    var body = {
        StoreID:        parseInt(storeId),
        TableID:        tableId,
        contact:        phone || null,
        customerName:   customer || null,
        PaymentMethods: 'Cash',
        MoneyReceived:  received,
        MoneyGiveBack:  change,
        products:       products,
        EmployeID:      employeeId
    };
    if (ticketId) body.TicketID = ticketId;

    apiPost('/bill/create-dinein', body).then(function (r) {
        if (!r.ok) return r.json().then(function (d) { throw new Error(d.message || 'Lỗi tạo hóa đơn'); });
        return r.json();
    }).then(function () {
        if (type === 'dine-in' && tableId) {
            var t = TABLES.find(function (t) { return (t.TableID || t.id) == tableId; });
            if (t) t.Status = 'Occupied';
        }

        INV_CART = {};
        ['inv-customer','inv-phone','inv-received','inv-change'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
        });
        var phoneHint = document.getElementById('inv-phone-hint');
        if (phoneHint) { phoneHint.textContent = ''; phoneHint.className = 'phone-hint'; }
        if (ticketEl) { ticketEl.value = ''; ticketEl.dataset.discount = 0; ticketEl.dataset.ticketId = ''; }
        loadAvailableTables();
        renderInvMenu();
        loadInvoicesFromAPI(/*silent=*/false);
        toast('Xuất hóa đơn thành công!');
    }).catch(function (err) {
        toast(err.message || 'Lỗi tạo hóa đơn!', 'error');
    });
}

// Load bills (dine-in + delivery) thật từ DB cho store đang trực, hôm nay.
// silent=true: không hiện toast khi có bill mới (lần load đầu khi vào tab).
function loadInvoicesFromAPI(silent) {
    var storeId = localStorage.getItem('storeId');
    if (!storeId) return;
    var today = new Date().toISOString().slice(0, 10);
    var url   = '/bill/get-all/' + today + '/' + today + '?storeID=' + encodeURIComponent(storeId);

    apiGet(url).then(function (r) {
        return r.ok ? r.json() : [];
    }).then(function (data) {
        var bills = Array.isArray(data) ? data : (data.data || []);
        // Map về INVOICES shape để renderInvoices() & updateInvStats() dùng được
        INVOICES = bills.map(function (b) {
            var billId  = b.billID || b.BillID || '';
            var details = b.billDetail || b.BillDetail || [];
            var items = details.map(function (bd) {
                var pv   = bd.productVarient || bd.ProductVarient || {};
                var prod = pv.product || pv.Product || {};
                return (prod.productName || prod.ProductName || 'SP') + ' ×' + (bd.quantity || bd.Quantity || 1);
            }).join(', ');
            // Bill có TableID = dine-in; có AddressID = delivery; không thì takeaway
            var type = (b.tableID || b.TableID)
                ? 'dine-in'
                : ((b.addressID || b.AddressID) ? 'delivery' : 'takeaway');
            var changes = b.billChange || b.BillChange || [];
            var createChange = changes.find(function (c) { return (c.status || c.Status) === 'Create'; }) || changes[0] || {};
            var createdAt    = createChange.changeAt || createChange.ChangeAt || '';
            var timeStr      = createdAt
                ? new Date(createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                : '';
            return {
                id:       String(billId).slice(0, 8).toUpperCase(),
                billID:   billId,
                customer: type === 'delivery' ? 'Khách đặt online' : 'Khách lẻ',
                phone:    '',
                items:    items,
                total:    Number(b.total || b.Total || 0),
                type:     type,
                table:    b.tableID || b.TableID || '',
                time:     timeStr,
                createdAt: createdAt
            };
        });
        // Sắp xếp mới nhất trước
        INVOICES.sort(function (a, b) {
            return (b.createdAt || '').localeCompare(a.createdAt || '');
        });

        // Phát hiện bill mới (so với lần poll trước) → toast
        if (!silent) {
            var newOnes = INVOICES.filter(function (inv) { return inv.billID && !INV_LAST_IDS[inv.billID]; });
            var newDelivery = newOnes.filter(function (inv) { return inv.type === 'delivery'; });
            if (newDelivery.length) {
                toast('🔔 Có ' + newDelivery.length + ' đơn giao hàng mới từ khách!');
            }
        }
        INV_LAST_IDS = {};
        INVOICES.forEach(function (inv) { if (inv.billID) INV_LAST_IDS[inv.billID] = true; });

        renderInvoices();
        updateInvStats();
    }).catch(function () { /* im lặng - lần poll tiếp theo sẽ thử lại */ });
}

function renderInvoices() {
    var tbody = document.getElementById('invoice-tbody');
    if (!tbody) return;
    if (!INVOICES.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="tbl-empty">Chưa có hóa đơn</td></tr>';
        return;
    }
    var sorted = INVOICES.slice().sort(function (a, b) { return b.time.localeCompare(a.time); });
    tbody.innerHTML = sorted.map(function (inv) {
        var typeBadge = inv.type === 'delivery' ? 'badge-orange'
                      : inv.type === 'dine-in'  ? 'badge-green'
                      : 'badge-blue';
        return '<tr>'
            + '<td><strong style="color:var(--primary)">' + inv.id + '</strong></td>'
            + '<td>' + inv.customer + '<br><small style="color:var(--muted)">' + (inv.phone || '—') + '</small></td>'
            + '<td><strong>' + Number(inv.total).toLocaleString('vi-VN') + 'đ</strong></td>'
            + '<td><span class="badge ' + typeBadge + '">' + (TYPE_LABEL[inv.type] || inv.type) + '</span></td>'
            + '<td style="color:var(--muted);font-size:12px">' + inv.time + '</td>'
            + '</tr>';
    }).join('');
}

function loadInvoicesFromAPI() {
    var today = dashTodayStr();
    apiGet('/bill/get-all/' + today + '/' + today, true).then(function (r) {
        return r.ok ? r.json() : null;
    }).then(function (data) {
        if (!data) { renderInvoices(); updateInvStats(); return; }
        var bills = Array.isArray(data) ? data : (data.data || []);
        if (!bills.length) { renderInvoices(); updateInvStats(); return; }
        INVOICES = bills.map(function (b) {
            var details = b.BillDetail || b.billDetail || [];
            var items = details.map(function (d) {
                var pv = d.ProductVarient || d.productVarient;
                var pName = (pv && pv.Product && pv.Product.ProductName) || 'SP';
                return pName + ' ×' + (d.Quantity || 1);
            }).join(', ');
            var changes = b.BillChange || b.billChange || [];
            var createChange = changes.find(function (c) { return (c.Status || c.status) === 'Create'; });
            var time = createChange
                ? String(createChange.ChangeAt || createChange.changeAt || '').slice(11, 16)
                : '--:--';
            var typeMap = { 0: 'dine-in', 1: 'takeaway', 2: 'delivery', DineIn: 'dine-in', TakeAway: 'takeaway', Delivery: 'delivery' };
            return {
                id:       b.BillID || b.billID,
                customer: (b.User && b.User.FullName) || b.Contact || 'Khách lẻ',
                phone:    (b.User && b.User.Phone)    || b.Contact || '',
                items:    items,
                total:    Number(b.Total || 0),
                type:     typeMap[b.BillType || b.billType] || 'dine-in',
                time:     time
            };
        });
        renderInvoices();
        updateInvStats();
    }).catch(function () {
        renderInvoices();
        updateInvStats();
    });
}

function updateInvStats() {
    var count   = INVOICES.length;
    var revenue = INVOICES.reduce(function (s, inv) { return s + inv.total; }, 0);
    var countEl   = document.getElementById('stat-inv-count');
    var revenueEl = document.getElementById('stat-inv-revenue');
    if (countEl)   countEl.textContent   = count;
    if (revenueEl) revenueEl.textContent = revenue.toLocaleString('vi-VN') + 'đ';
}

// SƠ ĐỒ BÀN
function renderTables() {
    var storeId = localStorage.getItem('storeId');
    apiGet('/diningtable/get-all?storeID=' + storeId).then(function (r) { return r.json(); }).then(function (data) {
        var fromApi = Array.isArray(data) ? data : (data.data || []);
        if (fromApi.length) TABLES = fromApi;
        renderTablesLocal();
    }).catch(function () {
        renderTablesLocal();
    });
}

function renderTablesLocal() {
    var grid = document.getElementById('table-grid');
    if (!grid) return;
    grid.innerHTML = TABLES.map(function (t) {
        var status    = t.Status || t.status || 'Available';
        var statusKey = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
        var tableId   = t.TableID || t.id;
        return '<div class="table-card ' + status.toLowerCase() + '" onclick="cycleTableStatus(\'' + tableId + '\')">'
            + '<div class="tc-num">B' + (t.TableNumber || t.num || tableId) + '</div>'
            + '<div class="tc-cap"><i class="ti-user"></i> ' + (t.SeatingCapacity || t.capacity || 0) + ' người</div>'
            + '<div class="tc-status">' + (TABLE_STATUS_LABEL[statusKey] || TABLE_STATUS_LABEL[status] || status) + '</div>'
            + '</div>';
    }).join('');
}

function cycleTableStatus(tableId) {
    var t = TABLES.find(function (t) { return (t.TableID || t.id) == tableId; });
    if (!t) return;
    var status    = t.Status || t.status || 'Available';
    var statusKey = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    var idx       = TABLE_STATUS_CYCLE.indexOf(statusKey);
    var newStatus = TABLE_STATUS_CYCLE[(idx + 1) % TABLE_STATUS_CYCLE.length];

    apiPut('/diningtable/update', { tableID: tableId, status: newStatus }).then(function (r) {
        if (!r.ok) throw new Error();
        t.Status = newStatus;
        renderTablesLocal();
        toast('Bàn B' + (t.TableNumber || t.num || tableId) + ' → ' + (TABLE_STATUS_LABEL[newStatus] || newStatus));
    }).catch(function () {
        toast('Lỗi cập nhật trạng thái bàn!', 'error');
    });
}

function openTableModal() {
    var num = prompt('Nhập số bàn mới:');
    var cap = prompt('Sức chứa (số người):');
    if (!num || !cap) return;
    var storeId = localStorage.getItem('storeId');
    apiPost('/diningtable/add', { StoreID: storeId, TableNumber: parseInt(num), SeatingCapacity: parseInt(cap) })
        .then(function (r) {
            if (!r.ok) throw new Error();
            renderTables();
            toast('Đã thêm Bàn ' + num);
        }).catch(function () { toast('Lỗi thêm bàn!', 'error'); });
}

// NHẬP KHO — Warehouse Stepper
var WH_PO_DATA = null;
var WH_RECEIPT_ID = null;
var WH_WAREHOUSES = [];
var WH_RECEIPT_LINES_DATA = [];

function renderWarehouse() {
    whGoStep(1);
    loadOrderedPOs();
    renderWhHistory();
}

function whGoStep(n) {
    [1, 2, 3].forEach(function (i) {
        var el = document.getElementById('wh-step-' + i);
        var hd = document.getElementById('whs-' + i);
        if (el) el.style.display = (i === n) ? '' : 'none';
        if (hd) {
            hd.classList.remove('active', 'done');
            if (i < n)  hd.classList.add('done');
            if (i === n) hd.classList.add('active');
        }
    });
}

function loadOrderedPOs() {
    var storeId = localStorage.getItem('storeId');
    var tbody   = document.getElementById('wh-po-list');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="tbl-empty">Đang tải...</td></tr>';
    apiGet('/purchaseOrder/get-by-store/' + storeId).then(function (r) { return r.json(); }).then(function (data) {
        var list    = Array.isArray(data) ? data : (data.data || []);
        var ordered = list.filter(function (po) {
            var approvals = po.POApproval || po.poApproval || [];
            if (!approvals.length) return false;
            var latest = approvals.reduce(function (a, b) {
                return new Date(a.LastUpdated || a.lastUpdated) > new Date(b.LastUpdated || b.lastUpdated) ? a : b;
            });
            var st = (latest.POStatus !== undefined ? latest.POStatus : latest.poStatus);
            return st === 1 || st === 'Ordered';
        });
        if (!ordered.length) ordered = MOCK_PO_LIST;
        if (tbody) tbody.innerHTML = ordered.map(function (po) {
            var poId     = po.POID || po.poid;
            var supplier = (po.Supplier && (po.Supplier.Name || po.Supplier.name)) || '—';
            var details  = po.PODetail || po.poDetail || [];
            var items    = details.map(function (d) {
                return (d.Ingredient && (d.Ingredient.Name || d.Ingredient.name)) || ('NL ' + d.IngredientID);
            }).join(', ') || '—';
            var total = po.Total || po.total || 0;
            var tax   = po.TaxRate !== undefined ? (po.TaxRate * 100).toFixed(0) + '%' : '—';
            return '<tr>'
                + '<td><strong style="color:var(--primary)">' + String(poId).slice(0, 8) + '...</strong></td>'
                + '<td><strong>' + supplier + '</strong></td>'
                + '<td style="font-size:12px;color:var(--muted)">' + items + '</td>'
                + '<td><strong>' + parseInt(total).toLocaleString('vi-VN') + 'đ</strong></td>'
                + '<td style="font-size:12px">' + tax + '</td>'
                + '<td><button class="btn btn-primary btn-sm" onclick="whSelectPO(\'' + poId + '\')">'
                + '<i class="ti-truck"></i> Tạo phiếu nhập</button></td>'
                + '</tr>';
        }).join('');
    }).catch(function () {
        if (tbody) tbody.innerHTML = MOCK_PO_LIST.map(function (po) {
            var poId     = po.POID || po.poid;
            var supplier = (po.Supplier && (po.Supplier.Name || po.Supplier.name)) || '—';
            var details  = po.PODetail || po.poDetail || [];
            var items    = details.map(function (d) {
                return (d.Ingredient && (d.Ingredient.Name || d.Ingredient.name)) || ('NL ' + d.IngredientID);
            }).join(', ') || '—';
            var total = po.Total || po.total || 0;
            var tax   = po.TaxRate !== undefined ? (po.TaxRate * 100).toFixed(0) + '%' : '—';
            return '<tr>'
                + '<td><strong style="color:var(--primary)">' + String(poId).slice(-8) + '</strong></td>'
                + '<td><strong>' + supplier + '</strong></td>'
                + '<td style="font-size:12px;color:var(--muted)">' + items + '</td>'
                + '<td><strong>' + parseInt(total).toLocaleString('vi-VN') + 'đ</strong></td>'
                + '<td style="font-size:12px">' + tax + '</td>'
                + '<td><button class="btn btn-primary btn-sm" onclick="whSelectPO(\'' + poId + '\')">'
                + '<i class="ti-truck"></i> Tạo phiếu nhập</button></td>'
                + '</tr>';
        }).join('');
    });
}

function whSelectPO(poId) {
    apiGet('/receipt/prefill-from-po/' + poId).then(function (r) {
        if (!r.ok) throw new Error('Không thể prefill từ PO');
        return r.json();
    }).then(function (data) {
        WH_PO_DATA       = data;
        WH_PO_DATA._poId = poId;
        renderWhStep2(data);
        whGoStep(2);
    }).catch(function (err) { toast(err.message || 'Lỗi tải thông tin PO!', 'error'); });
}

function renderWhStep2(data) {
    var info     = document.getElementById('wh-po-info');
    var lines    = data.Items || data.items || [];
    var supplier = data.SupplierName || data.supplierName
        || (data.Supplier && (data.Supplier.Name || data.Supplier.name)) || '—';
    if (info) info.innerHTML = '<strong>PO:</strong> ' + String(WH_PO_DATA._poId).slice(0, 8)
        + '...  &nbsp;|&nbsp;  <strong>Nhà CC:</strong> ' + supplier
        + '  &nbsp;|&nbsp;  <strong>Số mặt hàng:</strong> ' + lines.length;

    WH_RECEIPT_LINES_DATA = lines;
    var container = document.getElementById('wh-receipt-lines');
    if (!container) return;
    if (!lines.length) {
        container.innerHTML = '<p style="color:var(--muted);padding:10px">Không có nguyên liệu nào trong PO này.</p>';
        return;
    }
    container.innerHTML = lines.map(function (item, i) {
        var ingId   = item.IngredientID || item.ingredientID;
        var ingName = (item.Ingredient && (item.Ingredient.Name || item.Ingredient.name))
            || item.IngredientName || item.ingredientName || ('Nguyên liệu ' + ingId);
        var qty = item.Quantity || item.quantity || 0;
        var up  = item.UnitPriceExpected || item.unitPriceExpected || 0;
        return '<div class="receipt-line">'
            + '<div class="receipt-line-title">' + ingName
            + ' <span style="font-weight:400;color:var(--muted);font-size:12px">(ID: ' + ingId + ')</span></div>'
            + '<div class="form-row-3">'
            + '<div class="form-group"><label>SL thực nhận *</label>'
            + '<input type="number" id="rl-qty-' + i + '" value="' + qty + '" step="0.1" min="0"></div>'
            + '<div class="form-group"><label>SL tốt (GoodQty) *</label>'
            + '<input type="number" id="rl-gq-' + i + '" value="' + qty + '" step="0.1" min="0"></div>'
            + '<div class="form-group"><label>Đơn giá thực (đ/kg) *</label>'
            + '<input type="number" id="rl-up-' + i + '" value="' + up + '" min="0"></div>'
            + '</div></div>';
    }).join('');
}

function submitCreateReceipt() {
    var lines = WH_RECEIPT_LINES_DATA;
    if (!lines.length) { toast('Không có nguyên liệu!', 'error'); return; }
    var empId = localStorage.getItem('employeeId');
    var poId  = WH_PO_DATA._poId;

    var receiptLines = lines.map(function (item, i) {
        return {
            IngredientID: item.IngredientID || item.ingredientID,
            Quantity:     parseFloat(document.getElementById('rl-qty-' + i).value) || 0,
            GoodQuantity: parseFloat(document.getElementById('rl-gq-' + i).value) || 0,
            UnitPrice:    parseFloat(document.getElementById('rl-up-' + i).value) || 0
        };
    });

    apiPost('/receipt/create', { POID: poId, EmployeeID: empId, ReceiptLines: receiptLines })
        .then(function (r) {
            if (!r.ok) return r.json().then(function (d) { throw new Error(d.message || 'Lỗi tạo phiếu nhập'); });
            return r.json();
        }).then(function (d) {
            WH_RECEIPT_ID = d.ReceiptID || d.receiptID || (d.data && (d.data.ReceiptID || d.data.receiptID));
            toast('Tạo phiếu nhập thành công!');
            loadWhWarehouses(function () { renderWhStep3(); whGoStep(3); });
        }).catch(function (err) { toast(err.message || 'Lỗi tạo phiếu nhập!', 'error'); });
}

function loadWhWarehouses(cb) {
    var storeId = localStorage.getItem('storeId');
    apiGet('/warehouse/get-by-store/' + storeId).then(function (r) { return r.json(); }).then(function (data) {
        WH_WAREHOUSES = Array.isArray(data) ? data : (data.data || []);
        if (cb) cb();
    }).catch(function () { WH_WAREHOUSES = []; if (cb) cb(); });
}

function renderWhStep3() {
    var sel = document.getElementById('wh-confirm-warehouse');
    if (sel) sel.innerHTML = WH_WAREHOUSES.map(function (w) {
        return '<option value="' + (w.WarehouseID || w.warehouseID) + '">'
            + (w.Name || w.name || 'Kho ' + (w.WarehouseID || w.warehouseID)) + '</option>';
    }).join('') || '<option value="">-- Không có kho nào --</option>';

    var lines     = WH_RECEIPT_LINES_DATA;
    var container = document.getElementById('wh-confirm-lines');
    if (!container) return;
    var dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    container.innerHTML = lines.map(function (item, i) {
        var ingId   = item.IngredientID || item.ingredientID;
        var ingName = (item.Ingredient && (item.Ingredient.Name || item.Ingredient.name))
            || item.IngredientName || item.ingredientName || ('Nguyên liệu ' + ingId);
        var ingCode = ingName.toUpperCase().replace(/\s+/g, '-').slice(0, 8);
        return '<div class="receipt-line">'
            + '<div class="receipt-line-title">' + ingName + '</div>'
            + '<div class="form-row-3">'
            + '<div class="form-group"><label>NSX (Mfd) *</label>'
            + '<input type="date" id="cl-mfd-' + i + '"></div>'
            + '<div class="form-group"><label>HSD (Exp) *</label>'
            + '<input type="date" id="cl-exp-' + i + '"></div>'
            + '<div class="form-group"><label>Mã batch (tùy chọn)</label>'
            + '<input type="text" id="cl-code-' + i + '" placeholder="BT-' + ingCode + '-' + dateStamp + '"></div>'
            + '</div></div>';
    }).join('');
}

function submitConfirmReceipt() {
    if (!WH_RECEIPT_ID) { toast('Chưa có Receipt ID!', 'error'); return; }
    var empId = localStorage.getItem('employeeId');
    var whId  = parseInt(document.getElementById('wh-confirm-warehouse').value);
    if (!whId) { toast('Vui lòng chọn kho!', 'error'); return; }

    var confirmLines;
    try {
        confirmLines = WH_RECEIPT_LINES_DATA.map(function (item, i) {
            var mfd = document.getElementById('cl-mfd-' + i).value;
            var exp = document.getElementById('cl-exp-' + i).value;
            if (!mfd || !exp) throw new Error('Vui lòng nhập NSX và HSD cho tất cả nguyên liệu!');
            return {
                IngredientID: item.IngredientID || item.ingredientID,
                WarehouseID:  whId,
                Mfd:          mfd,
                Exp:          exp,
                BatchCode:    document.getElementById('cl-code-' + i).value.trim() || null
            };
        });
    } catch (e) { toast(e.message, 'error'); return; }

    apiPost('/receipt/confirm', { ReceiptID: WH_RECEIPT_ID, EmployeeID: empId, Lines: confirmLines })
        .then(function (r) {
            if (!r.ok) return r.json().then(function (d) { throw new Error(d.message || 'Lỗi xác nhận'); });
            return r.json();
        }).then(function () {
            toast('Xác nhận nhập kho thành công! Batch đã được tạo.');
            WH_RECEIPT_ID = null; WH_PO_DATA = null;
            whGoStep(1);
            loadOrderedPOs();
            renderWhHistory();
        }).catch(function (err) { toast(err.message || 'Lỗi xác nhận nhập kho!', 'error'); });
}

function renderWhHistory() {
    var storeId = localStorage.getItem('storeId');
    apiGet('/receipt/getbystore/' + storeId).then(function (r) { return r.json(); }).then(function (data) {
        var fromApi = Array.isArray(data) ? data : (data.data || []);
        WAREHOUSE_LOG = fromApi.length ? fromApi : MOCK_WAREHOUSE_LOG;
        renderWhHistoryLocal();
    }).catch(function () {
        if (!WAREHOUSE_LOG.length) WAREHOUSE_LOG = MOCK_WAREHOUSE_LOG;
        renderWhHistoryLocal();
    });
}

function renderWhHistoryLocal() {
    var tbody = document.getElementById('warehouse-tbody');
    if (!tbody) return;
    if (!WAREHOUSE_LOG.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="tbl-empty">Chưa có phiếu nhập</td></tr>';
        return;
    }
    tbody.innerHTML = WAREHOUSE_LOG.map(function (r) {
        var id     = r.ReceiptID || r.receiptID || '—';
        var poId   = r.POID      || r.poid      || '—';
        var emp    = (r.Employee && (r.Employee.FullName || r.Employee.fullName)) || '—';
        var date   = r.DateReceive || r.dateReceive || '—';
        var status = r.Status     || r.status     || '—';
        var badgeCls = status === 'Confirmed' ? 'badge-green' : 'badge-yellow';
        return '<tr>'
            + '<td style="color:var(--primary);font-weight:700;font-size:12px">' + String(id).slice(0, 12) + '...</td>'
            + '<td style="font-size:12px;color:var(--muted)">' + String(poId).slice(0, 12) + '...</td>'
            + '<td>' + emp + '</td>'
            + '<td style="font-size:12px;color:var(--muted)">' + String(date).slice(0, 10) + '</td>'
            + '<td><span class="badge ' + badgeCls + '">' + status + '</span></td>'
            + '</tr>';
    }).join('');
}

// BIẾN ĐỘNG KHO (local only – không có API endpoint)
function addStockMovement() {
    var item = document.getElementById('sm-item').value.trim();
    var type = document.getElementById('sm-type').value;
    var qty  = document.getElementById('sm-qty').value;
    var unit = document.getElementById('sm-unit').value;
    var note = document.getElementById('sm-note').value.trim();

    if (!item || !qty || !note) { toast('Vui lòng điền đầy đủ thông tin!', 'error'); return; }

    var sign = (type === 'import') ? '+' : (type === 'adjust' ? '±' : '−');
    STOCK_MOVEMENTS.unshift({ item: item, type: type, qty: sign + qty + ' ' + unit, note: note, time: new Date().toLocaleString('vi-VN') });

    document.getElementById('sm-item').value = '';
    document.getElementById('sm-qty').value  = '';
    document.getElementById('sm-note').value = '';
    renderStockMove();
    toast('Ghi nhận biến động kho thành công!');
}

function renderStockMove() {
    var tbody = document.getElementById('stockmove-tbody');
    if (!STOCK_MOVEMENTS.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="tbl-empty">Chưa có dữ liệu</td></tr>';
        return;
    }
    tbody.innerHTML = STOCK_MOVEMENTS.map(function (s) {
        var badgeCls = MOVE_BADGE[s.type] || 'badge-gray';
        return '<tr>'
            + '<td><strong>' + s.item + '</strong></td>'
            + '<td><span class="badge ' + badgeCls + '">' + MOVE_LABEL[s.type] + '</span></td>'
            + '<td><strong>' + s.qty + '</strong></td>'
            + '<td style="font-size:12px;color:var(--muted)">' + s.note + '</td>'
            + '<td style="font-size:12px;color:var(--muted)">' + s.time + '</td>'
            + '</tr>';
    }).join('');
}

// GIAO HÀNG
function renderDelivery() {
    var start = '2020-01-01';
    var end   = new Date().toISOString().slice(0, 10);
    apiGet('/delivery/get-all/' + start + '/' + end).then(function (r) { return r.json(); }).then(function (data) {
        var fromApi = Array.isArray(data) ? data : (data.data || []);
        DELIVERIES = fromApi.length ? fromApi : MOCK_DELIVERIES;
        renderDeliveryLocal();
    }).catch(function () {
        if (!DELIVERIES.length) DELIVERIES = MOCK_DELIVERIES;
        renderDeliveryLocal();
    });
}

function getDeliveryStatus(d) {
    var logs = d.deliveryLog || d.DeliveryLog || [];
    if (!logs.length) return '';
    var last = logs[0];
    return (last.status || last.Status || '').toLowerCase();
}

function getDeliveryAddrText(d) {
    var a = d.address || d.Address || {};
    var parts = [];
    if (a.streetAddress) parts.push(a.streetAddress);
    if (a.district)      parts.push(a.district);
    if (a.province)      parts.push(a.province);
    return parts.join(', ') || (d.addressID || d.AddressID || '—');
}

function renderDeliveryLocal() {
    var pending = DELIVERIES.filter(function (d) { return getDeliveryStatus(d) === 'pending'; });
    var done    = DELIVERIES.filter(function (d) { return getDeliveryStatus(d) !== 'pending'; });

    var pList = document.getElementById('delivery-pending-list');
    if (!pList) return;
    if (!pending.length) {
        pList.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px">Không có đơn hàng đang chờ giao.</p>';
    } else {
        pList.innerHTML = pending.map(function (d) {
            var delivId  = d.deliveryID || d.DeliveryID || '';
            var billId   = d.billID || d.BillID || '';
            var user     = d.user || d.User || {};
            var customer = user.fullName || user.FullName || ('BillID: ' + String(billId).slice(0, 8));
            var address  = getDeliveryAddrText(d);
            return '<div class="delivery-item">'
                + '<div class="del-info">'
                + '<div class="del-id">Đơn: ' + String(billId).slice(0, 8).toUpperCase() + '</div>'
                + '<div class="del-customer">' + customer + '</div>'
                + '<div class="del-addr"><i class="ti-location-pin"></i> ' + address + '</div>'
                + '</div>'
                + '<div style="display:flex;gap:8px;align-items:center">'
                + '<input type="text" placeholder="Ghi chú..." style="padding:6px 10px;border:1px solid #e8e8e8;border-radius:6px;font-size:12px;width:160px" id="del-note-' + delivId + '">'
                + '<button class="btn btn-success btn-sm" onclick="confirmDelivery(\'' + delivId + '\')">'
                + '<i class="ti-check"></i> Đã giao</button>'
                + '</div></div>';
        }).join('');
    }

    var tbody = document.getElementById('delivery-done-tbody');
    if (!done.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="tbl-empty">Chưa có lịch sử</td></tr>';
        return;
    }
    tbody.innerHTML = done.map(function (d) {
        var delivId  = d.deliveryID || d.DeliveryID || '';
        var billId   = d.billID || d.BillID || '';
        var user     = d.user || d.User || {};
        var customer = user.fullName || user.FullName || ('BillID: ' + String(billId).slice(0, 8));
        var address  = getDeliveryAddrText(d);
        var logs     = d.deliveryLog || d.DeliveryLog || [];
        var lastLog  = logs[0] || {};
        var at       = lastLog.changeAt || lastLog.ChangeAt || '—';
        var note     = lastLog.note || lastLog.Note || d.note || d.Note || '—';
        return '<tr>'
            + '<td><strong style="color:var(--primary)">' + String(billId).slice(0, 8).toUpperCase() + '</strong></td>'
            + '<td>' + customer + '</td>'
            + '<td style="font-size:12px;color:var(--muted)">' + address + '</td>'
            + '<td style="font-size:12px">' + String(at).replace('T', ' ').slice(0, 16) + '</td>'
            + '<td style="font-size:12px">' + (getDeliveryStatus(d) || '—') + '</td>'
            + '<td style="font-size:12px;color:var(--muted)">' + note + '</td>'
            + '</tr>';
    }).join('');
}

function confirmDelivery(deliveryId) {
    var d = DELIVERIES.find(function (x) {
        return (x.deliveryID || x.DeliveryID) == deliveryId;
    });
    if (!d) return;
    var noteEl   = document.getElementById('del-note-' + deliveryId);
    var note     = noteEl ? noteEl.value.trim() : '';
    var empId    = localStorage.getItem('employeeId');
    var received = parseFloat(prompt('Nhập số tiền khách trả (VND):', '') || '0') || 0;

    apiPut('/delivery/update/' + deliveryId, {
        Status: 'Delivered',
        Note: note,
        EmployeeID: empId,
        MoneyReceived: received,
        ChangeAt: new Date().toISOString()
    }).then(function (r) {
            if (!r.ok) return r.text().then(function (t) { throw new Error(t); });
            var logs = d.deliveryLog || d.DeliveryLog || [];
            logs.unshift({ status: 'Delivered', changeAt: new Date().toISOString(), note: note });
            renderDeliveryLocal();
            toast('Đã xác nhận giao đơn ' + String(d.billID || d.BillID || '').slice(0, 8).toUpperCase());
        }).catch(function (err) {
            toast('Lỗi cập nhật đơn giao hàng: ' + (err.message || ''), 'error');
        });
}

// ── PROCESSING (Sơ chế) ──────────────────────────────────────────────────────

var PROC_RAW_BATCHES      = [];
var PROC_UNIT_INGREDIENTS = [];
var PROC_WAREHOUSES       = [];
var PROC_ROW_IDX          = 0;
var PROC_ROW_IDS          = [];

function renderProcessing() {
    loadProcWarehouses();
    loadRawBatches();
    loadProcessingHistory();
}

function loadProcWarehouses() {
    var storeId = localStorage.getItem('storeId');
    apiGet('/warehouse/get-by-store/' + storeId).then(function (r) { return r.json(); }).then(function (data) {
        PROC_WAREHOUSES = Array.isArray(data) ? data : (data.data || []);
        var sel = document.getElementById('proc-warehouse');
        if (sel) sel.innerHTML = PROC_WAREHOUSES.map(function (w) {
            return '<option value="' + (w.WarehouseID || w.warehouseID) + '">'
                + (w.Name || w.name || 'Kho ' + (w.WarehouseID || w.warehouseID)) + '</option>';
        }).join('') || '<option value="">-- Không có kho --</option>';
    }).catch(function () {});
}

function loadRawBatches() {
    apiGet('/inventoryBatch/available-raw').then(function (r) { return r.json(); }).then(function (data) {
        var fromApi = Array.isArray(data) ? data : (data.data || []);
        PROC_RAW_BATCHES = fromApi.length ? fromApi : MOCK_RAW_BATCHES;
        var tbody = document.getElementById('proc-raw-tbody');
        if (!PROC_RAW_BATCHES.length) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="tbl-empty">Không có batch thô nào.</td></tr>';
            refreshProcRowSelects();
            return;
        }
        if (tbody) tbody.innerHTML = PROC_RAW_BATCHES.map(function (b) {
            var code = b.BatchCode || b.batchCode || String(b.BatchID || b.batchID || '').slice(0, 8);
            var name = (b.Ingredient && (b.Ingredient.Name || b.Ingredient.name)) || '—';
            var qty  = b.QuantityOnHand !== undefined ? b.QuantityOnHand : (b.quantityOnHand || 0);
            var cost = b.UnitCost       !== undefined ? b.UnitCost       : (b.unitCost       || 0);
            var exp  = b.Exp            || b.exp            || '—';
            return '<tr>'
                + '<td style="font-size:12px;color:var(--muted)">' + code + '</td>'
                + '<td><strong>' + name + '</strong></td>'
                + '<td><strong style="color:var(--primary)">' + qty + ' kg</strong></td>'
                + '<td>' + parseInt(cost).toLocaleString('vi-VN') + 'đ/kg</td>'
                + '<td style="font-size:12px">' + exp + '</td>'
                + '</tr>';
        }).join('');
        refreshProcRowSelects();
    }).catch(function () {
        PROC_RAW_BATCHES = MOCK_RAW_BATCHES;
        var tbody = document.getElementById('proc-raw-tbody');
        if (tbody) tbody.innerHTML = PROC_RAW_BATCHES.map(function (b) {
            var code = b.BatchCode || b.batchCode || String(b.BatchID || '').slice(0, 8);
            var name = (b.Ingredient && (b.Ingredient.Name || b.Ingredient.name)) || '—';
            var qty  = b.QuantityOnHand !== undefined ? b.QuantityOnHand : 0;
            var cost = b.UnitCost       !== undefined ? b.UnitCost       : 0;
            var exp  = b.Exp            || b.exp            || '—';
            return '<tr>'
                + '<td style="font-size:12px;color:var(--muted)">' + code + '</td>'
                + '<td><strong>' + name + '</strong></td>'
                + '<td><strong style="color:var(--primary)">' + qty + ' kg</strong></td>'
                + '<td>' + parseInt(cost).toLocaleString('vi-VN') + 'đ/kg</td>'
                + '<td style="font-size:12px">' + exp + '</td>'
                + '</tr>';
        }).join('');
        refreshProcRowSelects();
    });
}

function loadProcessingHistory() {
    var end   = new Date().toISOString().slice(0, 10);
    var start = '2020-01-01';
    apiGet('/processing/get-all/' + start + '/' + end).then(function (r) { return r.json(); }).then(function (data) {
        var fromApi = Array.isArray(data) ? data : (data.data || []);
        var list    = fromApi.length ? fromApi : MOCK_PROC_HISTORY;
        renderProcHistoryLocal(list);
    }).catch(function () {
        renderProcHistoryLocal(MOCK_PROC_HISTORY);
    });
}

function renderProcHistoryLocal(list) {
    var tbody = document.getElementById('proc-history-tbody');
    if (!tbody) return;
    if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="tbl-empty">Chưa có phiếu sơ chế</td></tr>';
        return;
    }
    tbody.innerHTML = list.map(function (p) {
        var id  = p.ProcessingID || p.processingID || '—';
        var emp = (p.Employee && (p.Employee.FullName || p.Employee.fullName)) || '—';
        var at  = String(p.ProcessedAt || p.processedAt || '—').slice(0, 16).replace('T', ' ');
        var nt  = p.Note || p.note || '—';
        return '<tr>'
            + '<td style="color:var(--primary);font-size:12px">' + String(id).slice(0, 10) + '...</td>'
            + '<td>' + emp + '</td>'
            + '<td style="font-size:12px;color:var(--muted)">' + at + '</td>'
            + '<td style="font-size:12px;color:var(--muted)">' + nt + '</td>'
            + '</tr>';
    }).join('');
}

function buildBatchOpts(selId) {
    return PROC_RAW_BATCHES.map(function (b) {
        var id   = b.BatchID || b.batchID;
        var name = (b.Ingredient && (b.Ingredient.Name || b.Ingredient.name)) || '?';
        var qty  = b.QuantityOnHand !== undefined ? b.QuantityOnHand : 0;
        var code = b.BatchCode || b.batchCode || String(id).slice(0, 6);
        return '<option value="' + id + '"' + (selId == id ? ' selected' : '') + '>'
            + name + ' — ' + qty + 'kg (' + code + ')</option>';
    }).join('');
}

function buildUnitIngOpts(selId) {
    return PROC_UNIT_INGREDIENTS.map(function (ing) {
        var id   = ing.IngredientID || ing.ingredientID;
        var name = ing.Name || ing.name || '?';
        var unit = ing.IngredientUnit || ing.ingredientUnit || '';
        return '<option value="' + id + '"' + (selId == id ? ' selected' : '') + '>'
            + name + ' (' + unit + ')</option>';
    }).join('');
}

function loadUnitIngredients(cb) {
    if (PROC_UNIT_INGREDIENTS.length) { if (cb) cb(); return; }
    apiGet('/ingredient/get-all').then(function (r) { return r.json(); }).then(function (data) {
        var list = Array.isArray(data) ? data : (data.data || []);
        var units = list.filter(function (ing) {
            var u = (ing.IngredientUnit || ing.ingredientUnit || '').toLowerCase();
            return u === 'unit' || u === 'miếng' || u === 'piece';
        });
        PROC_UNIT_INGREDIENTS = units.length ? units : list;
        if (cb) cb();
        refreshProcRowSelects();
    }).catch(function () { if (cb) cb(); });
}

function refreshProcRowSelects() {
    PROC_ROW_IDS.forEach(function (idx) {
        var bSel = document.getElementById('proc-batch-' + idx);
        var iSel = document.getElementById('proc-outingr-' + idx);
        if (bSel && PROC_RAW_BATCHES.length) {
            bSel.innerHTML = '<option value="">-- Chọn batch thô --</option>' + buildBatchOpts(bSel.value);
        }
        if (iSel && PROC_UNIT_INGREDIENTS.length) {
            iSel.innerHTML = '<option value="">-- Chọn nguyên liệu output --</option>' + buildUnitIngOpts(iSel.value);
        }
    });
}

function addProcessingRow() {
    loadUnitIngredients(function () {
        var idx   = PROC_ROW_IDX++;
        var today = new Date().toISOString().slice(0, 10);
        PROC_ROW_IDS.push(idx);
        var container = document.getElementById('proc-items');
        if (!container) return;
        var div = document.createElement('div');
        div.className = 'proc-item-row';
        div.id = 'proc-row-' + idx;
        div.innerHTML = ''
            + '<div class="proc-item-row-header">'
            +   '<span class="proc-item-row-title">Nguyên liệu #' + (PROC_ROW_IDS.length) + '</span>'
            +   '<button class="proc-remove-btn" onclick="removeProcessingRow(' + idx + ')">✕ Xóa</button>'
            + '</div>'
            + '<div class="form-row-2">'
            +   '<div class="form-group"><label>Batch thô (nguồn) *</label>'
            +   '<select id="proc-batch-' + idx + '"><option value="">-- Chọn batch thô --</option>'
            +   buildBatchOpts() + '</select></div>'
            +   '<div class="form-group"><label>Lấy bao nhiêu kg *</label>'
            +   '<input type="number" id="proc-inputkg-' + idx + '" placeholder="10.0" step="0.1" min="0.1"></div>'
            + '</div>'
            + '<div class="form-row-2">'
            +   '<div class="form-group"><label>Nguyên liệu output (Unit) *</label>'
            +   '<select id="proc-outingr-' + idx + '"><option value="">-- Chọn nguyên liệu --</option>'
            +   buildUnitIngOpts() + '</select></div>'
            +   '<div class="form-group"><label>Số miếng đếm được *</label>'
            +   '<input type="number" id="proc-pieces-' + idx + '" placeholder="67" min="1" step="1"></div>'
            + '</div>'
            + '<div class="form-row-3">'
            +   '<div class="form-group"><label>Số túi</label>'
            +   '<input type="number" id="proc-bags-' + idx + '" placeholder="7" min="0" step="1"></div>'
            +   '<div class="form-group"><label>Miếng/túi</label>'
            +   '<input type="number" id="proc-ppb-' + idx + '" placeholder="10" min="0" step="1"></div>'
            +   '<div class="form-group"><label>Ghi chú hao hụt</label>'
            +   '<input type="text" id="proc-waste-' + idx + '" placeholder="Xương vụn ~0.5kg"></div>'
            + '</div>'
            + '<div class="form-row-2">'
            +   '<div class="form-group"><label>NSX (Mfd) *</label>'
            +   '<input type="date" id="proc-mfd-' + idx + '" value="' + today + '"></div>'
            +   '<div class="form-group"><label>HSD (Exp) *</label>'
            +   '<input type="date" id="proc-exp-' + idx + '"></div>'
            + '</div>';
        container.appendChild(div);
    });
}

function removeProcessingRow(idx) {
    var el = document.getElementById('proc-row-' + idx);
    if (el) el.remove();
    PROC_ROW_IDS = PROC_ROW_IDS.filter(function (i) { return i !== idx; });
}

function submitProcessing() {
    if (!PROC_ROW_IDS.length) { toast('Vui lòng thêm ít nhất 1 dòng nguyên liệu!', 'error'); return; }
    var empId = localStorage.getItem('employeeId');
    var whId  = parseInt(document.getElementById('proc-warehouse').value);
    var note  = document.getElementById('proc-note').value.trim();
    if (!whId) { toast('Vui lòng chọn kho!', 'error'); return; }

    var items = [];
    for (var k = 0; k < PROC_ROW_IDS.length; k++) {
        var idx     = PROC_ROW_IDS[k];
        var batchId = document.getElementById('proc-batch-' + idx).value;
        var inputKg = parseFloat(document.getElementById('proc-inputkg-' + idx).value);
        var outIngr = parseInt(document.getElementById('proc-outingr-' + idx).value);
        var pieces  = parseInt(document.getElementById('proc-pieces-' + idx).value);
        var bags    = parseInt(document.getElementById('proc-bags-' + idx).value) || 0;
        var ppb     = parseInt(document.getElementById('proc-ppb-' + idx).value)  || 0;
        var mfd     = document.getElementById('proc-mfd-' + idx).value;
        var exp     = document.getElementById('proc-exp-' + idx).value;
        var waste   = document.getElementById('proc-waste-' + idx).value.trim() || null;
        if (!batchId || !inputKg || !outIngr || !pieces || !mfd || !exp) {
            toast('Vui lòng điền đầy đủ thông tin bắt buộc cho dòng #' + (k + 1) + '!', 'error');
            return;
        }
        items.push({
            SourceBatchID:      batchId,
            InputKg:            inputKg,
            OutputIngredientID: outIngr,
            OutputPieces:       pieces,
            BagCount:           bags,
            PiecesPerBag:       ppb,
            Mfd:                mfd,
            Exp:                exp,
            WasteNote:          waste
        });
    }

    apiPost('/processing/create', { EmployeeID: empId, WarehouseID: whId, Note: note || null, Items: items })
        .then(function (r) {
            if (!r.ok) return r.json().then(function (d) { throw new Error(d.message || 'Lỗi tạo phiếu sơ chế'); });
            return r.json();
        }).then(function () {
            toast('Tạo phiếu sơ chế thành công!');
            document.getElementById('proc-items').innerHTML = '';
            PROC_ROW_IDS = [];
            document.getElementById('proc-note').value = '';
            loadRawBatches();
            loadProcessingHistory();
        }).catch(function (err) { toast(err.message || 'Lỗi tạo phiếu sơ chế!', 'error'); });
}

// ── RECIPE (Công thức) ────────────────────────────────────────────────────────

var RECIPE_INGREDIENTS = [];
var RECIPE_LIST        = [];

function renderRecipe() {
    loadRecipeIngredients();
    loadRecipeProducts();
    loadRecipes();
}

function loadRecipeIngredients() {
    if (RECIPE_INGREDIENTS.length) {
        var sel = document.getElementById('recipe-ingredient');
        if (sel && sel.options.length <= 1) renderRecipeIngSel();
        return;
    }
    apiGet('/ingredient/get-all').then(function (r) { return r.json(); }).then(function (data) {
        RECIPE_INGREDIENTS = Array.isArray(data) ? data : (data.data || []);
        renderRecipeIngSel();
    }).catch(function () {});
}

function renderRecipeIngSel() {
    var sel = document.getElementById('recipe-ingredient');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Chọn nguyên liệu --</option>'
        + RECIPE_INGREDIENTS.map(function (ing) {
            var id   = ing.IngredientID || ing.ingredientID;
            var name = ing.Name || ing.name || '?';
            var unit = ing.IngredientUnit || ing.ingredientUnit || '';
            return '<option value="' + id + '">' + name + ' (' + unit + ')</option>';
        }).join('');
}

function loadRecipeProducts() {
    var sel = document.getElementById('recipe-product');
    if (!sel) return;
    if (MENU.length) { renderRecipeProductSel(MENU); return; }
    apiGet('/product/get-all').then(function (r) { return r.json(); }).then(function (data) {
        var items = [];
        data.forEach(function (p) {
            var variants = p.productVarient || p.ProductVarient || [];
            variants.forEach(function (v) {
                var size = v.size || v.Size || '';
                items.push({
                    id:    v.productVarientID || v.ProductVarientID,
                    name:  (p.productName || p.ProductName || '') + (size ? ' (' + size + ')' : ''),
                    price: v.price || v.Price
                });
            });
        });
        renderRecipeProductSel(items);
    }).catch(function () {});
}

function renderRecipeProductSel(items) {
    var sel = document.getElementById('recipe-product');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Chọn sản phẩm --</option>'
        + items.map(function (m) {
            return '<option value="' + m.id + '">' + m.name
                + ' (' + parseInt(m.price).toLocaleString('vi-VN') + 'đ)</option>';
        }).join('');
}

function loadRecipes() {
    var tbody = document.getElementById('recipe-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="tbl-empty">Đang tải...</td></tr>';
    apiGet('/recipe/get-all').then(function (r) { return r.json(); }).then(function (data) {
        var fromApi = Array.isArray(data) ? data : (data.data || []);
        RECIPE_LIST = fromApi.length ? fromApi : MOCK_RECIPES;
        if (!RECIPE_LIST.length) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="tbl-empty">Chưa có công thức nào.</td></tr>';
            return;
        }
        if (tbody) tbody.innerHTML = RECIPE_LIST.map(function (rc) {
            var ingId        = rc.IngredientID      || rc.ingredientID;
            var pvId         = rc.ProductVarientID  || rc.productVarientID;
            var ingName      = (rc.Ingredient       && (rc.Ingredient.Name       || rc.Ingredient.name))
                            || (rc.ingredient       && (rc.ingredient.name))
                            || ('NL ' + ingId);
            var pvName       = (rc.ProductVarient   && (rc.ProductVarient.ProductName || rc.ProductVarient.productName
                                || (rc.ProductVarient.Product && rc.ProductVarient.Product.ProductName)))
                            || ('SP ' + pvId);
            var qtyAfter     = rc.QtyAfterProcess   !== undefined ? rc.QtyAfterProcess   : (rc.qtyAfterProcess   || 0);
            var batchSize    = rc.BatchSize          !== undefined ? rc.BatchSize          : (rc.batchSize          || 1);
            var isConsumable = rc.IsConsumable       || rc.isConsumable || false;
            var badgeCls     = isConsumable ? 'badge-orange' : 'badge-blue';
            var badgeTxt     = isConsumable ? 'Tiêu hao (Raw)' : 'Miếng (Processed)';
            return '<tr>'
                + '<td><strong>' + pvName + '</strong></td>'
                + '<td>' + ingName + '</td>'
                + '<td><strong>' + qtyAfter + '</strong></td>'
                + '<td>' + batchSize + '</td>'
                + '<td><span class="badge ' + badgeCls + '">' + badgeTxt + '</span></td>'
                + '<td><button class="btn btn-danger btn-sm" onclick="deleteRecipe(' + ingId + ',' + pvId + ')">'
                + '<i class="ti-trash"></i></button></td>'
                + '</tr>';
        }).join('');
    }).catch(function () {
        RECIPE_LIST = MOCK_RECIPES;
        if (tbody) tbody.innerHTML = RECIPE_LIST.map(function (rc) {
            var ingId        = rc.IngredientID      || rc.ingredientID;
            var pvId         = rc.ProductVarientID  || rc.productVarientID;
            var ingName      = (rc.Ingredient       && (rc.Ingredient.Name       || rc.Ingredient.name)) || ('NL ' + ingId);
            var pvName       = (rc.ProductVarient   && (rc.ProductVarient.ProductName || rc.ProductVarient.productName)) || ('SP ' + pvId);
            var qtyAfter     = rc.QtyAfterProcess   !== undefined ? rc.QtyAfterProcess  : 0;
            var batchSize    = rc.BatchSize          !== undefined ? rc.BatchSize        : 1;
            var isConsumable = rc.IsConsumable       || rc.isConsumable || false;
            var badgeCls     = isConsumable ? 'badge-orange' : 'badge-blue';
            var badgeTxt     = isConsumable ? 'Tiêu hao (Raw)' : 'Miếng (Processed)';
            return '<tr>'
                + '<td><strong>' + pvName + '</strong></td>'
                + '<td>' + ingName + '</td>'
                + '<td><strong>' + qtyAfter + '</strong></td>'
                + '<td>' + batchSize + '</td>'
                + '<td><span class="badge ' + badgeCls + '">' + badgeTxt + '</span></td>'
                + '<td><button class="btn btn-danger btn-sm" onclick="deleteRecipe(' + ingId + ',' + pvId + ')"><i class="ti-trash"></i></button></td>'
                + '</tr>';
        }).join('');
    });
}

function addRecipe() {
    var pvId         = parseInt(document.getElementById('recipe-product').value);
    var ingId        = parseInt(document.getElementById('recipe-ingredient').value);
    var qtyAfter     = parseFloat(document.getElementById('recipe-qty-after').value);
    var batchSize    = parseFloat(document.getElementById('recipe-batch-size').value) || 1;
    var isConsumable = document.getElementById('recipe-consumable').checked;
    if (!pvId || !ingId || !qtyAfter) { toast('Vui lòng điền đầy đủ thông tin bắt buộc!', 'error'); return; }

    apiPost('/recipe/add', {
        IngredientID:     ingId,
        ProductVarientID: pvId,
        QtyBeforeProcess: 0,
        QtyAfterProcess:  qtyAfter,
        IsConsumable:     isConsumable,
        BatchSize:        batchSize
    }).then(function (r) {
        if (!r.ok) return r.json().then(function (d) { throw new Error(d.message || 'Lỗi thêm công thức'); });
        return r.text();
    }).then(function () {
        toast('Thêm công thức thành công!');
        ['recipe-product', 'recipe-ingredient', 'recipe-qty-after'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.getElementById('recipe-batch-size').value = '1';
        document.getElementById('recipe-consumable').checked = false;
        RECIPE_LIST = [];
        loadRecipes();
    }).catch(function (err) { toast(err.message || 'Lỗi thêm công thức!', 'error'); });
}

function deleteRecipe(ingId, pvId) {
    if (!confirm('Xóa công thức này?')) return;
    apiDelete('/recipe/Delete/' + ingId + '/' + pvId).then(function (r) {
        if (!r.ok) throw new Error();
        toast('Đã xóa công thức!');
        RECIPE_LIST = [];
        loadRecipes();
    }).catch(function () { toast('Lỗi xóa công thức!', 'error'); });
}

// ─────────────────────────────────────────────────────────
// TỔNG QUAN DASHBOARD
// ─────────────────────────────────────────────────────────
var DASH_CLOCK_INTERVAL = null;
var DASH_DEFAULT_TASKS = [
    { id:'t01', txt:'Kiểm tra nguyên liệu đầu ca',        time:'07:00' },
    { id:'t02', txt:'Vệ sinh khu vực bếp và quầy',        time:'07:15' },
    { id:'t03', txt:'Bổ sung dầu chiên vào nồi',          time:'07:30' },
    { id:'t04', txt:'Chuẩn bị bột tẩm gà ca sáng',        time:'07:45' },
    { id:'t05', txt:'Nhận hàng từ nhà cung cấp',          time:'08:00' },
    { id:'t06', txt:'Kiểm tra nhiệt độ tủ đông',           time:'08:30' },
    { id:'t07', txt:'Sơ chế gà cho ca trưa',               time:'09:00' },
    { id:'t08', txt:'Kiểm tra hạn dùng nguyên liệu',       time:'09:30' },
    { id:'t09', txt:'Lau chùi bàn ghế phòng ăn',          time:'10:00' },
    { id:'t10', txt:'Kiểm tra đơn giao hàng đang chờ',    time:'10:30' },
    { id:'t11', txt:'Bổ sung khoai tây vào kho lạnh',     time:'11:00' },
    { id:'t12', txt:'Chốt số đơn buổi sáng',               time:'12:00' },
    { id:'t13', txt:'Thay dầu chiên ca trưa',              time:'13:00' },
    { id:'t14', txt:'Kiểm tra sơ đồ bàn ca chiều',         time:'14:00' },
    { id:'t15', txt:'Sơ chế gà cho ca tối',                time:'15:00' },
    { id:'t16', txt:'Vệ sinh thiết bị chiên',              time:'16:00' },
    { id:'t17', txt:'Bổ sung đồ uống tủ lạnh',             time:'17:00' },
    { id:'t18', txt:'Kiểm tra đơn giao hàng ca tối',       time:'19:00' },
    { id:'t19', txt:'Báo cáo tồn kho cuối ca',             time:'23:00' },
    { id:'t20', txt:'Tổng kết doanh thu và chốt ca',       time:'23:30' },
];

function dashShowInvoiceStats() {
    var count   = INVOICES.length;
    var revenue = INVOICES.reduce(function (s, inv) { return s + (inv.total || 0); }, 0);
    var countEl  = document.getElementById('dash-bill-count');
    var revEl    = document.getElementById('dash-revenue');
    var deltaEl  = document.getElementById('dash-bill-delta');
    var revDelta = document.getElementById('dash-rev-delta');
    if (countEl) countEl.textContent = count;
    if (revEl)   revEl.textContent   = revenue >= 1000000
        ? (revenue / 1000000).toFixed(1).replace('.0', '') + 'tr'
        : revenue.toLocaleString('vi-VN') + 'đ';
    if (deltaEl) deltaEl.textContent  = '↑ ' + count + ' đơn hôm nay';
    if (revDelta) revDelta.textContent = 'Doanh thu trong ca';
    var mockBills = INVOICES.slice(0, 4).map(function (inv) {
        return {
            BillID:      inv.id,
            Total:       inv.total,
            BillChange:  [{ Status: 'Paid', ChangeAt: new Date().toISOString() }],
            BillDetail:  [{ Quantity: 1 }, { Quantity: 1 }]
        };
    });
    renderDashOrders(mockBills);
}

function renderDashboard() {
    // 1. Greeting + avatar
    var name = localStorage.getItem('fullName') || 'Nhân viên';
    var nameEl = document.getElementById('dash-name');
    if (nameEl) nameEl.textContent = name;
    var avatarEl = document.getElementById('dash-avatar');
    if (avatarEl) {
        var parts    = name.trim().split(' ');
        var initials = parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : name.slice(0, 2).toUpperCase();
        avatarEl.textContent = initials;
    }

    // 2. Date label
    var dateEl = document.getElementById('dash-date');
    if (dateEl) {
        var now  = new Date();
        var days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
        dateEl.textContent = days[now.getDay()] + ', '
            + String(now.getDate()).padStart(2, '0') + '/'
            + String(now.getMonth() + 1).padStart(2, '0') + '/'
            + now.getFullYear();
    }

    // 3. Live clock
    if (DASH_CLOCK_INTERVAL) clearInterval(DASH_CLOCK_INTERVAL);
    function tickClock() {
        var el = document.getElementById('dash-clock');
        if (!el) { clearInterval(DASH_CLOCK_INTERVAL); return; }
        var n = new Date();
        el.textContent = String(n.getHours()).padStart(2, '0') + ':'
            + String(n.getMinutes()).padStart(2, '0') + ':'
            + String(n.getSeconds()).padStart(2, '0');
    }
    tickClock();
    DASH_CLOCK_INTERVAL = setInterval(tickClock, 1000);

    // 4. Employee info + shift từ API
    apiGet('/auth/me/employee', true).then(function (r) { return r.ok ? r.json() : null; }).then(function (emp) {
        if (!emp) return;
        // Shift info
        var shift = emp.Shift || emp.shift || (emp.Shifts && emp.Shifts[0]) || null;
        var posEl = document.getElementById('dash-shift-pos');
        if (posEl) {
            var storeName = (emp.Store && (emp.Store.StoreName || emp.Store.storeName))
                || localStorage.getItem('storeName') || 'Chi nhánh';
            posEl.textContent = (emp.RoleType || emp.roleType || 'Nhân viên') + ' · ' + storeName;
        }
        if (shift) {
            var timeIn  = shift.TimeIn  || shift.timeIn  || '';
            var timeOut = shift.TimeOut || shift.timeOut || '';
            var shiftEl = document.getElementById('dash-shift-time');
            if (shiftEl && timeIn) {
                shiftEl.textContent = dashFmtTime(timeIn) + ' – ' + dashFmtTime(timeOut);
            }
            updateShiftElapsed(timeIn, timeOut);
            var managerEl = document.getElementById('dash-shift-manager');
            if (managerEl) {
                var mgr = shift.ManagerName || shift.managerName || shift.Manager || shift.manager
                    || (emp.Manager && (emp.Manager.FullName || emp.Manager.fullName))
                    || null;
                if (mgr) managerEl.textContent = mgr;
            }
        }
    }).catch(function () {});

    // 5. Today's bills → count, revenue, recent orders
    var today = dashTodayStr();
    apiGet('/bill/get-all/' + today + '/' + today, true).then(function (r) {
        return r.ok ? r.json() : [];
    }).then(function (bills) {
        if (!Array.isArray(bills)) bills = [];
        if (!bills.length) {
            dashShowInvoiceStats();
            return;
        }
        var count   = bills.length;
        var revenue = bills.reduce(function (s, b) { return s + (Number(b.Total) || 0); }, 0);
        var countEl  = document.getElementById('dash-bill-count');
        var revEl    = document.getElementById('dash-revenue');
        var deltaEl  = document.getElementById('dash-bill-delta');
        var revDelta = document.getElementById('dash-rev-delta');
        if (countEl) countEl.textContent = count;
        if (revEl)   revEl.textContent   = revenue >= 1000000
            ? (revenue / 1000000).toFixed(1).replace('.0', '') + 'tr'
            : revenue.toLocaleString('vi-VN') + 'đ';
        if (deltaEl) deltaEl.textContent  = '↑ ' + count + ' đơn hôm nay';
        if (revDelta && revenue > 0) revDelta.textContent = 'Doanh thu trong ca';
        renderDashOrders(bills.slice(0, 4));
    }).catch(function () {
        dashShowInvoiceStats();
    });

    // 6. Reviews → rating
    apiGet('/review/get-all', true).then(function (r) { return r.ok ? r.json() : []; }).then(function (data) {
        var reviews = Array.isArray(data) ? data : (data.data || []);
        if (!reviews.length) return;
        var avg = reviews.reduce(function (s, rv) { return s + (Number(rv.Rating || rv.rating) || 0); }, 0) / reviews.length;
        var ratingEl = document.getElementById('dash-rating');
        var ratingDelta = document.getElementById('dash-rating-delta');
        if (ratingEl) ratingEl.textContent = avg.toFixed(1);
        if (ratingDelta) ratingDelta.textContent = '⭐ ' + reviews.length + ' đánh giá';
    }).catch(function () {});

    // 7. Ingredients count → "theo dõi"
    apiGet('/ingredient/get-all', true).then(function (r) { return r.ok ? r.json() : []; }).then(function (data) {
        var list = Array.isArray(data) ? data : (data.data || []);
        var el   = document.getElementById('dash-lowstock');
        var note = document.getElementById('dash-lowstock-note');
        if (el)   el.textContent   = list.length;
        if (note) note.textContent = 'Tổng nguyên liệu quản lý';
    }).catch(function () {
        var note = document.getElementById('dash-lowstock-note');
        if (note) note.textContent = '';
    });

    // 8. Tasks
    renderDashTasks();
}

function dashTodayStr() {
    var n = new Date();
    return n.getFullYear() + '-'
        + String(n.getMonth() + 1).padStart(2, '0') + '-'
        + String(n.getDate()).padStart(2, '0');
}

function dashFmtTime(dt) {
    if (!dt) return '--:--';
    var d = new Date(dt);
    if (isNaN(d.getTime())) {
        // Try parsing as "HH:mm" string
        return String(dt).slice(0, 5);
    }
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

function updateShiftElapsed(timeIn, timeOut) {
    var now  = new Date();
    var inD  = new Date(timeIn);
    var outD = new Date(timeOut);
    if (isNaN(inD.getTime()) || isNaN(outD.getTime())) return;

    var workedMs  = now - inD;
    var remainMs  = outD - now;
    var workedEl  = document.getElementById('dash-worked');
    var remainEl  = document.getElementById('dash-remaining');

    if (workedEl && workedMs > 0) {
        var wh = Math.floor(workedMs / 3600000);
        var wm = Math.floor((workedMs % 3600000) / 60000);
        workedEl.textContent = wh + 'h ' + wm + 'm';
    }
    if (remainEl) {
        if (remainMs > 0) {
            var rh = Math.floor(remainMs / 3600000);
            var rm = Math.floor((remainMs % 3600000) / 60000);
            remainEl.textContent = rh > 0 ? rh + 'h ' + rm + 'm' : rm + 'm';
        } else {
            remainEl.textContent = 'Xong';
        }
    }
}

// ── Render recent orders ───────────────────────────────
var BILL_STATUS_LABEL = { Create: 'Mới', UnPaid: 'Đang làm', Paid: 'Xong', Delete: 'Hủy' };
var BILL_STATUS_CLS   = { Create: 'ds-new', UnPaid: 'ds-cooking', Paid: 'ds-done', Delete: 'ds-delete' };

function renderDashOrders(bills) {
    var container = document.getElementById('dash-orders-body');
    if (!container) return;
    if (!bills || !bills.length) {
        container.innerHTML = '<p style="color:var(--muted);font-size:12px;text-align:center;padding:16px 0">Chưa có đơn hàng hôm nay</p>';
        return;
    }
    container.innerHTML = bills.map(function (b) {
        var changes   = b.BillChange || b.billChange || [];
        var sorted    = changes.slice().sort(function (a, x) { return new Date(x.ChangeAt || x.changeAt) - new Date(a.ChangeAt || a.changeAt); });
        var lastSt    = sorted.length ? (sorted[0].Status || sorted[0].status || 'Create') : 'Create';
        var statusLbl = BILL_STATUS_LABEL[lastSt] || lastSt;
        var statusCls = BILL_STATUS_CLS[lastSt]   || 'ds-new';
        var details   = b.BillDetail || b.billDetail || [];
        var itemsStr  = details.length
            ? details.slice(0, 2).map(function (d) {
                return (d.Quantity || d.quantity || 1) + 'x SP';
              }).join(', ') + (details.length > 2 ? ', ...' : '')
            : '—';
        var shortId = '#DH-' + String(b.BillID || '').replace(/-/g,'').slice(-6).toUpperCase();
        return '<div class="dash-order-row">'
            + '<div>'
            +   '<div class="dash-order-id">' + shortId + '</div>'
            +   '<div class="dash-order-items">' + itemsStr + '</div>'
            + '</div>'
            + '<div style="text-align:right">'
            +   '<div class="dash-order-price">' + Number(b.Total || 0).toLocaleString('vi-VN') + 'đ</div>'
            +   '<span class="' + statusCls + '">' + statusLbl + '</span>'
            + '</div>'
            + '</div>';
    }).join('');
}

// ── Tasks (lưu localStorage theo ngày + employeeId) ───
function dashTasksKey() {
    return 'dashTasks_' + dashTodayStr() + '_' + (localStorage.getItem('employeeId') || 'x');
}

function getDashTasks() {
    try {
        var raw = localStorage.getItem(dashTasksKey());
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return DASH_DEFAULT_TASKS.map(function (t) { return { id: t.id, txt: t.txt, time: t.time, done: false }; });
}

function saveDashTasks(tasks) {
    try { localStorage.setItem(dashTasksKey(), JSON.stringify(tasks)); } catch (e) {}
}

function renderDashTasks() {
    var tasks      = getDashTasks();
    var container  = document.getElementById('dash-tasks-body');
    var progressEl = document.getElementById('dash-task-progress');
    if (!container) return;
    var doneCount = tasks.filter(function (t) { return t.done; }).length;
    if (progressEl) progressEl.textContent = doneCount + '/' + tasks.length + ' xong';
    var pct = tasks.length ? Math.round(doneCount / tasks.length * 100) : 0;
    var pctEl  = document.getElementById('dash-task-pct');
    var fillEl = document.getElementById('dash-task-fill');
    if (pctEl)  pctEl.textContent   = pct + '%';
    if (fillEl) fillEl.style.width  = pct + '%';
    container.innerHTML = tasks.map(function (t, i) {
        return '<div class="dash-task-row">'
            + '<div class="dash-task-check ' + (t.done ? 'done' : '') + '" onclick="toggleDashTask(' + i + ')">'
            + (t.done ? '<i class="ti-check" style="font-size:10px;color:#fff"></i>' : '')
            + '</div>'
            + '<div class="dash-task-txt ' + (t.done ? 'done' : '') + '">' + t.txt + '</div>'
            + '<div class="dash-task-time">' + t.time + '</div>'
            + '</div>';
    }).join('');
}

function toggleDashTask(i) {
    var tasks = getDashTasks();
    if (tasks[i]) { tasks[i].done = !tasks[i].done; saveDashTasks(tasks); renderDashTasks(); }
}

// ── Quick action stubs ────────────────────────────────
function dashRequestLeave()   { toast('Chức năng xin nghỉ phép chưa được kích hoạt — liên hệ quản lý trực tiếp', 'error'); }
function dashContactManager() { toast('Vui lòng liên hệ quản lý qua điện thoại hoặc trực tiếp tại quầy', 'error'); }

// ─────────────────────────────────────────────────────────
// PHONE LOOKUP
// ─────────────────────────────────────────────────────────
function phoneLookupDebounce(val) {
    var hint  = document.getElementById('inv-phone-hint');
    clearTimeout(PHONE_LOOKUP_TIMER);
    var phone = (val || '').replace(/\s+/g, '');
    if (phone.length < 10) {
        if (hint) { hint.textContent = ''; hint.className = 'phone-hint'; }
        return;
    }
    if (hint) { hint.textContent = 'Đang tra cứu...'; hint.className = 'phone-hint loading'; }
    PHONE_LOOKUP_TIMER = setTimeout(function () {
        apiGet('/user/lookup-by-phone?phone=' + encodeURIComponent(phone), true)
            .then(function (r) {
                if (r.status === 404) return null;
                if (!r.ok) throw new Error();
                return r.json();
            })
            .then(function (data) {
                if (!data) {
                    if (hint) { hint.textContent = 'Khách mới'; hint.className = 'phone-hint new'; }
                    return;
                }
                var label = data.isRegistered
                    ? '✓ Khách cũ (có tài khoản): ' + data.fullName
                    : '✓ Khách cũ (đã từng mua)' + (data.fullName ? ': ' + data.fullName : '');
                if (hint) { hint.textContent = label; hint.className = 'phone-hint found'; }
                var nameEl = document.getElementById('inv-customer');
                if (nameEl && data.fullName) {
                    if (data.isRegistered) {
                        // Luôn dùng tên từ tài khoản đã đăng ký
                        nameEl.value = data.fullName;
                    } else if (!nameEl.value.trim()) {
                        // Khách vãng lai: chỉ điền nếu field đang trống
                        nameEl.value = data.fullName;
                    }
                }
            })
            .catch(function () {
                if (hint) { hint.textContent = ''; hint.className = 'phone-hint'; }
            });
    }, 500);
}

// ─────────────────────────────────────────────────────────
// TABLE DROPDOWN
// ─────────────────────────────────────────────────────────
function onInvTypeChange() {
    var type       = document.getElementById('inv-type').value;
    var tableGroup = document.getElementById('inv-table-group');
    if (tableGroup) tableGroup.style.display = (type === 'dine-in') ? '' : 'none';
    if (type === 'dine-in') loadAvailableTables();
}

function loadAvailableTables() {
    var storeId = localStorage.getItem('storeId');
    apiGet('/diningtable/get-all?storeID=' + storeId).then(function (r) { return r.json(); }).then(function (data) {
        var fromApi = Array.isArray(data) ? data : (data.data || []);
        if (fromApi.length) TABLES = fromApi;
        renderTableSelect(TABLES.filter(function (t) {
            return (t.Status || t.status || '').toLowerCase() === 'available';
        }));
    }).catch(function () {
        renderTableSelect(TABLES.filter(function (t) {
            return (t.Status || t.status || '').toLowerCase() === 'available';
        }));
    });
}

function renderTableSelect(tables) {
    var sel = document.getElementById('inv-table');
    if (!sel) return;
    if (!tables.length) {
        sel.innerHTML = '<option value="">-- Không có bàn trống --</option>';
        return;
    }
    sel.innerHTML = '<option value="">-- Chọn bàn --</option>'
        + tables.map(function (t) {
            var id  = t.TableID || t.id;
            var num = t.TableNumber || t.num || id;
            var cap = t.SeatingCapacity || t.capacity || 0;
            return '<option value="' + id + '">B' + num + ' — ' + cap + ' chỗ</option>';
        }).join('');
}

// ─────────────────────────────────────────────────────────
// XEM TỒN KHO (read-only)
// ─────────────────────────────────────────────────────────
var VS_BATCHES = [];
var VS_WAREHOUSES = [];
var vsStatusFilter = 'all';
var vsTypeFilter = 'all';
var vsWhFilter = 'all';
var vsIngSearch = '';

function vsIsBatchExpiring(b) {
    if (!b.exp) return false;
    var d = new Date(b.exp), now = new Date();
    var diff = (d - now) / 86400000;
    return diff >= 0 && diff <= 7;
}
function vsBatchDS(b) {
    if (b.status === 'Available' && vsIsBatchExpiring(b)) return 'expiring';
    return b.status;
}
function vsFmt(n) { return Number(n).toLocaleString('vi-VN'); }

function renderViewStock() {
    var it = document.getElementById('vs-batch-tbody');
    var ig = document.getElementById('vs-ing-tbody');
    var sr = document.getElementById('vs-stats-row');
    if (!it) return;
    it.innerHTML = '<tr><td colspan="10" class="tbl-empty">Đang tải...</td></tr>';
    if (ig) ig.innerHTML = '<tr><td colspan="5" class="tbl-empty">Đang tải...</td></tr>';

    apiGet('/warehouse/get-all').then(function (r) { return r.ok ? r.json() : []; }).then(function (warehouses) {
        VS_WAREHOUSES = warehouses || [];
        return Promise.all(VS_WAREHOUSES.map(function (wh) {
            return apiGet('/inventorybatch/by-warehouse/' + wh.warehouseID)
                .then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
        }));
    }).then(function (arrays) {
        VS_BATCHES = [].concat.apply([], arrays).sort(function (a, b) {
            return new Date(a.importDate) - new Date(b.importDate);
        });

        // Populate kho select
        var whSel = document.getElementById('vs-wh-filter');
        if (whSel) {
            whSel.innerHTML = '<option value="all">Tất cả kho</option>' +
                VS_WAREHOUSES.map(function (wh) {
                    return '<option value="' + wh.warehouseID + '">Kho #' + wh.warehouseID + ' — ' + (wh.store ? wh.store.storeName : '') + '</option>';
                }).join('');
        }

        vsRenderStats();
        vsRenderIngSummary();
        vsRenderBatchTable();
    }).catch(function () {
        it.innerHTML = '<tr><td colspan="10" class="tbl-empty">Lỗi tải dữ liệu kho</td></tr>';
    });
}

function vsRenderStats() {
    var sr = document.getElementById('vs-stats-row');
    if (!sr) return;
    var total = VS_BATCHES.length;
    var avail = VS_BATCHES.filter(function (b) { return b.status === 'Available' && b.quantityOnHand > 0; }).length;
    var exp7  = VS_BATCHES.filter(function (b) { return b.status === 'Available' && vsIsBatchExpiring(b); }).length;
    var expired = VS_BATCHES.filter(function (b) { return b.status === 'Expired'; }).length;
    function sc(ico, col, val, lbl) {
        return '<div class="stat-card"><div class="stat-icon ' + col + '"><i class="' + ico + '"></i></div>'
             + '<div><div class="stat-num">' + val + '</div><div class="stat-lbl">' + lbl + '</div></div></div>';
    }
    sr.innerHTML = sc('ti-layers','blue',total,'Tổng Lô') + sc('ti-check','green',avail,'Còn Hàng') + sc('ti-timer','orange',exp7,'Sắp Hết Hạn') + sc('ti-alert','red',expired,'Đã Hết Hạn');
}

function vsRenderIngSummary() {
    var t = document.getElementById('vs-ing-tbody');
    if (!t) return;
    var ingMap = {};
    VS_BATCHES.forEach(function (b) {
        if (!b.ingredient) return;
        var k = b.ingredientID;
        if (!ingMap[k]) ingMap[k] = { name: b.ingredient.ingredientName, unit: b.ingredient.ingredientUnit, qty: 0, cnt: 0, expCnt: 0 };
        if (b.status === 'Available' && b.quantityOnHand > 0) {
            ingMap[k].qty += b.quantityOnHand;
            ingMap[k].cnt++;
            if (vsIsBatchExpiring(b)) ingMap[k].expCnt++;
        }
    });
    var keys = Object.keys(ingMap);
    if (!keys.length) { t.innerHTML = '<tr><td colspan="5" class="tbl-empty">Kho trống</td></tr>'; return; }
    t.innerHTML = keys.sort(function (a, b) { return ingMap[b].qty - ingMap[a].qty; }).map(function (k) {
        var ig = ingMap[k];
        var expHtml = ig.expCnt > 0
            ? '<span class="badge badge-orange">' + ig.expCnt + ' sắp hết hạn</span>'
            : '<span style="color:var(--muted)">—</span>';
        return '<tr>'
            + '<td style="font-weight:700">' + ig.name + '</td>'
            + '<td style="color:var(--muted)">' + ig.unit + '</td>'
            + '<td style="font-weight:800;font-size:18px;color:var(--primary)">' + vsFmt(ig.qty) + '</td>'
            + '<td><span class="badge badge-green">' + ig.cnt + ' lô</span></td>'
            + '<td>' + expHtml + '</td>'
            + '</tr>';
    }).join('');
}

function vsRenderBatchTable() {
    var t = document.getElementById('vs-batch-tbody');
    var info = document.getElementById('vs-count-info');
    if (!t) return;
    var rows = VS_BATCHES.filter(function (b) {
        if (vsStatusFilter !== 'all' && vsBatchDS(b) !== vsStatusFilter) return false;
        if (vsTypeFilter !== 'all' && b.batchType !== vsTypeFilter) return false;
        if (vsWhFilter !== 'all' && String(b.warehouseID) !== String(vsWhFilter)) return false;
        if (vsIngSearch) {
            var n = (b.ingredient ? b.ingredient.ingredientName : '').toLowerCase();
            var c = (b.batchCode || '').toLowerCase();
            if (n.indexOf(vsIngSearch) < 0 && c.indexOf(vsIngSearch) < 0) return false;
        }
        return true;
    });
    if (info) info.textContent = 'Hiển thị ' + rows.length + ' / ' + VS_BATCHES.length + ' lô · Sắp xếp FIFO (Ngày Nhập ↑)';
    if (!rows.length) { t.innerHTML = '<tr><td colspan="10" class="tbl-empty">Không có lô hàng phù hợp</td></tr>'; return; }
    t.innerHTML = rows.map(function (b, i) {
        var ds = vsBatchDS(b), sCls, sTx;
        if (ds === 'Available')  { sCls = 'badge-green';  sTx = 'Còn Hàng'; }
        else if (ds === 'expiring') { sCls = 'badge-orange'; sTx = 'Sắp Hết Hạn'; }
        else if (ds === 'Expired')  { sCls = 'badge-red';    sTx = 'Hết Hạn'; }
        else if (ds === 'Depleted') { sCls = '';             sTx = 'Hết Hàng'; }
        else                        { sCls = '';             sTx = ds; }

        var typeLbl = b.batchType === 'Raw'
            ? '<span style="background:#dbeafe;color:#1d4ed8;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700">Thô</span>'
            : '<span style="background:#fdf0ea;color:#dc4d0b;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700">Sơ Chế</span>';

        var qp = b.quantityOriginal > 0 ? Math.round(b.quantityOnHand / b.quantityOriginal * 100) : 0;
        var qc = qp < 20 ? '#dc2626' : qp < 50 ? '#d97706' : '#16a34a';
        var expSt = (ds === 'Expired' || ds === 'expiring') ? 'color:#dc2626;font-weight:700' : '';
        var ingName = b.ingredient ? b.ingredient.ingredientName : '#' + b.ingredientID;
        var ingUnit = b.ingredient ? b.ingredient.ingredientUnit : '';
        var storeName = b.warehouse && b.warehouse.store ? b.warehouse.store.storeName : '';

        return '<tr>'
            + '<td style="color:#aaa;font-size:11px">' + (i + 1) + '</td>'
            + '<td style="font-weight:700;color:var(--primary);font-size:12px;font-family:monospace">' + (b.batchCode || b.batchID.toString().slice(0, 8).toUpperCase()) + '</td>'
            + '<td><div style="font-weight:600">' + ingName + '</div><div style="font-size:11px;color:var(--muted)">' + ingUnit + '</div></td>'
            + '<td>' + typeLbl + '</td>'
            + '<td style="font-size:12px"><div>Kho #' + b.warehouseID + '</div><div style="color:var(--muted)">' + storeName + '</div></td>'
            + '<td><div style="font-weight:800;font-size:15px;color:' + qc + '">' + vsFmt(b.quantityOnHand) + '</div><div style="font-size:10px;color:var(--muted)">' + qp + '% còn</div></td>'
            + '<td style="font-weight:600">' + vsFmt(b.unitCost) + ' đ</td>'
            + '<td style="font-size:12px;font-weight:600">' + (b.importDate || '').toString().slice(0, 10) + '</td>'
            + '<td style="font-size:12px;' + expSt + '">' + (b.exp || '') + '</td>'
            + '<td><span class="badge ' + sCls + '">' + sTx + '</span></td>'
            + '</tr>';
    }).join('');
}

window.vsSetFilter = function (btn, kind) {
    if (kind === 'status') {
        document.querySelectorAll('#vs-status-tabs .vs-ftab').forEach(function (x) { x.classList.remove('active'); });
        btn.classList.add('active');
        vsStatusFilter = btn.getAttribute('data-vsfilter');
    } else {
        document.querySelectorAll('#vs-type-tabs .vs-ftab').forEach(function (x) { x.classList.remove('active'); });
        btn.classList.add('active');
        vsTypeFilter = btn.getAttribute('data-vstfilter');
    }
    vsRenderBatchTable();
};

(function () {
    var whSel = document.getElementById('vs-wh-filter');
    if (whSel) whSel.addEventListener('change', function () { vsWhFilter = this.value; vsRenderBatchTable(); });
    var ingInp = document.getElementById('vs-ing-search');
    if (ingInp) ingInp.addEventListener('input', function () { vsIngSearch = this.value.toLowerCase().trim(); vsRenderBatchTable(); });
})();

// Khi user rời tab trình duyệt rồi quay lại, refresh ngay để bắt kịp bill mới
document.addEventListener('visibilitychange', function () {
    if (!document.hidden && document.getElementById('section-invoice') &&
        document.getElementById('section-invoice').classList.contains('active')) {
        loadInvoicesFromAPI(false);
    }
});

// ─────────────────────────────────────────────────────────
// Khởi tạo trang
showTab('dashboard');

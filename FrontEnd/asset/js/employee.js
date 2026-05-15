// Kiểm tra quyền
(function guard() {
    var role = localStorage.getItem('role');
    var name = localStorage.getItem('fullName');
    if (!role || role !== 'employee') {
        alert('Vui lòng đăng nhập với tài khoản nhân viên!');
        window.location.href = 'index.html';
        return;
    }
    var el = document.getElementById('header-name');
    if (el) el.textContent = name || 'Nhân viên';
})();

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

    var renders = {
        invoice:   function () { renderInvMenu(); renderInvoices(); updateInvStats(); },
        table:     renderTables,
        warehouse: renderWarehouse,
        stockmove: renderStockMove,
        delivery:  renderDelivery
    };
    if (renders[name]) renders[name]();
}

var MENU           = [];
var INVOICES       = [];
var INV_CART       = {};
var TABLES         = [];
var WAREHOUSE_LOG  = [];
var STOCK_MOVEMENTS = [];
var DELIVERIES     = [];

var TYPE_LABEL  = { takeaway: 'Mang về', 'dine-in': 'Tại quán', delivery: 'Giao hàng' };
var MOVE_LABEL  = { import: 'Nhập mới', consume: 'Chế biến', waste: 'Hao hụt', adjust: 'Điều chỉnh' };
var MOVE_BADGE  = { import: 'badge-green', consume: 'badge-orange', waste: 'badge-red', adjust: 'badge-blue' };
var TABLE_STATUS_LABEL = { Available: 'Trống', Occupied: 'Đang dùng', Reserved: 'Đã đặt', available: 'Trống', occupied: 'Đang dùng', reserved: 'Đã đặt' };
var TABLE_STATUS_CYCLE = ['Available', 'Occupied', 'Reserved'];

// Load menu từ API khi trang tải
(function loadMenu() {
    apiGet('/product/get-all').then(function (r) { return r.json(); }).then(function (data) {
        MENU = [];
        data.forEach(function (p) {
            if (p.ProductVarient && p.ProductVarient.length) {
                p.ProductVarient.forEach(function (v) {
                    MENU.push({
                        id:    v.ProductVarientID,
                        name:  p.ProductName + (v.Size ? ' (' + v.Size + ')' : ''),
                        price: v.Price
                    });
                });
            }
        });
        renderInvMenu();
    }).catch(function () {});
})();

// LẬP HÓA ĐƠN
function renderInvMenu() {
    var container = document.getElementById('inv-menu');
    if (!container) return;
    if (!MENU.length) {
        container.innerHTML = '<p style="color:var(--muted);padding:10px">Đang tải menu...</p>';
        return;
    }
    container.innerHTML = MENU.map(function (m) {
        return '<div class="inv-menu-item">'
            + '<span class="inv-item-name">' + m.name
            + ' <span class="inv-item-price">' + m.price.toLocaleString('vi-VN') + 'đ</span></span>'
            + '<div class="qty-ctrl">'
            + '<button class="qty-btn" onclick="invQty(\'' + m.id + '\',-1)">−</button>'
            + '<span class="qty-num" id="inv-qty-' + m.id + '">' + (INV_CART[m.id] || 0) + '</span>'
            + '<button class="qty-btn" onclick="invQty(\'' + m.id + '\',1)">+</button>'
            + '</div></div>';
    }).join('');
    updateInvTotal();
}

function invQty(id, delta) {
    INV_CART[id] = Math.max(0, (INV_CART[id] || 0) + delta);
    if (!INV_CART[id]) delete INV_CART[id];
    var el = document.getElementById('inv-qty-' + id);
    if (el) el.textContent = INV_CART[id] || 0;
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

function applyTicket() {
    var ticketEl = document.getElementById('inv-ticket');
    if (!ticketEl) return;
    var code = ticketEl.value.trim();
    if (!code) { toast('Vui lòng nhập mã giảm giá!', 'error'); return; }
    apiGet('/ticket/get/' + encodeURIComponent(code)).then(function (r) {
        if (!r.ok) { toast('Mã giảm giá không hợp lệ!', 'error'); return null; }
        return r.json();
    }).then(function (d) {
        if (!d) return;
        var ticket = d.data || d;
        ticketEl.dataset.ticketId = ticket.TicketID || '';
        var discountAmt = ticket.DiscountAmount || 0;
        if (!discountAmt && ticket.DiscountPercent) {
            discountAmt = Math.round(getInvSubtotal() * ticket.DiscountPercent / 100);
        }
        ticketEl.dataset.discount = discountAmt;
        updateInvTotal();
        calcChange();
        toast('Áp dụng mã giảm giá: -' + discountAmt.toLocaleString('vi-VN') + 'đ');
    }).catch(function () { toast('Lỗi kiểm tra mã giảm giá!', 'error'); });
}

function calcChange() {
    var total    = updateInvTotal();
    var received = parseInt(document.getElementById('inv-received').value) || 0;
    var change   = received >= total ? received - total : 0;
    document.getElementById('inv-change').value = change;
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
        return { ProductVarientID: id, qty: INV_CART[id] };
    });

    var tableId = null;
    if (type === 'dine-in' && tableNo) {
        var num = parseInt(tableNo.replace(/[^0-9]/g, ''));
        var tbl = TABLES.find(function (t) { return (t.TableNumber || t.num) == num; });
        if (tbl) tableId = tbl.TableID || tbl.id;
    }

    var ticketEl = document.getElementById('inv-ticket');
    var ticketId = ticketEl ? (ticketEl.dataset.ticketId || null) : null;

    var body = {
        StoreID:        storeId,
        TableID:        tableId,
        PaymentMethods: 'Cash',
        MoneyReceived:  received,
        MoneyGiveBack:  change,
        products:       products,
        EmployeeID:     employeeId
    };
    if (ticketId) body.TicketID = ticketId;

    apiPost('/bill/create-dinein', body).then(function (r) {
        if (!r.ok) return r.json().then(function (d) { throw new Error(d.message || 'Lỗi tạo hóa đơn'); });
        return r.json();
    }).then(function (d) {
        var billData = d.data || d;
        var items = Object.keys(INV_CART).map(function (id) {
            var item = MENU.find(function (m) { return m.id == id; });
            return (item ? item.name : id) + ' ×' + INV_CART[id];
        }).join(', ');

        INVOICES.unshift({
            id:       billData.BillID || ('HD-' + String(INVOICES.length + 1).padStart(3, '0')),
            customer: customer || 'Khách lẻ',
            phone:    phone,
            items:    items,
            total:    total,
            type:     type,
            table:    tableNo,
            time:     new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        });

        if (type === 'dine-in' && tableId) {
            var t = TABLES.find(function (t) { return (t.TableID || t.id) == tableId; });
            if (t) t.Status = 'Occupied';
        }

        INV_CART = {};
        ['inv-customer','inv-phone','inv-table','inv-received','inv-change'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
        });
        if (ticketEl) { ticketEl.value = ''; ticketEl.dataset.discount = 0; ticketEl.dataset.ticketId = ''; }
        renderInvMenu();
        renderInvoices();
        updateInvStats();
        toast('Xuất hóa đơn thành công!');
    }).catch(function (err) {
        toast(err.message || 'Lỗi tạo hóa đơn!', 'error');
    });
}

function renderInvoices() {
    var tbody = document.getElementById('invoice-tbody');
    if (!INVOICES.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="tbl-empty">Chưa có hóa đơn</td></tr>';
        return;
    }
    tbody.innerHTML = INVOICES.map(function (inv) {
        return '<tr>'
            + '<td><strong style="color:var(--primary)">' + inv.id + '</strong></td>'
            + '<td>' + inv.customer + '<br><small style="color:var(--muted)">' + (inv.phone || '—') + '</small></td>'
            + '<td><strong>' + inv.total.toLocaleString('vi-VN') + 'đ</strong></td>'
            + '<td><span class="badge badge-blue">' + (TYPE_LABEL[inv.type] || inv.type) + '</span></td>'
            + '<td style="color:var(--muted);font-size:12px">' + inv.time + '</td>'
            + '</tr>';
    }).join('');
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
        TABLES = Array.isArray(data) ? data : (data.data || []);
        renderTablesLocal();
    }).catch(function () {
        var grid = document.getElementById('table-grid');
        if (grid) grid.innerHTML = '<p style="color:var(--muted)">Lỗi tải danh sách bàn.</p>';
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

// NHẬP KHO
function confirmWarehouse() {
    var supplier = document.getElementById('wh-supplier').value.trim();
    var items    = document.getElementById('wh-items').value.trim();
    var receiver = document.getElementById('wh-receiver').value.trim();
    var qty      = document.getElementById('wh-qty').value;
    var unit     = document.getElementById('wh-unit').value;
    var cost     = document.getElementById('wh-cost').value;
    var mfd      = document.getElementById('wh-mfd').value;
    var exp      = document.getElementById('wh-exp').value;
    var note     = document.getElementById('wh-note').value.trim();
    var storeId  = localStorage.getItem('storeId');
    var empId    = localStorage.getItem('employeeId');

    if (!supplier || !items || !receiver) { toast('Vui lòng điền đủ thông tin bắt buộc!', 'error'); return; }

    var body = {
        StoreID:      storeId,
        EmployeeID:   empId,
        SupplierName: supplier,
        ReceiverName: receiver,
        Note:         note,
        Details: [{
            IngredientName: items,
            Quantity:       parseFloat(qty) || 0,
            Unit:           unit,
            UnitCost:       parseFloat(cost) || 0,
            MFD:            mfd || null,
            EXP:            exp || null
        }]
    };

    apiPost('/receipt/create', body).then(function (r) {
        if (!r.ok) return r.json().then(function (d) { throw new Error(d.message || 'Lỗi tạo phiếu nhập kho'); });
        return r.json();
    }).then(function (d) {
        var receiptId = (d.data && d.data.ReceiptID) || d.ReceiptID;
        if (receiptId) {
            return apiPost('/receipt/confirm', { ReceiptID: receiptId, EmployeeID: empId });
        }
    }).then(function () {
        STOCK_MOVEMENTS.unshift({
            item: items, type: 'import',
            qty: qty + ' ' + unit, note: 'Nhập từ: ' + supplier,
            time: new Date().toLocaleString('vi-VN')
        });
        ['wh-supplier','wh-items','wh-receiver','wh-qty','wh-cost','wh-mfd','wh-exp','wh-note'].forEach(function (id) {
            document.getElementById(id).value = '';
        });
        renderWarehouse();
        toast('Xác nhận nhập kho thành công!');
    }).catch(function (err) {
        toast(err.message || 'Lỗi nhập kho!', 'error');
    });
}

function renderWarehouse() {
    var storeId = localStorage.getItem('storeId');
    apiGet('/receipt/getbystore/' + storeId).then(function (r) { return r.json(); }).then(function (data) {
        WAREHOUSE_LOG = Array.isArray(data) ? data : (data.data || []);
        var tbody = document.getElementById('warehouse-tbody');
        if (!WAREHOUSE_LOG.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="tbl-empty">Chưa có dữ liệu</td></tr>';
            return;
        }
        tbody.innerHTML = WAREHOUSE_LOG.map(function (w) {
            var supplier = w.SupplierName || w.supplier || '—';
            var item     = w.IngredientName || w.items || '—';
            var qty      = w.Quantity !== undefined ? w.Quantity : (w.qty || '—');
            var unit     = w.Unit || w.unit || '';
            var cost     = w.UnitCost !== undefined ? w.UnitCost : w.cost;
            var receiver = w.ReceiverName || w.receiver || '—';
            var time     = w.CreatedAt || w.time || '';
            return '<tr>'
                + '<td><strong>' + supplier + '</strong></td>'
                + '<td>' + item + '</td>'
                + '<td>' + qty + ' ' + unit + '</td>'
                + '<td>' + (cost ? parseInt(cost).toLocaleString('vi-VN') + 'đ' : '—') + '</td>'
                + '<td>' + receiver + '</td>'
                + '<td style="color:var(--muted);font-size:12px">' + time + '</td>'
                + '</tr>';
        }).join('');
    }).catch(function () {
        var tbody = document.getElementById('warehouse-tbody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" class="tbl-empty">Lỗi tải dữ liệu.</td></tr>';
    });
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
        DELIVERIES = Array.isArray(data) ? data : (data.data || []);
        renderDeliveryLocal();
    }).catch(function () {
        renderDeliveryLocal();
    });
}

function renderDeliveryLocal() {
    var pending = DELIVERIES.filter(function (d) { return (d.status || d.Status || '').toLowerCase() === 'pending'; });
    var done    = DELIVERIES.filter(function (d) { return (d.status || d.Status || '').toLowerCase() !== 'pending'; });

    var pList = document.getElementById('delivery-pending-list');
    if (!pList) return;
    if (!pending.length) {
        pList.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px">Không có đơn hàng đang chờ giao.</p>';
    } else {
        pList.innerHTML = pending.map(function (d) {
            var id       = d.BillID || d.id;
            var customer = d.FullName || d.customer || '—';
            var address  = d.Address || d.address || '—';
            return '<div class="delivery-item">'
                + '<div class="del-info">'
                + '<div class="del-id">' + id + '</div>'
                + '<div class="del-customer">' + customer + '</div>'
                + '<div class="del-addr"><i class="ti-location-pin"></i> ' + address + '</div>'
                + '</div>'
                + '<div style="display:flex;gap:8px;align-items:center">'
                + '<input type="text" placeholder="Ghi chú..." style="padding:6px 10px;border:1px solid #e8e8e8;border-radius:6px;font-size:12px;width:160px" id="del-note-' + id + '">'
                + '<button class="btn btn-success btn-sm" onclick="confirmDelivery(\'' + id + '\')">'
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
        var id       = d.BillID || d.id;
        var customer = d.FullName || d.customer || '—';
        var address  = d.Address || d.address || '—';
        var at       = d.DeliveredAt || d.deliveredAt || '—';
        var by       = d.DeliveredBy || d.deliveredBy || '—';
        var note     = d.Note || d.note || '—';
        return '<tr>'
            + '<td><strong style="color:var(--primary)">' + id + '</strong></td>'
            + '<td>' + customer + '</td>'
            + '<td style="font-size:12px;color:var(--muted)">' + address + '</td>'
            + '<td style="font-size:12px">' + at + '</td>'
            + '<td style="font-size:12px">' + by + '</td>'
            + '<td style="font-size:12px;color:var(--muted)">' + note + '</td>'
            + '</tr>';
    }).join('');
}

function confirmDelivery(id) {
    var d      = DELIVERIES.find(function (d) { return (d.BillID || d.id) == id; });
    if (!d) return;
    var noteEl = document.getElementById('del-note-' + id);
    var note   = noteEl ? noteEl.value.trim() : '';
    var empId  = localStorage.getItem('employeeId');

    apiPut('/delivery/update/' + id, { Status: 'Delivered', Note: note, EmployeeID: empId })
        .then(function (r) {
            if (!r.ok) throw new Error();
            d.status      = 'done';
            d.Status      = 'done';
            d.DeliveredAt = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            d.DeliveredBy = localStorage.getItem('fullName') || 'Nhân viên';
            d.Note        = note;
            renderDeliveryLocal();
            toast('Đã xác nhận giao đơn ' + id);
        }).catch(function () {
            toast('Lỗi cập nhật đơn giao hàng!', 'error');
        });
}

// Khởi tạo trang
showTab('invoice');

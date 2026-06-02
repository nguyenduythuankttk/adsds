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

function renderDashboard() {
    updateDashStats();
    renderDashOrders();
    loadInvoicesFromAPI(/*silent=*/true);
}

function updateDashStats() {
    var count   = INVOICES.length;
    var revenue = INVOICES.reduce(function (s, inv) { return s + inv.total; }, 0);
    var countEl   = document.getElementById('dash-bill-count');
    var revenueEl = document.getElementById('dash-revenue');
    if (countEl)   countEl.textContent = count || '—';
    if (revenueEl) revenueEl.textContent = count ? revenue.toLocaleString('vi-VN') + 'đ' : '—';
    var lowstockEl   = document.getElementById('dash-lowstock');
    var lowstockNote = document.getElementById('dash-lowstock-note');
    if (lowstockEl)   lowstockEl.textContent = '—';
    if (lowstockNote) lowstockNote.textContent = 'Chưa có dữ liệu';
}

function renderDashOrders() {
    var body = document.getElementById('dash-orders-body');
    if (!body) return;
    if (!INVOICES.length) {
        body.innerHTML = '<p style="color:var(--muted);font-size:12px;text-align:center;padding:12px 0">Chưa có đơn hàng hôm nay.</p>';
        return;
    }
    body.innerHTML = INVOICES.slice(0, 5).map(function (inv) {
        return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f5f5f5;font-size:13px">'
            + '<strong style="color:var(--primary)">#' + inv.id + '</strong>'
            + '<span style="color:var(--muted)">' + (TYPE_LABEL[inv.type] || inv.type) + '</span>'
            + '<strong>' + inv.total.toLocaleString('vi-VN') + 'đ</strong>'
            + '</div>';
    }).join('');
}

function renderProcessing() {}
function renderRecipe()    {}
function renderViewStock() {}

function onInvTypeChange() {
    var type = (document.getElementById('inv-type') || {}).value;
    var tableGroup = document.getElementById('inv-table-group');
    if (tableGroup) tableGroup.style.display = type === 'dine-in' ? '' : 'none';
    if (type === 'dine-in') loadAvailableTickets();
}

var _phoneLookupTimer = null;
function phoneLookupDebounce(val) {
    clearTimeout(_phoneLookupTimer);
    var hint = document.getElementById('inv-phone-hint');
    if (!val || val.replace(/\D/g, '').length < 10) {
        if (hint) { hint.textContent = ''; hint.className = 'phone-hint'; }
        return;
    }
    if (hint) { hint.textContent = 'Đang tra cứu...'; hint.className = 'phone-hint'; }
    _phoneLookupTimer = setTimeout(function () {
        apiGet('/user/get-all')
            .then(function (r) { return r.ok ? r.json() : []; })
            .then(function (data) {
                var users = Array.isArray(data) ? data : (data.data || []);
                var phone = val.replace(/\D/g, '');
                var found = users.find(function (u) {
                    return (u.phone || u.Phone || '').replace(/\D/g, '') === phone;
                });
                if (found) {
                    var name = found.fullName || found.FullName || '';
                    var customerEl = document.getElementById('inv-customer');
                    if (customerEl && !customerEl.value) customerEl.value = name;
                    if (hint) { hint.textContent = '✓ ' + name; hint.className = 'phone-hint ok'; }
                } else {
                    if (hint) { hint.textContent = 'Khách mới'; hint.className = 'phone-hint muted'; }
                }
            })
            .catch(function () {
                if (hint) { hint.textContent = ''; hint.className = 'phone-hint'; }
            });
    }, 600);
}

function dashRequestLeave() {
    toast('Tính năng xin nghỉ phép đang phát triển.', 'success');
}

function dashContactManager() {
    toast('Tính năng liên hệ quản lý đang phát triển.', 'success');
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
        invoice:    function () { renderInvCatTabs(); renderInvMenu(); loadInvoicesFromAPI(); loadAvailableTables(); onInvTypeChange(); },
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
    // 15 giây/lần — đủ realtime cho UX, không tải nặng cho API
    INV_POLL_TIMER = setInterval(function () {
        if (document.hidden) return; // không poll khi tab trình duyệt ẩn
        loadInvoicesFromAPI(/*silent=*/false);
    }, 15000);
}

function stopInvoicePolling() {
    if (INV_POLL_TIMER) {
        clearInterval(INV_POLL_TIMER);
        INV_POLL_TIMER = null;
    }
}

var MENU            = [];
var MENU_RAW        = [];
var INVOICES        = [];
var INV_CART        = {};
var TABLES          = [];
var WAREHOUSE_LOG   = [];
var STOCK_MOVEMENTS = [];
var DELIVERIES      = [];
var INV_POLL_TIMER  = null;
var INV_LAST_IDS    = {};
var INV_CURRENT_CAT = 'all';
var MOCK_WAREHOUSE_LOG = [];
var MOCK_PO_LIST       = [];
var MOCK_DELIVERIES    = [];

// Trả về ngày hôm nay theo giờ Việt Nam (UTC+7) dạng YYYY-MM-DD
function todayVN() {
    return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
}

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
    var today = todayVN();
    var end7  = new Date(Date.now() + 7 * 86400000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
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
    var today = todayVN();
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
        updateDashStats();
        renderDashOrders();
    }).catch(function () { /* im lặng - lần poll tiếp theo sẽ thử lại */ });
}

function renderInvoices() {
    var tbody = document.getElementById('invoice-tbody');
    if (!tbody) return;
    if (!INVOICES.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="tbl-empty">Chưa có hóa đơn</td></tr>';
        return;
    }
    tbody.innerHTML = INVOICES.map(function (inv) {
        var typeBadge = inv.type === 'delivery' ? 'badge-orange'
                      : inv.type === 'dine-in'  ? 'badge-green'
                      : 'badge-blue';
        return '<tr>'
            + '<td><strong style="color:var(--primary)">' + inv.id + '</strong></td>'
            + '<td>' + inv.customer + '<br><small style="color:var(--muted)">' + (inv.phone || '—') + '</small></td>'
            + '<td><strong>' + inv.total.toLocaleString('vi-VN') + 'đ</strong></td>'
            + '<td><span class="badge ' + typeBadge + '">' + (TYPE_LABEL[inv.type] || inv.type) + '</span></td>'
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

function loadAvailableTables() {
    var storeId = localStorage.getItem('storeId');
    var sel = document.getElementById('inv-table');
    if (!sel) return;
    apiGet('/diningtable/get-all?storeID=' + storeId)
        .then(function (r) { return r.json(); })
        .then(function (data) {
            var tables = Array.isArray(data) ? data : (data.data || []);
            if (tables.length) TABLES = tables;
            sel.innerHTML = '<option value="">-- Chọn bàn --</option>';
            tables.filter(function (t) {
                return (t.Status || t.status || '').toLowerCase() === 'available';
            }).forEach(function (t) {
                var opt = document.createElement('option');
                opt.value = t.TableID || t.id;
                opt.textContent = 'Bàn ' + (t.TableNumber || t.TableID);
                sel.appendChild(opt);
            });
        })
        .catch(function () {
            sel.innerHTML = '<option value="">-- Không tải được bàn --</option>';
        });
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
    var end   = todayVN();
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

// Khi user rời tab trình duyệt rồi quay lại, refresh ngay để bắt kịp bill mới
document.addEventListener('visibilitychange', function () {
    if (!document.hidden && document.getElementById('section-invoice') &&
        document.getElementById('section-invoice').classList.contains('active')) {
        loadInvoicesFromAPI(/*silent=*/false);
    }
});

// Khởi tạo trang
showTab('invoice');
loadAvailableTickets();

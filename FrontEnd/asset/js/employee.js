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

// Đồng hồ header: cập nhật giờ (HH:MM:SS) và ngày mỗi giây.
(function startClock(){
    function tick(){
        var now = new Date();
        var c = document.getElementById('dash-clock');
        var d = document.getElementById('dash-date');
        if (c) c.textContent = now.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        if (d) d.textContent = now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    tick();
    setInterval(tick, 1000);
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

function renderDashboard() {
    updateDashStats();
    renderDashOrders();
    renderDashIngredientWatch();
    loadInvoicesFromAPI(/*silent=*/true);
}

function updateDashStats() {
    var count   = INVOICES.length;
    var revenue = INVOICES.reduce(function (s, inv) { return s + inv.total; }, 0);
    var countEl   = document.getElementById('dash-bill-count');
    var revenueEl = document.getElementById('dash-revenue');
    if (countEl)   countEl.textContent = count || '—';
    if (revenueEl) revenueEl.textContent = count ? revenue.toLocaleString('vi-VN') + 'đ' : '—';
    // Thẻ "Nguyên liệu theo dõi" do renderDashIngredientWatch() phụ trách —
    // không đụng vào đây để polling hóa đơn không ghi đè dữ liệu tồn kho.
}

// ── Theo dõi nguyên liệu trên dashboard ──────────────────────────────────
// Đọc báo cáo tồn kho của cửa hàng rồi liệt kê: nguyên liệu sắp/đã hết và lô
// sắp hết hạn, để nhân viên chủ động báo kho. Ngưỡng "sắp hết" theo đơn vị.
var DASH_LOW_THRESHOLD = { Unit: 10, Gram: 500, Milliliter: 500, Kilogram: 2, Liter: 2 };
function dashLowThreshold(unit) {
    return DASH_LOW_THRESHOLD[unit] != null ? DASH_LOW_THRESHOLD[unit] : 5;
}

function dashWatchRow(name, badge) {
    return '<div class="dash-watch-row"><span class="dash-watch-name">' + name + '</span>' + badge + '</div>';
}

function renderDashIngredientWatch() {
    var storeId = localStorage.getItem('storeId');
    var lowEl   = document.getElementById('dash-lowstock');
    var noteEl  = document.getElementById('dash-lowstock-note');
    var outBox  = document.getElementById('dash-watch-low');
    var expBox  = document.getElementById('dash-watch-exp');
    if (lowEl)  lowEl.textContent  = '…';
    if (noteEl) noteEl.textContent = 'Đang kiểm tra...';
    if (outBox) outBox.innerHTML = '<p class="dash-watch-empty">Đang tải...</p>';
    if (expBox) expBox.innerHTML = '<p class="dash-watch-empty">Đang tải...</p>';

    if (!storeId) {
        if (lowEl)  lowEl.textContent  = '—';
        if (noteEl) noteEl.textContent = 'Chưa có cửa hàng';
        return;
    }

    apiGet('/inventorybatch/store-report/' + storeId)
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (rep) {
            if (!rep) throw new Error('no data');
            var ings = pAsArray(rep.ingredients || rep.Ingredients);

            var outList = [], lowList = [], expList = [];
            ings.forEach(function (g) {
                var name = g.ingredientName || g.IngredientName || ('#' + (g.ingredientID || g.IngredientID));
                var unit = g.ingredientUnit || g.IngredientUnit || '';
                var qty  = Number(g.totalOnHand   != null ? g.totalOnHand   : g.TotalOnHand)   || 0;
                var exp  = Number(g.expiringCount != null ? g.expiringCount : g.ExpiringCount) || 0;
                if (qty <= 0)                            outList.push({ name: name, unit: unit, qty: qty });
                else if (qty <= dashLowThreshold(unit))  lowList.push({ name: name, unit: unit, qty: qty });
                if (exp > 0)                             expList.push({ name: name, unit: unit, count: exp });
            });
            lowList.sort(function (a, b) { return a.qty - b.qty; });
            expList.sort(function (a, b) { return b.count - a.count; });

            var shortage  = outList.length + lowList.length;
            var attention = shortage + expList.length;
            if (lowEl)  lowEl.textContent = attention ? String(attention) : '0';
            if (noteEl) noteEl.textContent = attention
                ? (shortage + ' sắp/hết · ' + expList.length + ' sắp hết hạn')
                : 'Tồn kho ổn định';

            if (outBox) {
                var rows = outList.map(function (x) {
                    return dashWatchRow(x.name, '<span class="badge badge-red">Đã hết</span>');
                }).concat(lowList.map(function (x) {
                    return dashWatchRow(x.name, '<span class="badge badge-orange">Còn ' + pNum(x.qty) + ' ' + x.unit + '</span>');
                }));
                outBox.innerHTML = rows.length ? rows.join('')
                    : '<p class="dash-watch-empty">Không có nguyên liệu sắp/đã hết 👍</p>';
            }
            if (expBox) {
                var erows = expList.map(function (x) {
                    return dashWatchRow(x.name, '<span class="badge badge-yellow">' + x.count + ' lô ≤ 7 ngày</span>');
                });
                expBox.innerHTML = erows.length ? erows.join('')
                    : '<p class="dash-watch-empty">Không có lô sắp hết hạn 👍</p>';
            }
        })
        .catch(function () {
            if (lowEl)  lowEl.textContent  = '—';
            if (noteEl) noteEl.textContent = 'Lỗi tải dữ liệu';
            if (outBox) outBox.innerHTML = '<p class="dash-watch-empty">Lỗi tải dữ liệu</p>';
            if (expBox) expBox.innerHTML = '<p class="dash-watch-empty">Lỗi tải dữ liệu</p>';
        });
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

// ════════════════════════════════════════════════════════════
// Helpers dùng chung cho 3 section dưới
// ════════════════════════════════════════════════════════════
function pNum(n)  { return Number(n || 0).toLocaleString('vi-VN'); }
function pDateTime(s) {
    if (!s) return '—';
    return fmtVnDateTime(s) || s;
}
function pAsArray(d) { return Array.isArray(d) ? d : (d && d.data ? d.data : []); }

// ════════════════════════════════════════════════════════════
// SƠ CHẾ (Processing)
// ════════════════════════════════════════════════════════════
var PROC_WAREHOUSES  = [];
var PROC_RAW_BATCHES = [];
var PROC_INGREDIENTS = [];
var PROC_ROW_SEQ     = 0;

function renderProcessing() {
    var box = document.getElementById('proc-items');
    if (box) box.innerHTML = '';
    apiGet('/ingredient/get-all')
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (d) { PROC_INGREDIENTS = pAsArray(d); })
        .catch(function () { PROC_INGREDIENTS = []; });
    loadProcWarehouses();
    loadProcessingHistory();
}

function loadProcWarehouses() {
    var storeId = localStorage.getItem('storeId');
    var sel = document.getElementById('proc-warehouse');
    apiGet('/warehouse/get-by-store/' + storeId)
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (d) {
            PROC_WAREHOUSES = pAsArray(d);
            if (sel) {
                sel.innerHTML = PROC_WAREHOUSES.length
                    ? PROC_WAREHOUSES.map(function (w) {
                        return '<option value="' + w.warehouseID + '">Kho #' + w.warehouseID + ' (sức chứa ' + w.capacity + ')</option>';
                      }).join('')
                    : '<option value="">-- Không có kho --</option>';
            }
            loadRawBatches();
        })
        .catch(function () { if (sel) sel.innerHTML = '<option value="">-- Lỗi tải kho --</option>'; });
}

function loadRawBatches() {
    var tb = document.getElementById('proc-raw-tbody');
    if (tb) tb.innerHTML = '<tr><td colspan="5" class="tbl-empty">Đang tải...</td></tr>';
    apiGet('/inventorybatch/available-raw')
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (d) {
            var all   = pAsArray(d);
            var whIds = PROC_WAREHOUSES.map(function (w) { return w.warehouseID; });
            PROC_RAW_BATCHES = all.filter(function (b) {
                var wh = b.warehouseID || (b.warehouse && b.warehouse.warehouseID);
                return whIds.length ? whIds.indexOf(wh) >= 0 : true;
            });
            if (!tb) return;
            if (!PROC_RAW_BATCHES.length) {
                tb.innerHTML = '<tr><td colspan="5" class="tbl-empty">Không có batch thô</td></tr>';
                return;
            }
            tb.innerHTML = PROC_RAW_BATCHES.map(function (b) {
                var ing = b.ingredient || {};
                return '<tr>'
                    + '<td><strong style="color:var(--primary)">' + (b.batchCode || String(b.batchID).slice(0, 8)) + '</strong></td>'
                    + '<td>' + (ing.ingredientName || ('#' + b.ingredientID)) + '</td>'
                    + '<td><strong>' + pNum(b.quantityOnHand) + '</strong> ' + (ing.ingredientUnit || '') + '</td>'
                    + '<td>' + pNum(b.unitCost) + 'đ</td>'
                    + '<td>' + (b.exp || '—') + '</td>'
                    + '</tr>';
            }).join('');
        })
        .catch(function () { if (tb) tb.innerHTML = '<tr><td colspan="5" class="tbl-empty">Lỗi tải dữ liệu</td></tr>'; });
}

function loadProcessingHistory() {
    var tb = document.getElementById('proc-history-tbody');
    if (tb) tb.innerHTML = '<tr><td colspan="4" class="tbl-empty">Đang tải...</td></tr>';
    apiGet('/processing/get-all/2020-01-01/' + todayVN())
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (d) {
            var list    = pAsArray(d);
            var storeId = String(localStorage.getItem('storeId'));
            list = list.filter(function (p) {
                var sid = p.employee && p.employee.storeID;
                return (sid === undefined || sid === null) ? true : String(sid) === storeId;
            });
            list.sort(function (a, b) { return new Date(b.processedAt) - new Date(a.processedAt); });
            if (!tb) return;
            if (!list.length) {
                tb.innerHTML = '<tr><td colspan="4" class="tbl-empty">Chưa có dữ liệu</td></tr>';
                return;
            }
            tb.innerHTML = list.map(function (p) {
                return '<tr>'
                    + '<td><strong style="color:var(--primary)">' + String(p.processingID).slice(0, 8) + '...</strong></td>'
                    + '<td>' + ((p.employee && p.employee.fullName) || '—') + '</td>'
                    + '<td>' + pDateTime(p.processedAt) + '</td>'
                    + '<td>' + (p.note || '—') + '</td>'
                    + '</tr>';
            }).join('');
        })
        .catch(function () { if (tb) tb.innerHTML = '<tr><td colspan="4" class="tbl-empty">Lỗi tải dữ liệu</td></tr>'; });
}

function addProcessingRow() {
    var box = document.getElementById('proc-items');
    if (!box) return;
    if (!PROC_RAW_BATCHES.length) { toast('Chưa có batch thô để sơ chế', 'error'); return; }
    // Output chỉ được là nguyên liệu đơn vị "Unit" (thành phẩm sau sơ chế)
    var unitIngs = PROC_INGREDIENTS.filter(function (i) { return (i.ingredientUnit || i.IngredientUnit) === 'Unit'; });
    if (!unitIngs.length) {
        toast('Chưa có nguyên liệu thành phẩm (đơn vị Unit). Cần seed nguyên liệu sơ chế trước.', 'error');
        return;
    }
    var id = ++PROC_ROW_SEQ;
    var rawOpts = PROC_RAW_BATCHES.map(function (b) {
        var ing = b.ingredient || {};
        return '<option value="' + b.batchID + '">' + (b.batchCode || String(b.batchID).slice(0, 8))
            + ' — ' + (ing.ingredientName || '') + ' (còn ' + pNum(b.quantityOnHand) + (ing.ingredientUnit || '') + ')</option>';
    }).join('');
    var ingOpts = unitIngs.map(function (i) {
        return '<option value="' + i.ingredientID + '">' + i.ingredientName + ' (' + i.ingredientUnit + ')</option>';
    }).join('');
    var today = todayVN();
    var row = document.createElement('div');
    row.className = 'proc-row';
    row.id = 'proc-row-' + id;
    row.style.cssText = 'border:1px solid #eee;border-radius:8px;padding:12px;margin-bottom:10px;background:#fafafa';
    row.innerHTML =
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
        +   '<strong style="font-size:12px;color:var(--primary)">Dòng #' + id + '</strong>'
        +   '<button class="btn btn-sm" style="color:var(--red)" onclick="removeProcessingRow(' + id + ')"><i class="ti-trash"></i></button>'
        + '</div>'
        + '<div class="form-row-2">'
        +   '<div class="form-group"><label>Batch thô nguồn *</label><select class="pr-src">' + rawOpts + '</select></div>'
        +   '<div class="form-group"><label>Lượng lấy (theo đơn vị batch) *</label><input type="number" class="pr-inputkg" step="0.001" min="0.001" placeholder="VD: 500"></div>'
        + '</div>'
        + '<div class="form-row-2">'
        +   '<div class="form-group"><label>Nguyên liệu thành phẩm *</label><select class="pr-outing">' + ingOpts + '</select></div>'
        +   '<div class="form-group"><label>Số thành phẩm (miếng/phần) *</label><input type="number" class="pr-pieces" step="1" min="1" placeholder="VD: 5"></div>'
        + '</div>'
        + '<div class="form-row-2">'
        +   '<div class="form-group"><label>Số túi</label><input type="number" class="pr-bag" step="1" min="0" value="0"></div>'
        +   '<div class="form-group"><label>Miếng/túi</label><input type="number" class="pr-ppb" step="1" min="0" value="0"></div>'
        + '</div>'
        + '<div class="form-row-2">'
        +   '<div class="form-group"><label>NSX *</label><input type="date" class="pr-mfd" value="' + today + '"></div>'
        +   '<div class="form-group"><label>HSD *</label><input type="date" class="pr-exp"></div>'
        + '</div>'
        + '<div class="form-group"><label>Ghi chú hao hụt</label><input type="text" class="pr-waste" placeholder="VD: Xương vụn ~0.1kg"></div>';
    box.appendChild(row);
}

function removeProcessingRow(id) {
    var el = document.getElementById('proc-row-' + id);
    if (el) el.remove();
}

function submitProcessing() {
    var whSel = document.getElementById('proc-warehouse');
    var warehouseID = parseInt(whSel && whSel.value, 10);
    if (!warehouseID) { toast('Vui lòng chọn kho', 'error'); return; }
    var rows = document.querySelectorAll('#proc-items .proc-row');
    if (!rows.length) { toast('Thêm ít nhất 1 dòng nguyên liệu sơ chế', 'error'); return; }

    var items = [];
    var valid = true;
    Array.prototype.forEach.call(rows, function (row) {
        var g = function (sel) { var e = row.querySelector(sel); return e ? e.value : ''; };
        var src = g('.pr-src'), inputKg = parseFloat(g('.pr-inputkg')), outIng = parseInt(g('.pr-outing'), 10),
            pieces = parseInt(g('.pr-pieces'), 10), bag = parseInt(g('.pr-bag'), 10) || 0,
            ppb = parseInt(g('.pr-ppb'), 10) || 0, mfd = g('.pr-mfd'), exp = g('.pr-exp'), waste = g('.pr-waste');
        if (!src || !inputKg || !outIng || !pieces || !mfd || !exp) { valid = false; return; }
        items.push({
            SourceBatchID: src, InputKg: inputKg, OutputIngredientID: outIng, OutputPieces: pieces,
            BagCount: bag, PiecesPerBag: ppb, Mfd: mfd, Exp: exp, WasteNote: waste || null
        });
    });
    if (!valid) { toast('Điền đầy đủ các trường có dấu *', 'error'); return; }

    var body = {
        EmployeeID:  localStorage.getItem('employeeId'),
        WarehouseID: warehouseID,
        Note:        (document.getElementById('proc-note') || {}).value || null,
        Items:       items
    };
    apiPost('/processing/create', body)
        .then(function (r) {
            if (!r.ok) return r.text().then(function (t) { throw new Error(t || ('HTTP ' + r.status)); });
            return r.json();
        })
        .then(function () {
            toast('Tạo phiếu sơ chế thành công!', 'success');
            document.getElementById('proc-items').innerHTML = '';
            var n = document.getElementById('proc-note'); if (n) n.value = '';
            loadRawBatches();
            loadProcessingHistory();
        })
        .catch(function (e) { toast('Lỗi tạo phiếu: ' + (e.message || ''), 'error'); });
}

// ════════════════════════════════════════════════════════════
// CÔNG THỨC (Recipe)
// ════════════════════════════════════════════════════════════
var RECIPE_INGREDIENTS = [];
var RECIPE_ROW_SEQ = 0;

function renderRecipe() {
    // Dropdown sản phẩm (ProductVarient)
    var pSel = document.getElementById('recipe-product');
    apiGet('/product/get-all').then(function (r) { return r.ok ? r.json() : []; }).then(function (d) {
        var prods = pAsArray(d);
        var opts = ['<option value="">-- Chọn sản phẩm --</option>'];
        prods.forEach(function (p) {
            (p.productVarient || p.ProductVarient || []).forEach(function (v) {
                if (!v) return;
                opts.push('<option value="' + v.productVarientID + '">' + p.productName + ' - ' + v.size + '</option>');
            });
        });
        if (pSel) pSel.innerHTML = opts.join('');
    }).catch(function () { if (pSel) pSel.innerHTML = '<option value="">-- Lỗi tải --</option>'; });

    // Tải danh sách nguyên liệu và lưu vào global
    var container = document.getElementById('recipe-ingredients-container');
    if (container) container.innerHTML = '';
    
    apiGet('/ingredient/get-all').then(function (r) { return r.ok ? r.json() : []; }).then(function (d) {
        RECIPE_INGREDIENTS = pAsArray(d);
        addRecipeIngredientRow(); // Thêm sẵn 1 dòng mặc định
    }).catch(function () {
        RECIPE_INGREDIENTS = [];
        toast('Lỗi tải danh sách nguyên liệu', 'error');
    });

    loadRecipes();
}

function addRecipeIngredientRow() {
    var container = document.getElementById('recipe-ingredients-container');
    if (!container) return;
    var id = ++RECIPE_ROW_SEQ;
    
    var ingOpts = '<option value="">-- Chọn nguyên liệu --</option>' + RECIPE_INGREDIENTS.map(function (i) {
        return '<option value="' + i.ingredientID + '">' + i.ingredientName + ' (' + i.ingredientUnit + ')' + '</option>';
    }).join('');
    
    var row = document.createElement('div');
    row.className = 'recipe-ing-row';
    row.id = 'recipe-ing-row-' + id;
    row.style.cssText = 'border:1px solid #eee;border-radius:8px;padding:12px;margin-bottom:10px;background:#fafafa';
    row.innerHTML = 
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
        '  <strong style="font-size:12px;color:var(--primary)">Dòng #' + id + '</strong>' +
        '  <button class="btn btn-sm" style="color:var(--red);padding:2px 8px;background:none;border:none;cursor:pointer" onclick="removeRecipeIngredientRow(' + id + ')"><i class="ti-trash"></i></button>' +
        '</div>' +
        '<div class="form-row-2">' +
        '  <div class="form-group"><label>Nguyên liệu *</label><select class="rec-ing-sel">' + ingOpts + '</select></div>' +
        '  <div class="form-group"><label>QtyAfterProcess *</label><input type="number" class="rec-qty-after" step="0.001" min="0.001" placeholder="1"></div>' +
        '</div>' +
        '<div class="form-row-2" style="margin-top:8px">' +
        '  <div class="form-group"><label>BatchSize</label><input type="number" class="rec-batch-size" step="0.001" min="0.001" value="1"></div>' +
        '  <div class="form-group">' +
        '    <label style="visibility:hidden">&nbsp;</label>' +
        '    <div style="display:flex;align-items:center;height:38px">' +
        '      <label style="display:flex;align-items:center;gap:6px;text-transform:none;cursor:pointer;font-weight:600;font-size:12px;margin:0">' +
        '        <input type="checkbox" class="rec-consumable" style="width:16px;height:16px;cursor:pointer;accent-color:var(--primary)">' +
        '        Tiêu hao (IsConsumable)' +
        '      </label>' +
        '    </div>' +
        '  </div>' +
        '</div>';
    container.appendChild(row);
}

function removeRecipeIngredientRow(id) {
    var el = document.getElementById('recipe-ing-row-' + id);
    if (el) el.remove();
}

function submitBulkRecipe() {
    var pv = parseInt((document.getElementById('recipe-product') || {}).value, 10);
    if (!pv) { toast('Vui lòng chọn sản phẩm', 'error'); return; }
    
    var rows = document.querySelectorAll('#recipe-ingredients-container .recipe-ing-row');
    if (!rows.length) { toast('Vui lòng thêm ít nhất 1 nguyên liệu', 'error'); return; }
    
    var items = [];
    var valid = true;
    
    Array.prototype.forEach.call(rows, function (row) {
        var ingId = parseInt(row.querySelector('.rec-ing-sel').value, 10);
        var qtyAfter = parseFloat(row.querySelector('.rec-qty-after').value);
        var batchSize = parseFloat(row.querySelector('.rec-batch-size').value) || 1;
        var isConsumable = row.querySelector('.rec-consumable').checked;
        
        if (!ingId || isNaN(qtyAfter) || qtyAfter <= 0) {
            valid = false;
            return;
        }
        
        items.push({
            IngredientID: ingId,
            QtyBeforeProcess: 0,
            QtyAfterProcess: qtyAfter,
            BatchSize: batchSize,
            IsConsumable: isConsumable
        });
    });
    
    if (!valid) {
        toast('Vui lòng nhập đầy đủ và hợp lệ các trường có dấu *', 'error');
        return;
    }
    
    var body = {
        ProductVarientID: pv,
        Items: items
    };
    
    apiPost('/recipe/add-bulk', body)
        .then(function (r) {
            if (!r.ok) return r.text().then(function (t) { throw new Error(t || ('HTTP ' + r.status)); });
            return r.text();
        })
        .then(function () {
            toast('Lưu công thức thành công!', 'success');
            var container = document.getElementById('recipe-ingredients-container');
            if (container) container.innerHTML = '';
            addRecipeIngredientRow(); // Add one default row back
            loadRecipes();
        })
        .catch(function (e) {
            toast('Lỗi lưu công thức: ' + (e.message || ''), 'error');
        });
}

function loadRecipes() {
    var tb = document.getElementById('recipe-tbody');
    if (tb) tb.innerHTML = '<tr><td colspan="3" class="tbl-empty">Đang tải...</td></tr>';
    apiGet('/recipe/get-all').then(function (r) { return r.ok ? r.json() : []; }).then(function (d) {
        var list = pAsArray(d);
        if (!tb) return;
        if (!list.length) { tb.innerHTML = '<tr><td colspan="3" class="tbl-empty">Chưa có công thức</td></tr>'; return; }
        
        // Group by productVarientID
        var grouped = {};
        list.forEach(function (rc) {
            var pvId = rc.productVarientID;
            if (!grouped[pvId]) {
                grouped[pvId] = {
                    productVarientID: pvId,
                    name: '',
                    items: []
                };
            }
            grouped[pvId].items.push(rc);
        });
        
        var html = '';
        Object.keys(grouped).forEach(function (pvId) {
            var group = grouped[pvId];
            var firstItem = group.items[0];
            var pv = firstItem.productVarient || {};
            var prod = pv.product || {};
            var pName = (prod.productName ? prod.productName + ' - ' + (pv.size || '') : ('PV#' + pvId));
            group.name = pName;
            
            var subRowsHtml = group.items.map(function (rc) {
                var ing = rc.ingredient || {};
                var consumable = rc.isConsumable || rc.IsConsumable;
                var batchSize = rc.batchSize !== undefined ? rc.batchSize : (rc.BatchSize !== undefined ? rc.BatchSize : 1);
                return '<tr>'
                    + '<td style="font-weight:600">' + (ing.ingredientName || ('#' + rc.ingredientID)) + '</td>'
                    + '<td><strong>' + pNum(rc.qtyAfterProcess) + '</strong> ' + (ing.ingredientUnit || '') + '</td>'
                    + '<td>' + pNum(batchSize) + '</td>'
                    + '<td>' + (consumable ? '<span class="badge badge-pending" style="background:#fef3c7;color:#d97706">Tiêu hao</span>' : '<span class="badge badge-active" style="background:#d1fae5;color:#065f46">Định lượng</span>') + '</td>'
                    + '<td><button class="btn btn-sm" style="color:var(--red);background:none;border:none;cursor:pointer;padding:2px 8px" onclick="event.stopPropagation(); deleteRecipe(' + rc.ingredientID + ',' + rc.productVarientID + ')"><i class="ti-trash"></i></button></td>'
                    + '</tr>';
            }).join('');
            
            html += '<tr class="recipe-group-row" onclick="toggleRecipeDetail(this)" style="cursor:pointer">'
                + '  <td style="font-weight:600;display:flex;align-items:center;gap:10px">'
                + '    <span class="toggle-icon"><i class="ti-angle-right"></i></span> '
                + '    ' + pName
                + '  </td>'
                + '  <td>' + group.items.length + ' nguyên liệu</td>'
                + '  <td></td>'
                + '</tr>'
                + '<tr class="recipe-detail-row" style="display:none;background:#fcfcfc">'
                + '  <td colspan="3" style="padding:10px 20px">'
                + '    <div style="border:1px solid #eee;border-radius:8px;background:#fff;overflow:hidden">'
                + '      <table class="sub-table" style="width:100%;border-collapse:collapse;font-size:12px">'
                + '        <thead>'
                + '          <tr style="background:#fafafa;border-bottom:1px solid #eee">'
                + '            <th style="padding:8px 12px;text-align:left;color:#666">Nguyên liệu</th>'
                + '            <th style="padding:8px 12px;text-align:left;color:#666">Qty/Đơn</th>'
                + '            <th style="padding:8px 12px;text-align:left;color:#666">BatchSize</th>'
                + '            <th style="padding:8px 12px;text-align:left;color:#666">Loại</th>'
                + '            <th style="padding:8px 12px;width:50px"></th>'
                + '          </tr>'
                + '        </thead>'
                + '        <tbody>' + subRowsHtml + '</tbody>'
                + '      </table>'
                + '    </div>'
                + '  </td>'
                + '</tr>';
        });
        
        tb.innerHTML = html;
    }).catch(function () { if (tb) tb.innerHTML = '<tr><td colspan="3" class="tbl-empty">Lỗi tải dữ liệu</td></tr>'; });
}

function toggleRecipeDetail(row) {
    row.classList.toggle('expanded');
    var nextRow = row.nextElementSibling;
    if (nextRow && nextRow.classList.contains('recipe-detail-row')) {
        if (nextRow.style.display === 'none') {
            nextRow.style.display = '';
        } else {
            nextRow.style.display = 'none';
        }
    }
}

function deleteRecipe(ingredientID, productVarientID) {
    if (!confirm('Xoá nguyên liệu này khỏi công thức?')) return;
    apiDelete('/recipe/Delete/' + ingredientID + '/' + productVarientID)
        .then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            toast('Đã xoá nguyên liệu khỏi công thức', 'success');
            loadRecipes();
        })
        .catch(function (e) { toast('Lỗi xoá: ' + (e.message || ''), 'error'); });
}

// ════════════════════════════════════════════════════════════
// XEM TỒN KHO (View Stock — read-only)
// ════════════════════════════════════════════════════════════
var VS_BATCHES = [];
var VS_STATUS  = 'all';
var VS_TYPE    = 'all';
var VS_WH      = 'all';
var VS_SEARCH  = '';

function renderViewStock() {
    var storeId = localStorage.getItem('storeId');
    var ingTb   = document.getElementById('vs-ing-tbody');
    var batchTb = document.getElementById('vs-batch-tbody');
    if (ingTb)   ingTb.innerHTML   = '<tr><td colspan="5" class="tbl-empty">Đang tải...</td></tr>';
    if (batchTb) batchTb.innerHTML = '<tr><td colspan="10" class="tbl-empty">Đang tải...</td></tr>';

    apiGet('/warehouse/get-by-store/' + storeId)
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (d) {
            var whs = pAsArray(d);
            // nạp filter kho
            var whFilter = document.getElementById('vs-wh-filter');
            if (whFilter) {
                whFilter.innerHTML = '<option value="all">Tất cả kho</option>'
                    + whs.map(function (w) { return '<option value="' + w.warehouseID + '">Kho #' + w.warehouseID + '</option>'; }).join('');
                whFilter.onchange = function () { VS_WH = this.value; vsRender(); };
            }
            var searchEl = document.getElementById('vs-ing-search');
            if (searchEl) searchEl.oninput = function () { VS_SEARCH = (this.value || '').toLowerCase(); vsRender(); };

            // tải batch của tất cả kho thuộc store
            return Promise.all(whs.map(function (w) {
                return apiGet('/inventorybatch/by-warehouse/' + w.warehouseID)
                    .then(function (r) { return r.ok ? r.json() : []; })
                    .then(function (bd) { return pAsArray(bd); })
                    .catch(function () { return []; });
            }));
        })
        .then(function (perWh) {
            VS_BATCHES = (perWh || []).reduce(function (acc, arr) { return acc.concat(arr); }, []);
            vsRender();
        })
        .catch(function () {
            if (ingTb)   ingTb.innerHTML   = '<tr><td colspan="5" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';
            if (batchTb) batchTb.innerHTML = '<tr><td colspan="10" class="tbl-empty">Lỗi tải dữ liệu</td></tr>';
        });
}

function vsSetFilter(btn, kind) {
    var group = btn.parentElement;
    if (group) Array.prototype.forEach.call(group.querySelectorAll('.vs-ftab'), function (b) { b.classList.remove('active'); });
    btn.classList.add('active');
    if (kind === 'status') VS_STATUS = btn.getAttribute('data-vsfilter');
    else                   VS_TYPE   = btn.getAttribute('data-vstfilter');
    vsRender();
}

function vsBatchExpiring(b) {
    if (!b.exp) return false;
    var days = (new Date(b.exp) - new Date()) / 86400000;
    return days >= 0 && days <= 7;
}

function vsRender() {
    var now = new Date();
    var filtered = VS_BATCHES.filter(function (b) {
        if (VS_WH !== 'all' && String(b.warehouseID) !== String(VS_WH)) return false;
        if (VS_TYPE !== 'all' && (b.batchType || b.BatchType) !== VS_TYPE) return false;
        if (VS_STATUS !== 'all') {
            if (VS_STATUS === 'expiring') { if (!vsBatchExpiring(b)) return false; }
            else if (VS_STATUS === 'Depleted') { if (!((b.status === 'Depleted') || (b.quantityOnHand <= 0))) return false; }
            else if ((b.status || '') !== VS_STATUS) return false;
        }
        if (VS_SEARCH) {
            var ing = (b.ingredient && b.ingredient.ingredientName || '').toLowerCase();
            var code = (b.batchCode || '').toLowerCase();
            if (ing.indexOf(VS_SEARCH) < 0 && code.indexOf(VS_SEARCH) < 0) return false;
        }
        return true;
    });

    // ── Stats ──
    var statsRow = document.getElementById('vs-stats-row');
    if (statsRow) {
        var totalBatches = VS_BATCHES.length;
        var rawCount = VS_BATCHES.filter(function (b) { return (b.batchType || b.BatchType) === 'Raw'; }).length;
        var procCount = VS_BATCHES.filter(function (b) { return (b.batchType || b.BatchType) === 'Processed'; }).length;
        var expCount = VS_BATCHES.filter(vsBatchExpiring).length;
        statsRow.innerHTML =
            vsStat('📦', totalBatches, 'Tổng lô') + vsStat('🌾', rawCount, 'Lô thô')
          + vsStat('🍗', procCount, 'Lô đã sơ chế') + vsStat('⏰', expCount, 'Sắp hết hạn (7N)');
    }

    // ── Tồn theo nguyên liệu ──
    var ingTb = document.getElementById('vs-ing-tbody');
    if (ingTb) {
        var byIng = {};
        VS_BATCHES.forEach(function (b) {
            var ing = b.ingredient || {};
            var key = b.ingredientID;
            if (!byIng[key]) byIng[key] = { name: ing.ingredientName || ('#' + key), unit: ing.ingredientUnit || '', total: 0, avail: 0, exp: 0 };
            byIng[key].total += Number(b.quantityOnHand || 0);
            if ((b.status || '') === 'Available') byIng[key].avail++;
            if (vsBatchExpiring(b)) byIng[key].exp++;
        });
        var ingRows = Object.keys(byIng).map(function (k) {
            var x = byIng[k];
            return '<tr><td style="font-weight:600">' + x.name + '</td><td>' + x.unit + '</td>'
                + '<td><strong>' + pNum(x.total) + '</strong></td><td>' + x.avail + '</td>'
                + '<td>' + (x.exp ? '<span class="badge badge-pending">' + x.exp + '</span>' : '0') + '</td></tr>';
        });
        ingTb.innerHTML = ingRows.length ? ingRows.join('') : '<tr><td colspan="5" class="tbl-empty">Không có dữ liệu</td></tr>';
    }

    // ── Danh sách lô (FIFO: nhập trước lên đầu) ──
    var batchTb = document.getElementById('vs-batch-tbody');
    if (batchTb) {
        filtered.sort(function (a, b) { return new Date(a.importDate) - new Date(b.importDate); });
        batchTb.innerHTML = filtered.length ? filtered.map(function (b, i) {
            var ing = b.ingredient || {};
            var type = (b.batchType || b.BatchType) === 'Raw' ? 'Thô' : 'Đã sơ chế';
            var stBadge = vsBatchExpiring(b) ? '<span class="badge badge-pending">Sắp hết hạn</span>'
                : (b.status === 'Available' ? '<span class="badge badge-active">Còn hàng</span>'
                : '<span class="badge">' + (b.status || '—') + '</span>');
            return '<tr>'
                + '<td>' + (i + 1) + '</td>'
                + '<td><strong style="color:var(--primary)">' + (b.batchCode || String(b.batchID).slice(0, 8)) + '</strong></td>'
                + '<td>' + (ing.ingredientName || ('#' + b.ingredientID)) + '</td>'
                + '<td>' + type + '</td>'
                + '<td>Kho #' + b.warehouseID + '</td>'
                + '<td><strong>' + pNum(b.quantityOnHand) + '</strong> ' + (ing.ingredientUnit || '') + '</td>'
                + '<td>' + pNum(b.unitCost) + 'đ</td>'
                + '<td>' + (b.importDate ? String(b.importDate).slice(0, 10) : '—') + '</td>'
                + '<td>' + (b.exp || '—') + '</td>'
                + '<td>' + stBadge + '</td>'
                + '</tr>';
        }).join('') : '<tr><td colspan="10" class="tbl-empty">Không có lô nào khớp bộ lọc</td></tr>';
    }

    var info = document.getElementById('vs-count-info');
    if (info) info.textContent = 'Hiển thị ' + filtered.length + ' / ' + VS_BATCHES.length + ' lô';
}

function vsStat(icon, val, label) {
    return '<div class="stat-card"><div class="stat-icon" style="font-size:20px">' + icon + '</div>'
        + '<div class="stat-info"><div class="num">' + val + '</div><div class="lbl">' + label + '</div></div></div>';
}

function onInvTypeChange() {
    var type = (document.getElementById('inv-type') || {}).value;
    var tableGroup = document.getElementById('inv-table-group');
    if (tableGroup) tableGroup.style.display = type === 'dine-in' ? '' : 'none';
    if (type === 'dine-in') loadAvailableTickets();
}

// UserID của khách đã khớp tài khoản (theo tên + SĐT). Dùng để nạp kho voucher của khách.
var _matchedUserId = null;
var _customerLookupTimer = null;

// Chuẩn hóa tên để so khớp: bỏ khoảng trắng thừa + không phân biệt hoa/thường.
function normalizeName(s) {
    return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function customerLookupDebounce() {
    clearTimeout(_customerLookupTimer);
    _customerLookupTimer = setTimeout(customerLookup, 600);
}

// Tra cứu tài khoản khách theo tên + SĐT đã nhập. Nếu tìm được, nạp kho voucher
// của khách đó vào dropdown "Mã giảm giá"; nếu không, reset về "không dùng mã".
function customerLookup() {
    var phoneEl = document.getElementById('inv-phone');
    var nameEl  = document.getElementById('inv-customer');
    var hint    = document.getElementById('inv-phone-hint');
    var phone   = (phoneEl ? phoneEl.value : '').replace(/\D/g, '');
    var nameInput = nameEl ? nameEl.value.trim() : '';

    // Cần tối thiểu 1 SĐT hợp lệ để tra cứu
    if (phone.length < 10) {
        if (hint) { hint.textContent = ''; hint.className = 'phone-hint'; }
        _matchedUserId = null;
        resetVoucherSelect();
        return;
    }
    if (hint) { hint.textContent = 'Đang tra cứu...'; hint.className = 'phone-hint'; }
    apiGet('/user/get-all')
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (data) {
            var users = Array.isArray(data) ? data : (data.data || []);
            var found = users.find(function (u) {
                var uPhone = (u.phone || u.Phone || '').replace(/\D/g, '');
                if (uPhone !== phone) return false;
                // NV đã gõ tên → yêu cầu khớp cả tên; chưa gõ thì chỉ cần SĐT.
                if (nameInput) {
                    return normalizeName(u.fullName || u.FullName) === normalizeName(nameInput);
                }
                return true;
            });
            if (found) {
                var name = found.fullName || found.FullName || '';
                if (nameEl && !nameEl.value.trim()) nameEl.value = name;
                if (hint) { hint.textContent = '✓ ' + name; hint.className = 'phone-hint ok'; }
                _matchedUserId = found.userID || found.UserID || null;
                loadCustomerVouchers(_matchedUserId);
            } else {
                // SĐT có trong hệ thống nhưng tên không khớp → coi như khách lẻ (không có kho voucher).
                if (hint) { hint.textContent = 'Khách mới'; hint.className = 'phone-hint muted'; }
                _matchedUserId = null;
                resetVoucherSelect();
            }
        })
        .catch(function () {
            if (hint) { hint.textContent = ''; hint.className = 'phone-hint'; }
            _matchedUserId = null;
            resetVoucherSelect();
        });
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
        invoice:    function () { renderInvCatTabs(); renderInvMenu(); loadInvAvailability(); loadInvoicesFromAPI(); loadAvailableTables(); onInvTypeChange(); },
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
var INV_AVAIL       = { map: {}, loaded: false };  // tình trạng còn hàng theo varient
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
        loadInvAvailability();
    }).catch(function (err) { console.error('[loadMenu]', err); });

// Tải tình trạng còn hàng theo cửa hàng của nhân viên rồi vẽ lại menu để làm
// mờ + chặn chọn những món đã hết nguyên liệu.
function loadInvAvailability() {
    var storeId = localStorage.getItem('storeId');
    fetchVarientAvailability(storeId).then(function (avail) {
        INV_AVAIL = avail;
        renderInvMenu();
    });
}
})();

// Dropdown "Mã giảm giá" nay phản ánh kho voucher của khách đã khớp tài khoản.
// Gọi lại sau khi render/đổi loại đơn: nếu đã khớp khách thì nạp lại kho của khách, ngược lại reset.
function loadAvailableTickets() {
    if (_matchedUserId) loadCustomerVouchers(_matchedUserId);
    else resetVoucherSelect();
}

// Nạp kho voucher của 1 khách cụ thể, lọc các voucher còn hiệu lực (chưa dùng, chưa xóa, trong hạn).
function loadCustomerVouchers(userId) {
    var sel = document.getElementById('inv-ticket');
    if (!sel || !userId) return;
    apiGet('/ticket/user-tickets/' + encodeURIComponent(userId))
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (data) {
            var now = todayVN();
            var valid = (Array.isArray(data) ? data : []).filter(function (tk) {
                return !tk.usedAt && !tk.deletedAt &&
                       (tk.startDate || '') <= now &&
                       (tk.endDate   || '') >= now;
            });
            populateVoucherSelect(sel, valid);
        })
        .catch(function () { resetVoucherSelect(); });
}

// Đổ danh sách voucher vào dropdown; giữ lựa chọn cũ nếu vẫn còn hợp lệ.
function populateVoucherSelect(sel, valid) {
    var prev = sel.dataset.ticketId || '';
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
    if (prev && sel.querySelector('option[value="' + prev + '"]')) {
        sel.value = prev;
        onTicketSelect(sel);
    } else {
        sel.value = '';
        sel.dataset.ticketId = '';
        sel.dataset.discount = 0;
        updateInvTotal();
        calcChange();
    }
}

// Reset dropdown về trạng thái không có voucher (khách lẻ / chưa khớp tài khoản).
function resetVoucherSelect() {
    var sel = document.getElementById('inv-ticket');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- Không dùng mã --</option>';
    sel.value = '';
    sel.dataset.ticketId = '';
    sel.dataset.discount = 0;
    updateInvTotal();
    calcChange();
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
        var out        = isVarientOut(INV_AVAIL, m.id);
        var soldClass  = out ? ' sold-out' : '';
        var soldBadge  = out ? '<div class="menu-card-soldout-badge">Hết hàng</div>' : '';
        var emoji      = CAT_EMOJI[m.type] || '🍽️';
        var imgHtml    = m.image
            ? '<img class="menu-card-img" src="' + m.image + '" alt="' + m.name
              + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'">'
              + '<div class="menu-card-img-placeholder" style="display:none">' + emoji + '</div>'
            : '<div class="menu-card-img-placeholder">' + emoji + '</div>';
        var forPeople  = m.forPeople ? '<div class="menu-card-for">👥 ' + m.forPeople + ' người</div>' : '';
        var addBtn     = out
            ? '<button class="qty-btn" disabled title="Hết hàng">+</button>'
            : '<button class="qty-btn" onclick="invQty(' + m.id + ',1)">+</button>';
        return '<div class="menu-card' + selected + soldClass + '" id="menu-card-' + m.id + '">'
            + soldBadge
            + imgHtml
            + '<div class="menu-card-body">'
            +   '<div class="menu-card-name">' + m.name + '</div>'
            +   '<div class="menu-card-price">' + Number(m.price).toLocaleString('vi-VN') + 'đ</div>'
            +   forPeople
            + '</div>'
            + '<div class="menu-card-ctrl">'
            +   '<button class="qty-btn" onclick="invQty(' + m.id + ',-1)">−</button>'
            +   '<span class="qty-num" id="inv-qty-' + m.id + '">' + qty + '</span>'
            +   addBtn
            + '</div>'
            + '</div>';
    }).join('');
    updateInvTotal();
}

function invQty(id, delta) {
    if (delta > 0 && isVarientOut(INV_AVAIL, id)) { toast('Món này đã hết nguyên liệu', 'error'); return; }
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

function onPaymentMethodChange(val) {
    var cashSection = document.getElementById('cash-payment-section');
    if (cashSection) {
        cashSection.style.display = val === 'BankTransfer' ? 'none' : '';
    }
}

function createInvoice() {
    var customer   = document.getElementById('inv-customer').value.trim();
    var phone      = document.getElementById('inv-phone').value.trim();
    var type       = document.getElementById('inv-type').value;
    var tableNo    = document.getElementById('inv-table').value.trim();
    var storeId    = localStorage.getItem('storeId');
    var employeeId = localStorage.getItem('employeeId');

    if (!Object.keys(INV_CART).length) { toast('Vui lòng chọn ít nhất 1 món!', 'error'); return; }

    var paymentMethod = 'Cash';
    var pmRadio = document.querySelector('input[name="inv-payment-method"]:checked');
    if (pmRadio) {
        paymentMethod = pmRadio.value;
    }

    var total  = updateInvTotal();
    var received = 0;
    var change = 0;

    if (paymentMethod === 'Cash') {
        received = parseInt(document.getElementById('inv-received').value) || 0;
        if (received < total) {
            toast('Số tiền khách đưa không đủ!', 'error');
            return;
        }
        change = received - total;
    }

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
        PaymentMethods: paymentMethod,
        MoneyReceived:  paymentMethod === 'BankTransfer' ? 0 : received,
        MoneyGiveBack:  paymentMethod === 'BankTransfer' ? 0 : change,
        products:       products,
        EmployeID:      employeeId
    };
    if (ticketId) body.TicketID = ticketId;

    apiPost('/bill/create-dinein', body).then(function (r) {
        if (!r.ok) {
            return r.text().then(function (t) {
                var errMsg = 'Lỗi tạo hóa đơn';
                try {
                    var parsed = JSON.parse(t);
                    errMsg = parsed.message || parsed.Message || t;
                } catch (e) {
                    errMsg = t;
                }
                throw new Error(errMsg);
            });
        }
        return r.json();
    }).then(function (data) {
        if (type === 'dine-in' && tableId) {
            var t = TABLES.find(function (t) {
                var id = t.TableID || t.tableID || t.tableId || t.id || t.ID;
                return id == tableId;
            });
            if (t) {
                if (t.Status !== undefined) t.Status = 'Occupied';
                if (t.status !== undefined) t.status = 'Occupied';
            }
        }

        INV_CART = {};
        ['inv-customer','inv-phone','inv-received','inv-change'].forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
        });
        var phoneHint = document.getElementById('inv-phone-hint');
        if (phoneHint) { phoneHint.textContent = ''; phoneHint.className = 'phone-hint'; }
        _matchedUserId = null;
        resetVoucherSelect();
        loadAvailableTables();
        renderInvMenu();
        loadInvoicesFromAPI(/*silent=*/false);

        // Reset payment method selector to cash
        var defaultPm = document.querySelector('input[name="inv-payment-method"][value="Cash"]');
        if (defaultPm) {
            defaultPm.checked = true;
            onPaymentMethodChange('Cash');
        }

        if (data && data.paymentMethods === 'BankTransfer' && data.qrUrl) {
            showSePayQrModal(data, function () {
                toast('Thanh toán chuyển khoản thành công!');
                loadInvoicesFromAPI(/*silent=*/false);
            });
        } else {
            toast('Xuất hóa đơn thành công!');
        }
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
            var timeStr      = createdAt ? fmtVnTime(createdAt) : '';
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
                var status = t.Status || t.status || '';
                return status.toLowerCase() === 'available';
            }).forEach(function (t) {
                var opt = document.createElement('option');
                var id = t.TableID || t.tableID || t.tableId || t.id || t.ID;
                var num = t.TableNumber || t.tableNumber || t.num || id;
                opt.value = id;
                opt.textContent = 'Bàn ' + num;
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
        var tableId   = t.TableID || t.tableID || t.tableId || t.id || t.ID;
        var tableNum  = t.TableNumber || t.tableNumber || t.num || tableId;
        var capacity  = t.SeatingCapacity || t.seatingCapacity || t.Capacity || t.capacity || 0;
        return '<div class="table-card ' + status.toLowerCase() + '" onclick="cycleTableStatus(\'' + tableId + '\')">'
            + '<div class="tc-num">B' + tableNum + '</div>'
            + '<div class="tc-cap"><i class="ti-user"></i> ' + capacity + ' người</div>'
            + '<div class="tc-status">' + (TABLE_STATUS_LABEL[statusKey] || TABLE_STATUS_LABEL[status] || status) + '</div>'
            + '</div>';
    }).join('');
}

function cycleTableStatus(tableId) {
    var t = TABLES.find(function (t) {
        var id = t.TableID || t.tableID || t.tableId || t.id || t.ID;
        return id == tableId;
    });
    if (!t) return;
    var status    = t.Status || t.status || 'Available';
    var statusKey = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    var idx       = TABLE_STATUS_CYCLE.indexOf(statusKey);
    var newStatus = TABLE_STATUS_CYCLE[(idx + 1) % TABLE_STATUS_CYCLE.length];

    apiPut('/diningtable/update', { tableID: tableId, status: newStatus }).then(function (r) {
        if (!r.ok) throw new Error();
        if (t.Status !== undefined) t.Status = newStatus;
        if (t.status !== undefined) t.status = newStatus;
        renderTablesLocal();
        var tableNum = t.TableNumber || t.tableNumber || t.num || tableId;
        toast('Bàn B' + tableNum + ' → ' + (TABLE_STATUS_LABEL[newStatus] || newStatus));
    }).catch(function () {
        toast('Lỗi cập nhật trạng thái bàn!', 'error');
    });
}

// Popup thêm bàn mới: nhập số bàn + số lượng khách (không còn chọn tầng).
function openTableModal() {
    var overlay = document.createElement('div');
    overlay.className = 'cash-modal-overlay';
    overlay.innerHTML =
        '<div class="cash-modal" role="dialog" aria-modal="true">'
      +   '<div class="cash-modal-head"><i class="ti-plus"></i><span>Thêm bàn mới</span></div>'
      +   '<div class="cash-modal-body">'
      +     '<div class="form-group" style="margin-bottom:14px">'
      +       '<label>Số bàn</label>'
      +       '<input type="number" min="1" class="tbl-num" placeholder="VD: 12" autocomplete="off">'
      +     '</div>'
      +     '<div class="form-group" style="margin-bottom:6px">'
      +       '<label>Số lượng khách</label>'
      +       '<input type="number" min="1" class="tbl-cap" placeholder="VD: 4" autocomplete="off">'
      +     '</div>'
      +     '<div class="cash-error tbl-error"></div>'
      +   '</div>'
      +   '<div class="cash-modal-foot">'
      +     '<button type="button" class="btn cash-cancel">Huỷ</button>'
      +     '<button type="button" class="btn btn-primary tbl-ok"><i class="ti-check"></i> Thêm bàn</button>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(overlay);

    var numEl = overlay.querySelector('.tbl-num');
    var capEl = overlay.querySelector('.tbl-cap');
    var errEl = overlay.querySelector('.tbl-error');
    var okBtn = overlay.querySelector('.tbl-ok');

    function close() {
        document.removeEventListener('keydown', onKey);
        overlay.remove();
    }
    function onKey(e) {
        if (e.key === 'Escape') close();
        else if (e.key === 'Enter') submit();
    }
    function submit() {
        var num = parseInt(numEl.value, 10);
        var cap = parseInt(capEl.value, 10);
        if (!num || num < 1) { errEl.textContent = 'Vui lòng nhập số bàn hợp lệ.'; numEl.focus(); return; }
        if (!cap || cap < 1) { errEl.textContent = 'Vui lòng nhập số lượng khách hợp lệ.'; capEl.focus(); return; }
        var storeId = localStorage.getItem('storeId');
        okBtn.disabled = true;
        apiPost('/diningtable/add', { StoreID: storeId, TableNumber: num, SeatingCapacity: cap })
            .then(function (r) {
                if (!r.ok) throw new Error();
                close();
                renderTables();
                toast('Đã thêm Bàn ' + num);
            }).catch(function () {
                okBtn.disabled = false;
                errEl.textContent = 'Lỗi thêm bàn! Vui lòng thử lại.';
            });
    }

    overlay.querySelector('.cash-cancel').addEventListener('click', close);
    okBtn.addEventListener('click', submit);
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) close(); });
    document.addEventListener('keydown', onKey);
    setTimeout(function () { numEl.focus(); }, 30);
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
            var supplierObj = po.Supplier || po.supplier;
            var supplier = (supplierObj && (supplierObj.SupplierName || supplierObj.supplierName || supplierObj.Name || supplierObj.name)) || '—';
            var details  = po.PODetail || po.poDetail || [];
            var items    = details.map(function (d) {
                var ing = d.Ingredient || d.ingredient;
                var ingId = d.IngredientID || d.ingredientID || '—';
                return (ing && (ing.IngredientName || ing.ingredientName || ing.Name || ing.name)) || ('NL ' + ingId);
            }).join(', ') || '—';
            var total = po.Total || po.total || 0;
            var taxRate = po.TaxRate !== undefined ? po.TaxRate : po.taxRate;
            var tax   = taxRate !== undefined ? (taxRate * 100).toFixed(0) + '%' : '—';
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
            var supplierObj = po.Supplier || po.supplier;
            var supplier = (supplierObj && (supplierObj.SupplierName || supplierObj.supplierName || supplierObj.Name || supplierObj.name)) || '—';
            var details  = po.PODetail || po.poDetail || [];
            var items    = details.map(function (d) {
                var ing = d.Ingredient || d.ingredient;
                var ingId = d.IngredientID || d.ingredientID || '—';
                return (ing && (ing.IngredientName || ing.ingredientName || ing.Name || ing.name)) || ('NL ' + ingId);
            }).join(', ') || '—';
            var total = po.Total || po.total || 0;
            var taxRate = po.TaxRate !== undefined ? po.TaxRate : po.taxRate;
            var tax   = taxRate !== undefined ? (taxRate * 100).toFixed(0) + '%' : '—';
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
        loadWhWarehouses(function () {
            renderWhStep2(data);
            whGoStep(2);
        });
    }).catch(function (err) { toast(err.message || 'Lỗi tải thông tin PO!', 'error'); });
}

function renderWhStep2(data) {
    var info     = document.getElementById('wh-po-info');
    var lines    = data.PODetailLines || data.poDetailLines || data.Items || data.items || [];
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

    var tableHeader = '<div class="tbl-wrap"><table><thead><tr>'
        + '<th>Nguyên liệu</th>'
        + '<th>SL yêu cầu</th>'
        + '<th>SL thực nhận</th>'
        + '<th>SL tốt (GoodQty)</th>'
        + '<th>Đơn giá (đ/kg)</th>'
        + '<th>Đưa vào kho</th>'
        + '<th style="text-align:right">Thành tiền</th>'
        + '</tr></thead><tbody>';

    var tableRows = lines.map(function (item, i) {
        var ingId   = item.IngredientID || item.ingredientID;
        var ingName = (item.Ingredient && (item.Ingredient.Name || item.Ingredient.name))
            || item.IngredientName || item.ingredientName || ('Nguyên liệu ' + ingId);
        var qtyExpected = item.QuantityExpected || item.quantityExpected || item.Quantity || item.quantity || 0;
        var up  = item.UnitPriceExpected || item.unitPriceExpected || item.UnitPrice || item.unitPrice || 0;
        var lineTotal = qtyExpected * up;

        var whOptions = WH_WAREHOUSES.map(function (w) {
            return '<option value="' + (w.WarehouseID || w.warehouseID) + '">'
                + (w.Name || w.name || 'Kho ' + (w.WarehouseID || w.warehouseID)) + '</option>';
        }).join('') || '<option value="">-- Không có kho --</option>';

        return '<tr>'
            + '<td><strong>' + ingName + '</strong> <span style="font-size:11px;color:var(--muted)">(ID: ' + ingId + ')</span></td>'
            + '<td>' + qtyExpected + '</td>'
            + '<td><input type="number" id="rl-qty-' + i + '" value="' + qtyExpected + '" step="0.1" min="0" oninput="updateWhReceiptTotals()" style="width:100px;padding:6px;border:1px solid var(--border);border-radius:4px;"></td>'
            + '<td><input type="number" id="rl-gq-' + i + '" value="' + qtyExpected + '" step="0.1" min="0" style="width:100px;padding:6px;border:1px solid var(--border);border-radius:4px;"></td>'
            + '<td><input type="number" id="rl-up-' + i + '" value="' + up + '" min="0" readonly style="background:#f3f4f6;cursor:not-allowed;width:120px;padding:6px;border:1px solid var(--border);border-radius:4px;"></td>'
            + '<td><select id="rl-wh-' + i + '" style="padding:6px;border:1px solid var(--border);border-radius:4px;">' + whOptions + '</select></td>'
            + '<td style="text-align:right;font-weight:700;color:var(--primary)" id="rl-total-' + i + '">' + parseInt(lineTotal).toLocaleString('vi-VN') + 'đ</td>'
            + '</tr>';
    }).join('');

    var tableFooter = '</tbody></table></div>'
        + '<div style="margin-top:15px;text-align:right;font-size:16px;">'
        + '<strong>Tổng tiền phải trả: <span id="wh-receipt-grand-total" style="color:var(--primary);font-size:18px">0đ</span></strong>'
        + '</div>';

    container.innerHTML = tableHeader + tableRows + tableFooter;
    updateWhReceiptTotals();
}

function updateWhReceiptTotals() {
    var lines = WH_RECEIPT_LINES_DATA;
    var grandTotal = 0;
    lines.forEach(function (item, i) {
        var up = item.UnitPriceExpected || item.unitPriceExpected || item.UnitPrice || item.unitPrice || 0;
        var qtyInput = document.getElementById('rl-qty-' + i);
        var qty = parseFloat(qtyInput ? qtyInput.value : 0) || 0;
        var lineTotal = qty * up;
        grandTotal += lineTotal;
        var totalEl = document.getElementById('rl-total-' + i);
        if (totalEl) {
            totalEl.textContent = parseInt(lineTotal).toLocaleString('vi-VN') + 'đ';
        }
    });
    var grandEl = document.getElementById('wh-receipt-grand-total');
    if (grandEl) {
        grandEl.textContent = parseInt(grandTotal).toLocaleString('vi-VN') + 'đ';
    }
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
            if (!r.ok) {
                return r.text().then(function (t) {
                    var errMsg = 'Lỗi tạo phiếu nhập';
                    try {
                        var parsed = JSON.parse(t);
                        errMsg = parsed.message || parsed.Message || t;
                    } catch (e) {
                        errMsg = t;
                    }
                    throw new Error(errMsg);
                });
            }
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
    var dateStamp = vnTodayISO().replace(/-/g, '');
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
            if (!r.ok) {
                return r.text().then(function (t) {
                    var errMsg = 'Lỗi xác nhận';
                    try {
                        var parsed = JSON.parse(t);
                        errMsg = parsed.message || parsed.Message || t;
                    } catch (e) {
                        errMsg = t;
                    }
                    throw new Error(errMsg);
                });
            }
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
        var empObj = r.Employee  || r.employee;
        var emp    = (empObj && (empObj.FullName || empObj.fullName)) || '—';
        var date   = r.DateReceive || r.dateReceive || '—';
        var confirmedAt = r.ConfirmedAt || r.confirmedAt;
        var status = r.Status     || r.status     || (confirmedAt ? 'Confirmed' : 'Pending');
        var statusText = status === 'Confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận';
        var badgeCls   = status === 'Confirmed' ? 'badge-green' : 'badge-yellow';
        return '<tr>'
            + '<td style="color:var(--primary);font-weight:700;font-size:12px">' + String(id).slice(0, 12) + '...</td>'
            + '<td style="font-size:12px;color:var(--muted)">' + String(poId).slice(0, 12) + '...</td>'
            + '<td>' + emp + '</td>'
            + '<td style="font-size:12px;color:var(--muted)">' + String(date).slice(0, 10) + '</td>'
            + '<td><span class="badge ' + badgeCls + '">' + statusText + '</span></td>'
            + '</tr>';
    }).join('');
}

// BIẾN ĐỘNG KHO (local only – không có API endpoint)
var SM_INGREDIENTS = [];

// Nạp danh sách nguyên liệu vào dropdown #sm-item (thay cho nhập text).
function loadStockMoveIngredients() {
    var sel = document.getElementById('sm-item');
    if (!sel) return;
    function fill(list) {
        SM_INGREDIENTS = list || [];
        if (!SM_INGREDIENTS.length) {
            sel.innerHTML = '<option value="">-- Chưa có nguyên liệu --</option>';
            return;
        }
        sel.innerHTML = '<option value="">-- Chọn nguyên liệu --</option>'
            + SM_INGREDIENTS.map(function (i) {
                var unit = i.ingredientUnit || i.IngredientUnit || '';
                return '<option value="' + i.ingredientID + '" data-unit="' + unit + '">'
                    + (i.ingredientName || ('#' + i.ingredientID)) + '</option>';
            }).join('');
    }
    // Dùng lại cache nếu đã nạp (vd từ tab Sơ chế), tránh gọi API thừa.
    if (PROC_INGREDIENTS && PROC_INGREDIENTS.length) { fill(PROC_INGREDIENTS); return; }
    apiGet('/ingredient/get-all')
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (d) { fill(pAsArray(d)); })
        .catch(function () { fill([]); });
}

// Khi chọn nguyên liệu → tự điền đơn vị (đơn vị là thuộc tính cố định của nguyên liệu).
function onStockMoveIngredientChange() {
    var sel = document.getElementById('sm-item');
    var unitEl = document.getElementById('sm-unit');
    if (!sel || !unitEl) return;
    var opt = sel.selectedOptions && sel.selectedOptions[0];
    unitEl.value = (opt && opt.getAttribute('data-unit')) || '';
}

function addStockMovement() {
    var sel  = document.getElementById('sm-item');
    var opt  = sel && sel.selectedOptions && sel.selectedOptions[0];
    var item = opt ? opt.textContent.trim() : '';
    var type = document.getElementById('sm-type').value;
    var qty  = document.getElementById('sm-qty').value;
    var unit = document.getElementById('sm-unit').value;
    var note = document.getElementById('sm-note').value.trim();

    if (!sel || !sel.value) { toast('Vui lòng chọn nguyên liệu!', 'error'); return; }
    if (!qty || !note) { toast('Vui lòng điền đầy đủ thông tin!', 'error'); return; }

    var sign = (type === 'import') ? '+' : (type === 'adjust' ? '±' : '−');
    STOCK_MOVEMENTS.unshift({ item: item, type: type, qty: sign + qty + ' ' + unit, note: note, time: fmtVnFull(new Date()) });

    sel.value = '';
    document.getElementById('sm-unit').value = '';
    document.getElementById('sm-qty').value  = '';
    document.getElementById('sm-note').value = '';
    renderStockMove();
    toast('Ghi nhận biến động kho thành công!');
}

function renderStockMove() {
    loadStockMoveIngredients();
    var tbody = document.getElementById('stockmove-tbody');
    if (!tbody) return;
    
    var storeId = localStorage.getItem('storeId') || 0;
    var url = '/StockMovement/get-all';
    if (storeId > 0) {
        url += '?storeID=' + storeId;
    }
    
    apiGet(url)
    .then(function(r) { return r.ok ? r.json() : []; })
    .then(function(data) {
        var dbMovs = Array.isArray(data) ? data : [];
        
        if (!dbMovs.length && !STOCK_MOVEMENTS.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="tbl-empty">Chưa có dữ liệu biến động kho</td></tr>';
            return;
        }
        
        var html = '';
        
        // 1. Render local movements
        STOCK_MOVEMENTS.forEach(function(s) {
            var badgeCls = MOVE_BADGE[s.type] || 'badge-gray';
            html += '<tr>'
                + '<td><strong>' + s.item + '</strong></td>'
                + '<td><span class="badge ' + badgeCls + '">' + MOVE_LABEL[s.type] + '</span></td>'
                + '<td><strong>' + s.qty + '</strong></td>'
                + '<td style="font-size:12px;color:var(--muted)">' + s.note + '</td>'
                + '<td style="font-size:12px;color:var(--muted)">' + s.time + '</td>'
                + '<td style="text-align:center">—</td>'
                + '</tr>';
        });
        
        // 2. Render database movements
        dbMovs.forEach(function(m) {
            var movementType = m.movementType || '';
            var typeLabel = '';
            var badgeClass = '';
            
            if (movementType === 'PurchaseReceipt') {
                typeLabel = 'Nhập kho';
                badgeClass = 'badge-green';
            } else if (movementType === 'Consumption') {
                typeLabel = 'Chế biến';
                badgeClass = 'badge-orange';
            } else if (movementType === 'Waste') {
                typeLabel = 'Hao hụt';
                badgeClass = 'badge-red';
            } else if (movementType === 'Processing') {
                typeLabel = 'Sơ chế';
                badgeClass = 'badge-blue';
            } else {
                typeLabel = 'Điều chỉnh';
                badgeClass = 'badge-blue';
            }
            
            var formattedDate = m.timeStamp ? m.timeStamp.replace('T', ' ').slice(0, 19) : '—';
            var qtyChangeStr = (m.qtyChange > 0 ? '+' : '') + m.qtyChange + ' ' + (m.ingredientUnit || '');
            var reasonOrNote = m.reason || m.note || '—';
            
            var detailBtn = '—';
            if (m.referenceID) {
                detailBtn = '<button class="btn-detail-toggle" onclick="toggleMovDetails(\'' + m.stockMovementID + '\', \'' + m.referenceType + '\', \'' + m.referenceID + '\', this)">Chi tiết</button>';
            }
            
            html += '<tr id="mov-row-' + m.stockMovementID + '">'
                + '<td><strong>' + (m.ingredientName || '—') + '</strong></td>'
                + '<td><span class="badge ' + badgeClass + '">' + typeLabel + '</span></td>'
                + '<td><strong>' + qtyChangeStr + '</strong></td>'
                + '<td style="font-size:12px;color:var(--muted)">' + reasonOrNote + '</td>'
                + '<td style="font-size:12px;color:var(--muted)">' + formattedDate + '</td>'
                + '<td style="text-align:center">' + detailBtn + '</td>'
                + '</tr>'
                + '<tr class="detail-row" id="detail-row-' + m.stockMovementID + '" style="display:none;">'
                + '<td colspan="6"><div class="mov-detail-content" id="detail-content-' + m.stockMovementID + '">Đang tải chi tiết...</div></td>'
                + '</tr>';
        });
        
        tbody.innerHTML = html;
    }).catch(function(err) {
        tbody.innerHTML = '<tr><td colspan="6" class="tbl-empty" style="color:var(--red)">Lỗi tải dữ liệu: ' + (err.message || '') + '</td></tr>';
    });
}

window.toggleMovDetails = function(movId, refType, refId, btn) {
    var detailRow = document.getElementById('detail-row-' + movId);
    var detailContent = document.getElementById('detail-content-' + movId);
    if (!detailRow || !detailContent) return;
    
    if (detailRow.style.display !== 'none') {
        detailRow.style.display = 'none';
        btn.textContent = 'Chi tiết';
        return;
    }
    
    detailRow.style.display = 'table-row';
    btn.textContent = 'Thu gọn';
    
    detailContent.innerHTML = '<div class="mov-detail-card">Đang tải thông tin chi tiết...</div>';
    
    if (refType === 'Bill') {
        apiGet('/bill/get/' + refId)
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(bill) {
            if (!bill) {
                detailContent.innerHTML = '<div class="mov-detail-card" style="color:var(--red)">Không tìm thấy thông tin hóa đơn.</div>';
                return;
            }
            
            var pMethod = bill.paymentMethods || bill.PaymentMethods || 'Cash';
            var pStatus = bill.paymentStatus || bill.PaymentStatus || 'Pending';
            var pMethodText = pMethod === 'BankTransfer' ? 'Chuyển khoản' : (pMethod === 'Card' ? 'Thẻ' : 'Tiền mặt');
            var pStatusText = pStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán';
            var customerName = (bill.user && (bill.user.fullName || bill.user.FullName)) || 'Khách vãng lai';
            var storeName = (bill.store && (bill.store.storeName || bill.store.StoreName)) || 'Chi nhánh';
            var tableNum = bill.tableID || bill.tableId || '—';
            
            var detailsListHtml = (bill.billDetail || []).map(function(d) {
                var pVar = d.productVarient || d.ProductVarient || {};
                var prod = pVar.product || pVar.Product || {};
                var prodName = prod.productName || prod.ProductName || ('Mã ' + pVar.productID);
                var sizeText = (pVar.size && pVar.size !== 'Default') ? ' (' + pVar.size + ')' : '';
                return '<tr>'
                    + '<td>' + prodName + sizeText + '</td>'
                    + '<td style="text-align:center">' + d.quantity + '</td>'
                    + '<td style="text-align:right">' + Number(d.price).toLocaleString('vi-VN') + ' đ</td>'
                    + '<td style="text-align:right;font-weight:700">' + Number(d.inlineTotal).toLocaleString('vi-VN') + ' đ</td>'
                    + '</tr>';
            }).join('');
            
            detailContent.innerHTML = 
                '<div class="mov-detail-card">'
                + '  <div class="mov-detail-title">Chi Tiết Đơn Hàng #' + refId.slice(0,8).toUpperCase() + '</div>'
                + '  <div class="mov-detail-grid">'
                + '    <div class="mov-detail-label">Cửa hàng:</div><div class="mov-detail-value">' + storeName + '</div>'
                + '    <div class="mov-detail-label">Khách hàng:</div><div class="mov-detail-value">' + customerName + '</div>'
                + '    <div class="mov-detail-label">Bàn:</div><div class="mov-detail-value">' + tableNum + '</div>'
                + '    <div class="mov-detail-label">Hình thức:</div><div class="mov-detail-value">' + pMethodText + ' (' + pStatusText + ')</div>'
                + '    <div class="mov-detail-label">Tổng cộng:</div><div class="mov-detail-value" style="color:var(--primary)">' + Number(bill.total).toLocaleString('vi-VN') + ' đ</div>'
                + '  </div>'
                + '  <table class="mov-detail-table">'
                + '    <thead>'
                + '      <tr><th>Món ăn</th><th style="text-align:center">SL</th><th style="text-align:right">Đơn giá</th><th style="text-align:right">Thành tiền</th></tr>'
                + '    </thead>'
                + '    <tbody>' + (detailsListHtml || '<tr><td colspan="4" class="tbl-empty">Không có sản phẩm</td></tr>') + '</tbody>'
                + '  </table>'
                + '</div>';
        })
        .catch(function(err) {
            detailContent.innerHTML = '<div class="mov-detail-card" style="color:var(--red)">Lỗi tải chi tiết hóa đơn: ' + err.message + '</div>';
        });
    } else if (refType === 'GoodsReceipt') {
        apiGet('/receipt/getid/' + refId)
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(receipt) {
            if (!receipt) {
                detailContent.innerHTML = '<div class="mov-detail-card" style="color:var(--red)">Không tìm thấy thông tin phiếu nhập kho.</div>';
                return;
            }
            
            var supplierName = (receipt.supplier && (receipt.supplier.supplierName || receipt.supplier.SupplierName)) || 'Nhà cung cấp';
            var employeeName = (receipt.employee && (receipt.employee.fullName || receipt.employee.FullName)) || 'Nhân viên';
            var storeName = (receipt.store && (receipt.store.storeName || receipt.store.StoreName)) || 'Chi nhánh';
            var poText = (receipt.poid || receipt.poID) ? ('PO #' + (receipt.poid || receipt.poID).slice(0, 8).toUpperCase()) : 'Trực tiếp (Không PO)';
            
            var detailsListHtml = (receipt.receiptDetail || []).map(function(d) {
                var ing = d.ingredient || d.Ingredient || {};
                var ingName = ing.ingredientName || ing.IngredientName || ('Mã ' + d.ingredientID);
                var unitText = ing.ingredientUnit || ing.IngredientUnit || '';
                return '<tr>'
                    + '<td>' + ingName + '</td>'
                    + '<td style="text-align:center">' + d.quantity + '</td>'
                    + '<td style="text-align:center;color:var(--green);font-weight:700">' + d.goodQuantity + '</td>'
                    + '<td>' + unitText + '</td>'
                    + '<td style="text-align:right">' + Number(d.unitPrice).toLocaleString('vi-VN') + ' đ</td>'
                    + '<td style="text-align:right;font-weight:700">' + Number(d.goodQuantity * d.unitPrice).toLocaleString('vi-VN') + ' đ</td>'
                    + '</tr>';
            }).join('');
            
            var totalAmount = (receipt.receiptDetail || []).reduce(function(acc, d) {
                return acc + (d.goodQuantity * d.unitPrice);
            }, 0);
            
            detailContent.innerHTML = 
                '<div class="mov-detail-card">'
                + '  <div class="mov-detail-title">Chi Tiết Phiếu Nhập #' + refId.slice(0,8).toUpperCase() + '</div>'
                + '  <div class="mov-detail-grid">'
                + '    <div class="mov-detail-label">Cửa hàng:</div><div class="mov-detail-value">' + storeName + '</div>'
                + '    <div class="mov-detail-label">Nhà cung cấp:</div><div class="mov-detail-value">' + supplierName + '</div>'
                + '    <div class="mov-detail-label">Người nhập:</div><div class="mov-detail-value">' + employeeName + '</div>'
                + '    <div class="mov-detail-label">Đơn PO:</div><div class="mov-detail-value">' + poText + '</div>'
                + '    <div class="mov-detail-label">Tổng giá trị:</div><div class="mov-detail-value" style="color:var(--primary)">' + Number(totalAmount).toLocaleString('vi-VN') + ' đ</div>'
                + '  </div>'
                + '  <table class="mov-detail-table">'
                + '    <thead>'
                + '      <tr><th>Nguyên liệu</th><th style="text-align:center">Nhập</th><th style="text-align:center">Đạt</th><th>Đơn vị</th><th style="text-align:right">Đơn giá</th><th style="text-align:right">Thành tiền</th></tr>'
                + '    </thead>'
                + '    <tbody>' + (detailsListHtml || '<tr><td colspan="6" class="tbl-empty">Không có chi tiết nhập kho</td></tr>') + '</tbody>'
                + '  </table>'
                + '</div>';
        })
        .catch(function(err) {
            detailContent.innerHTML = '<div class="mov-detail-card" style="color:var(--red)">Lỗi tải chi tiết phiếu nhập: ' + err.message + '</div>';
        });
    } else {
        detailContent.innerHTML = '<div class="mov-detail-card">Không hỗ trợ hiển thị chi tiết cho loại tham chiếu này.</div>';
    }
};

// GIAO HÀNG
// Thứ tự theo enum DeliveryStatus của backend (Pending=0 … Failed=6) — chỉ cho phép
// chuyển tới trạng thái có chỉ số lớn hơn (forward-only), khớp ràng buộc phía server.
var DELIVERY_STATUSES = ['Pending', 'Confirmed', 'Preparing', 'OnTheWay', 'Delivered', 'Cancelled', 'Failed'];
var DELIVERY_STATUS_LABEL = {
    Pending: 'Chờ giao', Confirmed: 'Đã xác nhận', Preparing: 'Đang chuẩn bị',
    OnTheWay: 'Đang giao', Delivered: 'Đã giao', Cancelled: 'Đã huỷ', Failed: 'Thất bại'
};
var DELIVERY_STATUS_BADGE = {
    Pending: 'badge-yellow', Confirmed: 'badge-blue', Preparing: 'badge-blue',
    OnTheWay: 'badge-orange', Delivered: 'badge-green', Cancelled: 'badge-red', Failed: 'badge-red'
};
// Trạng thái kết thúc — không cho phép thay đổi nữa.
var DELIVERY_TERMINAL = ['Delivered', 'Cancelled', 'Failed'];

// Phương thức & trạng thái thanh toán (khớp enum PaymentMethods / PaymentStatus của backend).
var PAYMENT_METHOD_LABEL = { Cash: 'Tiền mặt', Card: 'Thẻ', BankTransfer: 'Chuyển khoản' };
var PAYMENT_STATUS_LABEL = { Paid: 'Đã thanh toán', Pending: 'Chưa thanh toán', Failed: 'Thanh toán lỗi' };
var PAYMENT_STATUS_BADGE = { Paid: 'badge-green', Pending: 'badge-yellow', Failed: 'badge-red' };

// Khớp giá trị enum (không phân biệt hoa/thường) với key trong map.
function payKey(v, map) {
    if (!v) return '';
    if (map[v]) return v;
    var s = String(v).toLowerCase();
    for (var k in map) { if (k.toLowerCase() === s) return k; }
    return '';
}

// Ô "Thanh toán": phương thức + badge trạng thái đã/chưa thanh toán.
function paymentCell(bill) {
    bill = bill || {};
    var mKey = payKey(bill.paymentMethods || bill.PaymentMethods, PAYMENT_METHOD_LABEL);
    var sKey = payKey(bill.paymentStatus  || bill.PaymentStatus,  PAYMENT_STATUS_LABEL);
    var method = PAYMENT_METHOD_LABEL[mKey] || '—';
    var sLabel = PAYMENT_STATUS_LABEL[sKey] || '';
    var sBadge = PAYMENT_STATUS_BADGE[sKey] || 'badge-gray';
    return '<div style="font-size:12px;font-weight:600">' + method + '</div>'
        + (sLabel ? '<span class="badge ' + sBadge + '" style="margin-top:3px">' + sLabel + '</span>' : '');
}

// Đưa status (chuỗi hoa/thường tuỳ server) về đúng tên enum chuẩn.
function canonDeliveryStatus(raw) {
    if (!raw) return '';
    var s = String(raw).toLowerCase();
    for (var i = 0; i < DELIVERY_STATUSES.length; i++) {
        if (DELIVERY_STATUSES[i].toLowerCase() === s) return DELIVERY_STATUSES[i];
    }
    return '';
}

// Định dạng "HH:mm dd/MM/yyyy" — đọc thẳng các thành phần, không lệch múi giờ.
function fmtDeliveryTime(raw) {
    if (!raw) return '—';
    var m = String(raw).match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (!m) return String(raw);
    return m[4] + ':' + m[5] + ' ' + m[3] + '/' + m[2] + '/' + m[1];
}

// Đơn hẹn giờ chỉ được bắt đầu giao từ 15 phút trước giờ hẹn.
var DELIVERY_LEAD_MINUTES = 15;

// Định dạng Date (giờ local trình duyệt) → "HH:mm dd/MM/yyyy".
function fmtClock(date) {
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return p(date.getHours()) + ':' + p(date.getMinutes()) + ' '
        + p(date.getDate()) + '/' + p(date.getMonth() + 1) + '/' + date.getFullYear();
}

// Giờ hẹn giao của đơn (Date) hoặc null nếu không hẹn giờ.
function getScheduledAt(d) {
    var raw = d.scheduledAt || d.ScheduledAt;
    if (!raw) return null;
    var dt = new Date(raw);
    return isNaN(dt.getTime()) ? null : dt;
}

// Cổng chặn bắt đầu giao: { allowed, earliest? } — chặn nếu chưa tới 15' trước giờ hẹn.
function deliveryStartGate(d) {
    var sched = getScheduledAt(d);
    if (!sched) return { allowed: true };
    var earliest = new Date(sched.getTime() - DELIVERY_LEAD_MINUTES * 60000);
    if (new Date() < earliest) return { allowed: false, earliest: earliest };
    return { allowed: true };
}

// Ô "Trạng thái": badge tĩnh nếu đã kết thúc, ngược lại là dropdown đổi trạng thái.
function deliveryStatusCell(delivId, status) {
    var label = DELIVERY_STATUS_LABEL[status] || status || '—';
    if (!status || DELIVERY_TERMINAL.indexOf(status) !== -1) {
        return '<span class="badge ' + (DELIVERY_STATUS_BADGE[status] || 'badge-gray') + '">' + label + '</span>';
    }
    var curIdx = DELIVERY_STATUSES.indexOf(status);
    var opts = '<option value="' + status + '" selected>' + label + '</option>';
    for (var i = curIdx + 1; i < DELIVERY_STATUSES.length; i++) {
        var s = DELIVERY_STATUSES[i];
        opts += '<option value="' + s + '">' + (DELIVERY_STATUS_LABEL[s] || s) + '</option>';
    }
    return '<select class="del-status-select" onchange="changeDeliveryStatus(\'' + delivId + '\', this)">' + opts + '</select>';
}

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

// Lấy log mới nhất (ChangeAt lớn nhất) — không phụ thuộc thứ tự server trả về
function latestDeliveryLog(d) {
    var logs = d.deliveryLog || d.DeliveryLog || [];
    if (!logs.length) return null;
    return logs.slice().sort(function (a, b) {
        return new Date(b.changeAt || b.ChangeAt || 0) - new Date(a.changeAt || a.ChangeAt || 0);
    })[0];
}

function getDeliveryStatus(d) {
    var last = latestDeliveryLog(d);
    if (!last) return '';
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
            var sched    = getScheduledAt(d);
            var gate     = deliveryStartGate(d);
            var schedHtml = sched
                ? '<div class="del-sched' + (gate.allowed ? '' : ' del-sched-wait') + '"><i class="ti-time"></i> Hẹn giao: '
                    + fmtDeliveryTime(d.scheduledAt || d.ScheduledAt)
                    + (gate.allowed ? '' : ' · chỉ giao được từ ' + fmtClock(gate.earliest))
                    + '</div>'
                : '';
            return '<div class="delivery-item">'
                + '<div class="del-info">'
                + '<div class="del-id">Đơn: ' + String(billId).slice(0, 8).toUpperCase() + '</div>'
                + '<div class="del-customer">' + customer + '</div>'
                + '<div class="del-addr"><i class="ti-location-pin"></i> ' + address + '</div>'
                + schedHtml
                + '</div>'
                + '<div style="display:flex;gap:8px;align-items:center">'
                + '<input type="text" placeholder="Ghi chú..." style="padding:6px 10px;border:1px solid #e8e8e8;border-radius:6px;font-size:12px;width:160px" id="del-note-' + delivId + '">'
                + '<button class="btn btn-success btn-sm" onclick="startDelivery(\'' + delivId + '\')">'
                + '<i class="ti-truck"></i> Giao hàng</button>'
                + '</div></div>';
        }).join('');
    }

    var tbody = document.getElementById('delivery-done-tbody');
    if (!done.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="tbl-empty">Chưa có lịch sử</td></tr>';
        return;
    }
    tbody.innerHTML = done.map(function (d) {
        var delivId  = d.deliveryID || d.DeliveryID || '';
        var billId   = d.billID || d.BillID || '';
        var user     = d.user || d.User || {};
        var customer = user.fullName || user.FullName || ('BillID: ' + String(billId).slice(0, 8));
        var address  = getDeliveryAddrText(d);
        var schedTxt = getScheduledAt(d) ? fmtDeliveryTime(d.scheduledAt || d.ScheduledAt) : '—';
        var lastLog  = latestDeliveryLog(d) || {};
        var status   = canonDeliveryStatus(lastLog.status || lastLog.Status || '');
        var at       = fmtDeliveryTime(lastLog.changeAt || lastLog.ChangeAt || '');
        var emp      = lastLog.employee || lastLog.Employee || {};
        var empName  = emp.fullName || emp.FullName || '—';
        var note     = lastLog.note || lastLog.Note || d.note || d.Note || '—';
        return '<tr>'
            + '<td><strong style="color:var(--primary)">' + String(billId).slice(0, 8).toUpperCase() + '</strong></td>'
            + '<td>' + customer + '</td>'
            + '<td style="font-size:12px;color:var(--muted)">' + address + '</td>'
            + '<td style="font-size:12px">' + schedTxt + '</td>'
            + '<td>' + deliveryStatusCell(delivId, status) + '</td>'
            + '<td>' + paymentCell(d.bill || d.Bill) + '</td>'
            + '<td style="font-size:12px">' + at + '</td>'
            + '<td style="font-size:12px">' + empName + '</td>'
            + '<td style="font-size:12px;color:var(--muted)">' + note + '</td>'
            + '</tr>';
    }).join('');
}

// Popup nhập tiền mặt khi xác nhận "Đã giao" (thay cho prompt() mặc định).
// Trả về Promise: số tiền khách đưa (>= due), hoặc null nếu huỷ.
function cashModal(due) {
    return new Promise(function (resolve) {
        var overlay = document.createElement('div');
        overlay.className = 'cash-modal-overlay';
        overlay.innerHTML =
            '<div class="cash-modal" role="dialog" aria-modal="true">'
          +   '<div class="cash-modal-head"><i class="ti-money"></i><span>Thu tiền giao hàng</span></div>'
          +   '<div class="cash-modal-body">'
          +     '<div class="cash-row"><span>Tổng cần thu</span><strong class="cash-due">' + due.toLocaleString('vi-VN') + 'đ</strong></div>'
          +     '<label class="cash-label">Số tiền khách đưa (VND)</label>'
          +     '<input type="text" inputmode="numeric" class="cash-input" placeholder="0" autocomplete="off">'
          +     '<div class="cash-row"><span>Tiền thừa</span><strong class="cash-change">0đ</strong></div>'
          +     '<div class="cash-error"></div>'
          +   '</div>'
          +   '<div class="cash-modal-foot">'
          +     '<button type="button" class="btn cash-cancel">Huỷ</button>'
          +     '<button type="button" class="btn btn-primary cash-ok">Xác nhận</button>'
          +   '</div>'
          + '</div>';
        document.body.appendChild(overlay);

        var input  = overlay.querySelector('.cash-input');
        var change = overlay.querySelector('.cash-change');
        var errEl  = overlay.querySelector('.cash-error');

        function readMoney() { return Number((input.value || '').replace(/[^\d]/g, '')) || 0; }
        function onInput() {
            var raw = (input.value || '').replace(/[^\d]/g, '');
            input.value = raw ? Number(raw).toLocaleString('vi-VN') : '';
            var diff = readMoney() - due;
            change.textContent = (diff >= 0 ? diff : 0).toLocaleString('vi-VN') + 'đ';
            change.style.color = diff >= 0 ? '#1aaa55' : 'var(--muted)';
            errEl.textContent  = '';
        }
        function close(val) {
            document.removeEventListener('keydown', onKey);
            overlay.remove();
            resolve(val);
        }
        function submit() {
            var money = readMoney();
            if (money < due) {
                errEl.textContent = 'Số tiền khách đưa chưa đủ tổng cần thu.';
                input.focus();
                return;
            }
            close(money);
        }
        function onKey(e) {
            if (e.key === 'Escape') close(null);
            else if (e.key === 'Enter') submit();
        }

        input.addEventListener('input', onInput);
        overlay.querySelector('.cash-cancel').addEventListener('click', function () { close(null); });
        overlay.querySelector('.cash-ok').addEventListener('click', submit);
        overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) close(null); });
        document.addEventListener('keydown', onKey);
        setTimeout(function () { input.focus(); }, 30);
    });
}

// Kiểm tra điều kiện & lấy tiền mặt khi xác nhận "Đã giao".
//  - Thẻ / chuyển khoản: chỉ cho giao khi ĐÃ thanh toán; chưa thanh toán → chặn.
//  - Tiền mặt: mở popup nhập số tiền khách đưa, phải >= tổng cần thu (gồm ship).
// Trả về Promise: { ok:true, money?:number } để tiếp tục; { ok:false } nếu huỷ popup;
//         { ok:false, blocked:true, msg } nếu vi phạm điều kiện (hiển thị lỗi).
function askDeliveryCash(d) {
    var bill   = d.bill || d.Bill || {};
    var method = String(bill.paymentMethods || bill.PaymentMethods || '').toLowerCase();
    var paid   = String(bill.paymentStatus || bill.PaymentStatus || '').toLowerCase() === 'paid';
    var due    = Number(bill.total || bill.Total || 0) + Number(d.shippingFee || d.ShippingFee || 0);

    // Thẻ / chuyển khoản: bắt buộc đã thanh toán mới được giao.
    if (method !== 'cash') {
        if (!paid) return Promise.resolve({ ok: false, blocked: true, msg: 'Đơn thẻ/chuyển khoản chưa thanh toán — không thể xác nhận đã giao.' });
        return Promise.resolve({ ok: true });   // đã thanh toán online → không cần tiền mặt
    }

    // Tiền mặt: nhập số tiền khách đưa, phải đủ tổng cần thu (popup tự kiểm tra >= due).
    return cashModal(due).then(function (money) {
        if (money === null) return { ok: false };
        return { ok: true, money: money };
    });
}

// Bắt đầu giao đơn đang chờ: Pending → Đang giao (OnTheWay).
// Đơn rời panel "đang chờ giao" và xuống bảng lịch sử với dropdown đổi trạng thái.
// Việc thu tiền / xác nhận "Đã giao" làm sau ở bảng lịch sử (theo luật thanh toán).
function startDelivery(deliveryId) {
    var d = DELIVERIES.find(function (x) {
        return (x.deliveryID || x.DeliveryID) == deliveryId;
    });
    if (!d) return;

    // Đơn hẹn giờ: chặn bắt đầu giao khi chưa tới 15 phút trước giờ hẹn.
    var gate = deliveryStartGate(d);
    if (!gate.allowed) {
        toast('Đơn có hẹn giờ — chỉ được bắt đầu giao từ ' + fmtClock(gate.earliest)
            + ' (15 phút trước giờ hẹn).', 'error');
        return;
    }

    var noteEl = document.getElementById('del-note-' + deliveryId);
    var note   = noteEl ? noteEl.value.trim() : '';

    apiPut('/delivery/update/' + deliveryId, {
        Status: 'OnTheWay',
        Note: note,
        EmployeeID: localStorage.getItem('employeeId') || null,
        ChangeAt: new Date().toISOString()
    }).then(function (r) {
            if (!r.ok) return r.text().then(function (t) { throw new Error(t); });
            toast('Đơn ' + String(d.billID || d.BillID || '').slice(0, 8).toUpperCase() + ' chuyển sang Đang giao');
            renderDelivery();   // tải lại: đơn xuống bảng lịch sử với trạng thái "Đang giao"
        }).catch(function (err) {
            toast('Lỗi cập nhật đơn giao hàng: ' + (err.message || ''), 'error');
        });
}

// Đổi trạng thái giao hàng từ dropdown trong bảng (chỉ với đơn chưa kết thúc).
// Nhân viên giao = nhân viên đang đăng nhập; thời điểm = lúc bấm.
function changeDeliveryStatus(deliveryId, selectEl) {
    var newStatus = selectEl.value;
    var d = DELIVERIES.find(function (x) {
        return (x.deliveryID || x.DeliveryID) == deliveryId;
    });
    if (!d || !newStatus) return;

    var body = {
        Status: newStatus,
        EmployeeID: localStorage.getItem('employeeId') || null,
        Note: '',
        ChangeAt: new Date().toISOString()
    };

    function doUpdate() {
        selectEl.disabled = true;
        apiPut('/delivery/update/' + deliveryId, body).then(function (r) {
                if (!r.ok) return r.text().then(function (t) { throw new Error(t); });
                toast('Đã cập nhật trạng thái đơn ' + String(d.billID || d.BillID || '').slice(0, 8).toUpperCase()
                    + ' → ' + (DELIVERY_STATUS_LABEL[newStatus] || newStatus));
                renderDelivery();   // tải lại để cập nhật "Thay đổi lúc" & "Nhân viên giao" từ server
            }).catch(function (err) {
                selectEl.disabled = false;
                renderDeliveryLocal();   // trả dropdown về trạng thái hiện tại
                toast('Lỗi cập nhật trạng thái: ' + (err.message || ''), 'error');
            });
    }

    // Giao thành công: thẻ/CK phải đã thanh toán; tiền mặt phải nhập đủ tiền khách đưa.
    if (newStatus === 'Delivered') {
        askDeliveryCash(d).then(function (cash) {
            if (!cash.ok) {
                if (cash.blocked) toast(cash.msg, 'error');
                renderDeliveryLocal();   // trả dropdown về trạng thái cũ
                return;
            }
            if (cash.money !== undefined) body.MoneyReceived = cash.money;
            doUpdate();
        });
        return;
    }

    doUpdate();
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

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
    // db-avatar initials
    var avatarEl = document.getElementById('db-avatar');
    if (avatarEl) {
        var parts = (name || '').trim().split(' ');
        avatarEl.textContent = parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : (name || 'NV').slice(0, 2).toUpperCase();
    }
    // Fill employee name in hero
    var nameEl = document.getElementById('db-emp-name');
    if (nameEl) {
        var small = nameEl.querySelector('small');
        nameEl.textContent = name || 'Nhân viên';
        if (small) nameEl.appendChild(small);
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

// ── Dashboard state ─────────────────────────────────────────────────────────
var DB_SHIFT      = null;   // ShiftResponse from GET /shift/my-shift
var DB_TASKS      = [];     // ShiftTask[] from GET /shift/task/by-shift/{id}
var DB_WK_OFFSET  = 0;      // week offset for mini calendar (0 = this week)
var DB_WEEK_SHIFTS = [];    // ShiftResponse[] for the displayed week

function renderDashboard() {
    dbLoadMyShift();
    dbLoadWeekShifts();
    dbRenderHeroFromLocal();
    updateDashStats();
    renderDashOrders();
    renderDashIngredientWatch();
    loadInvoicesFromAPI(/*silent=*/true);
}

// Fill hero from localStorage shiftStatus (fast, available immediately at login)
function dbRenderHeroFromLocal() {
    var name = localStorage.getItem('fullName') || 'Nhân viên';
    var role = localStorage.getItem('role') || '';
    var nameEl = document.getElementById('db-emp-name');
    if (nameEl) {
        var roleLabel = role === 'admin' ? 'Quản lý' : 'Nhân viên';
        nameEl.innerHTML = name + '<small>' + roleLabel + '</small>';
    }
    var ss = localStorage.getItem('shiftStatus');
    if (!ss) return;
    try { ss = JSON.parse(ss); } catch (e) { return; }
    if (!ss.hasShift) return;
    dbFillHero(ss);
}

function dbFillHero(ss) {
    var fmt = function (d) {
        if (!d) return '--:--';
        var dt = new Date(d);
        return dt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
    };
    var timeEl = document.getElementById('db-shift-time');
    if (timeEl) timeEl.textContent = fmt(ss.timeIn || ss.TimeIn) + ' → ' + fmt(ss.timeOut || ss.TimeOut);

    // Worked / remaining
    var now = new Date();
    var inT = new Date(ss.checkIn || ss.CheckIn || ss.timeIn || ss.TimeIn);
    var outT = new Date(ss.timeOut || ss.TimeOut);
    var workedMs = Math.max(0, now - inT);
    var leftMs   = Math.max(0, outT - now);
    var fmtH = function (ms) {
        var h = Math.floor(ms / 3600000);
        var m = Math.floor((ms % 3600000) / 60000);
        return h + 'g' + (m < 10 ? '0' : '') + m + 'p';
    };
    var wEl = document.getElementById('db-worked');
    var lEl = document.getElementById('db-left');
    if (wEl) wEl.textContent = fmtH(workedMs);
    if (lEl) lEl.textContent = fmtH(leftMs);

    // Status badge
    var statusMap = {
        OnTime:     { label: 'Đúng giờ',    cls: 'ok' },
        Late:       { label: 'Đi trễ',      cls: 'late' },
        EarlyLeave: { label: 'Về sớm',      cls: 'late' },
        Absent:     { label: 'Vắng mặt',    cls: 'absent' },
        Completed:  { label: 'Đã hoàn thành', cls: 'ok' },
        Scheduled:  { label: 'Chưa check-in', cls: '' }
    };
    var st = ss.status || ss.Status || 'Scheduled';
    var info = statusMap[st] || { label: st, cls: '' };
    var stEl = document.getElementById('db-status');
    if (stEl) {
        stEl.innerHTML = '<span class="dot"></span>' + info.label;
        stEl.className = 'db-status ' + info.cls;
    }

    // Check-in / check-out tool buttons
    var cinEl  = document.getElementById('db-tool-in');
    var coutEl = document.getElementById('db-tool-out');
    if (cinEl) {
        if (ss.checkIn || ss.CheckIn) {
            cinEl.classList.add('done');
            cinEl.classList.remove('disabled');
            cinEl.querySelector('.tl').textContent = 'Đã check-in ' + fmt(ss.checkIn || ss.CheckIn);
        } else {
            cinEl.classList.remove('disabled', 'done');
            cinEl.querySelector('.tl').textContent = 'Check-in';
        }
    }
    if (coutEl) {
        if (ss.checkOut || ss.CheckOut) {
            coutEl.classList.add('done');
            coutEl.classList.remove('disabled');
            coutEl.querySelector('.tl').textContent = 'Đã check-out ' + fmt(ss.checkOut || ss.CheckOut);
        } else if (ss.checkIn || ss.CheckIn) {
            coutEl.classList.remove('disabled', 'done');
            coutEl.querySelector('.tl').textContent = 'Check-out';
        } else {
            coutEl.classList.add('disabled');
            coutEl.classList.remove('done');
            coutEl.querySelector('.tl').textContent = 'Check-out';
        }
    }
}

// Load today's shift from API then load tasks
function dbLoadMyShift() {
    apiGet('/shift/my-shift')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (sh) {
            DB_SHIFT = sh;
            if (!sh) {
                var timeEl = document.getElementById('db-shift-time');
                if (timeEl) timeEl.textContent = 'Chưa có ca hôm nay';
                dbRenderTasks([]);
                return;
            }
            // Merge into hero (overrides localStorage with fresh data)
            dbFillHero(sh);
            // Load tasks
            dbLoadTasks(sh.shiftID || sh.ShiftID);
        })
        .catch(function (e) { console.warn('[dbLoadMyShift]', e); });
}

function dbLoadWeekShifts() {
    var now = new Date();
    var dayOfWeek = now.getDay();
    var mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    var monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset + DB_WK_OFFSET * 7);
    var sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    var fmtDate = function (d) { return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }); };
    var start = fmtDate(monday);
    var end = fmtDate(sunday);
    apiGet('/shift/my-shifts?start=' + start + '&end=' + end)
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (shifts) {
            DB_WEEK_SHIFTS = Array.isArray(shifts) ? shifts : [];
            dbRenderMiniCal();
        })
        .catch(function () { DB_WEEK_SHIFTS = []; dbRenderMiniCal(); });
}

function dbLoadTasks(shiftID) {
    if (!shiftID) { dbRenderTasks([]); return; }
    apiGet('/shift/task/by-shift/' + shiftID)
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (tasks) {
            DB_TASKS = Array.isArray(tasks) ? tasks : [];
            dbRenderTasks(DB_TASKS);
        })
        .catch(function () { dbRenderTasks([]); });
}

function dbRenderTasks(tasks) {
    var list  = document.getElementById('db-tlist');
    var pct   = document.getElementById('db-t-pct');
    var bar   = document.getElementById('db-t-bar');
    if (!list) return;
    if (!tasks.length) {
        list.innerHTML = '<div class="db-no-task">Không có nhiệm vụ nào trong ca này.</div>';
        if (pct) pct.textContent = '0%';
        if (bar) bar.style.width = '0%';
        return;
    }
    var done = tasks.filter(function (t) { return t.isCompleted || t.IsCompleted; }).length;
    var ratio = Math.round((done / tasks.length) * 100);
    if (pct) pct.textContent = ratio + '%';
    if (bar) bar.style.width = ratio + '%';
    list.innerHTML = tasks.map(function (t) {
        var tid     = t.taskID || t.TaskID;
        var title   = t.title || t.Title || '';
        var isDone  = !!(t.isCompleted || t.IsCompleted);
        var doneAt  = t.completedAt || t.CompletedAt;
        var doneBy  = t.completedByName || '';
        var sub     = isDone
            ? ('Xong ' + (doneAt ? new Date(doneAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '') + (doneBy ? ' · ' + doneBy : ''))
            : '';
        return '<div class="db-trow' + (isDone ? ' done' : '') + '">'
            + '<div class="db-chk" onclick="dbCompleteTask(\'' + tid + '\')">'
            + (isDone ? '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>' : '')
            + '</div>'
            + '<div class="db-tx"><span>' + title + '</span>'
            + (sub ? '<small>' + sub + '</small>' : '') + '</div>'
            + '</div>';
    }).join('');
}

function dbCompleteTask(taskID) {
    var task = DB_TASKS.find(function (t) { return (t.taskID || t.TaskID) === taskID; });
    if (!task || task.isCompleted || task.IsCompleted) return;
    apiFetch('PATCH', '/shift/task/' + taskID + '/complete')
        .then(function (r) {
            if (r.ok) {
                task.isCompleted = true;
                task.completedAt = new Date().toISOString();
                dbRenderTasks(DB_TASKS);
                toast('Đã đánh dấu hoàn thành!', 'success');
            } else {
                toast('Không thể cập nhật nhiệm vụ.', 'error');
            }
        })
        .catch(function () { toast('Lỗi mạng khi cập nhật.', 'error'); });
}

// Mini calendar (week view, shows today's shift block)
function dbRenderMiniCal() {
    var now = new Date();
    var dayOfWeek = now.getDay(); // 0=Sun
    var mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    var monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset + DB_WK_OFFSET * 7);

    var days  = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    var dates = [];
    for (var i = 0; i < 7; i++) {
        var d = new Date(monday);
        d.setDate(monday.getDate() + i);
        dates.push(d);
    }

    // Header
    var head = document.getElementById('db-mcal-head');
    if (head) {
        head.innerHTML = '<div class="hr" style="border-right:1px solid #F3EEE8"></div>'
            + days.map(function (dy, i) {
                var dt = dates[i];
                var isToday = dt.toDateString() === now.toDateString();
                return '<div class="hc' + (isToday ? ' today' : '') + '"><span>' + dy + '</span><strong>' + dt.getDate() + '</strong></div>';
            }).join('');
    }

    // Week label
    var lbl = document.getElementById('db-wk-label');
    if (lbl) {
        if (DB_WK_OFFSET === 0) lbl.textContent = 'Tuần này';
        else if (DB_WK_OFFSET === -1) lbl.textContent = 'Tuần trước';
        else if (DB_WK_OFFSET === 1) lbl.textContent = 'Tuần sau';
        else {
            lbl.textContent = dates[0].getDate() + '/' + (dates[0].getMonth() + 1) + ' – '
                + dates[6].getDate() + '/' + (dates[6].getMonth() + 1);
        }
    }

    // Body: 3 shift rows
    var body = document.getElementById('db-mcal-body');
    if (!body) return;
    var shiftDefs = [
        { key: 'sang',  label: 'Ca sáng',  start: 6,  end: 14 },
        { key: 'chieu', label: 'Ca chiều', start: 14, end: 22 },
        { key: 'dem',   label: 'Ca đêm',   start: 22, end: 30 }
    ];
    var todayStr = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });

    body.innerHTML = shiftDefs.map(function (sd) {
        var cells = dates.map(function (dt) {
            var dtStr = dt.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
            var matchShift = DB_WEEK_SHIFTS.find(function (s) {
                var sDate = new Date(s.timeIn || s.TimeIn);
                var sDateStr = sDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' });
                var sHour = sDate.getHours();
                var sKey = sHour >= 6 && sHour < 14 ? 'sang' : sHour >= 14 && sHour < 22 ? 'chieu' : sHour >= 22 ? 'dem' : null;
                return sDateStr === dtStr && sKey === sd.key;
            });
            var cls = matchShift ? ' my' : '';
            if (matchShift) {
                var st = matchShift.status || matchShift.Status || '';
                if (st === 'Late') cls += ' late';
                else if (st === 'Absent') cls += ' absent';
                else if (st === 'OnTime' || st === 'Completed') cls += ' ok';
            }
            return '<div class="db-mblk' + cls + '">' + (matchShift ? '<span></span>' : '') + '</div>';
        }).join('');
        return '<div class="db-mrow"><div class="db-mlab">' + sd.label + '</div>' + cells + '</div>';
    }).join('');
}

function dbWkShift(delta) {
    DB_WK_OFFSET += delta;
    dbLoadWeekShifts();
}

function updateDashStats() {
    var count   = INVOICES.length;
    var revenue = INVOICES.reduce(function (s, inv) { return s + inv.total; }, 0);
    var countEl   = document.getElementById('db-bill-count');
    var revenueEl = document.getElementById('db-revenue');
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
var PROC_LINES       = []; // {id, batchIdx, take, outIngID, outQty, mfd, exp}
var PROC_ROW_SEQ     = 0;
var _procNF          = new Intl.NumberFormat('vi-VN');

function renderProcessing() {
    PROC_LINES = [];
    var box = document.getElementById('proc-items');
    if (box) box.innerHTML = '';

    // Số phiếu
    var tn = document.getElementById('proc-ticket-no');
    if (tn) {
        var n = new Date(), p2 = function(x){return String(x).padStart(2,'0');};
        tn.textContent = 'SC-' + n.getFullYear() + p2(n.getMonth()+1) + p2(n.getDate()) + '-001';
    }
    // Tên nhân viên
    var en = document.getElementById('proc-emp-name');
    if (en) en.value = localStorage.getItem('employeeName') || localStorage.getItem('fullName') || '';

    // Load tất cả nguyên liệu (không lọc Unit)
    apiGet('/ingredient/get-all')
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (d) { PROC_INGREDIENTS = pAsArray(d); })
        .catch(function () { PROC_INGREDIENTS = []; });

    loadProcWarehouses();
    loadProcessingHistory();
    recalcProc();
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
                        return '<option value="' + w.warehouseID + '">Kho #' + w.warehouseID
                            + ' (sức chứa ' + _procNF.format(w.capacity) + ')</option>';
                      }).join('')
                    : '<option value="">-- Không có kho --</option>';
            }
            loadRawBatches();
        })
        .catch(function () { if (sel) sel.innerHTML = '<option value="">-- Lỗi tải kho --</option>'; });
}

function loadRawBatches() {
    var body = document.getElementById('proc-batch-body');
    if (body) body.innerHTML = '<div style="text-align:center;padding:24px;color:#A39A91;font-size:13px">Đang tải…</div>';
    apiGet('/inventorybatch/available-raw')
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (d) {
            var all   = pAsArray(d);
            var whIds = PROC_WAREHOUSES.map(function (w) { return w.warehouseID; });
            PROC_RAW_BATCHES = all.filter(function (b) {
                var wh = b.warehouseID || (b.warehouse && b.warehouse.warehouseID);
                return whIds.length ? whIds.indexOf(wh) >= 0 : true;
            });
            renderProcBatches();
        })
        .catch(function () {
            var body = document.getElementById('proc-batch-body');
            if (body) body.innerHTML = '<div style="text-align:center;padding:24px;color:#DC2626;font-size:13px">Lỗi tải dữ liệu</div>';
        });
}

function renderProcBatches() {
    var q = ((document.getElementById('proc-batch-search') || {}).value || '').toLowerCase().trim();
    var filtered = PROC_RAW_BATCHES.filter(function (b) {
        if (!q) return true;
        var code = (b.batchCode || '').toLowerCase();
        var mat  = b.ingredient ? (b.ingredient.ingredientName || '').toLowerCase() : '';
        return code.indexOf(q) >= 0 || mat.indexOf(q) >= 0;
    });
    var cnt = document.getElementById('proc-batch-count');
    if (cnt) cnt.textContent = filtered.length + ' batch';
    var body = document.getElementById('proc-batch-body');
    if (!body) return;
    if (!filtered.length) {
        body.innerHTML = '<div style="text-align:center;padding:24px;color:#A39A91;font-size:13px">Không tìm thấy batch nào.</div>';
        return;
    }
    var now = new Date();
    body.innerHTML = filtered.map(function (b) {
        var idx  = PROC_RAW_BATCHES.indexOf(b);
        var ing  = b.ingredient || {};
        var unit = ing.ingredientUnit || '';
        var pu   = unit === 'Gram' ? 'kg' : (unit === 'Liter' ? 'L' : unit);
        var expStr = b.exp || '';
        var expBadge = '', expColor = '#5A514A';
        if (expStr) {
            var days = Math.round((new Date(expStr) - now) / 86400000);
            if (days <= 7)  { expBadge = '<span class="proc-tag err">' + days + 'n</span>'; expColor = '#DC2626'; }
            else if (days <= 15) { expBadge = '<span class="proc-tag warn">' + days + 'n</span>'; expColor = '#B45309'; }
        }
        return '<div class="proc-bc" onclick="addProcessingRow(' + idx + ')">'
            + '<div class="proc-bc-top">'
            +   '<span class="proc-bc-code">' + (b.batchCode || String(b.batchID).slice(0,8)) + '</span>'
            +   '<button class="proc-bc-btn" onclick="event.stopPropagation();addProcessingRow(' + idx + ')">+ Chọn</button>'
            + '</div>'
            + '<div class="proc-bc-meta">'
            +   '<span class="mat">' + (ing.ingredientName || '#' + b.ingredientID) + '</span>'
            +   '<span class="sep">·</span>'
            +   '<span class="num">' + _procNF.format(b.quantityOnHand) + ' <span style="color:#A39A91;font-weight:500">' + unit + '</span></span>'
            +   '<span class="sep">·</span>'
            +   '<span>' + _procNF.format(b.unitCost) + 'đ<span style="color:#A39A91;font-weight:500">/' + pu + '</span></span>'
            +   '<span class="sep">·</span>'
            +   '<span class="proc-bc-hsd" style="color:' + expColor + '">HSD ' + expStr + ' ' + expBadge + '</span>'
            + '</div>'
            + '</div>';
    }).join('');
}

function addProcessingRow(preIdx) {
    if (!PROC_RAW_BATCHES.length) { toast('Chưa có batch thô để sơ chế', 'error'); return; }
    var id      = ++PROC_ROW_SEQ;
    var bIdx    = (preIdx !== undefined && preIdx !== null) ? +preIdx : 0;
    var today   = todayVN();
    var expD    = new Date(); expD.setDate(expD.getDate() + 7);
    var expDef  = expD.toLocaleDateString('sv-SE');
    var autoIngID = String((PROC_RAW_BATCHES[bIdx] || {}).ingredientID || '');
    PROC_LINES.push({ id: id, batchIdx: bIdx, take: '', outIngID: autoIngID, outQty: '', mfd: today, exp: expDef });
    renderProcLines();
    recalcProc();
}

function removeProcLine(id) {
    PROC_LINES = PROC_LINES.filter(function (l) { return l.id !== id; });
    renderProcLines();
    recalcProc();
}

function onProcField(id, key, val) {
    var l = null;
    for (var i = 0; i < PROC_LINES.length; i++) { if (PROC_LINES[i].id === id) { l = PROC_LINES[i]; break; } }
    if (!l) return;
    l[key] = (key === 'batchIdx') ? +val : val;
    if (key === 'batchIdx') {
        var b = PROC_RAW_BATCHES[l.batchIdx] || {};
        l.outIngID = String(b.ingredientID || '');
        renderProcLines();
    }
    updateProcCalc(id);
    recalcProc();
}

function renderProcLines() {
    var box = document.getElementById('proc-items');
    if (!box) return;
    if (!PROC_LINES.length) {
        box.innerHTML = '<div class="proc-empty">Chưa có dòng nào. Bấm <strong>Thêm dòng</strong> hoặc nhấn <strong>Chọn</strong> một batch bên phải.</div>';
        return;
    }
    var ingOpts = PROC_INGREDIENTS.length
        ? '<option value="">-- Chọn thành phẩm --</option>'
          + PROC_INGREDIENTS.map(function (i) {
              return '<option value="' + i.ingredientID + '">' + (i.ingredientName||'') + ' (' + (i.ingredientUnit||'') + ')</option>';
            }).join('')
        : '<option value="">-- Đang tải nguyên liệu --</option>';

    box.innerHTML = PROC_LINES.map(function (l, idx) {
        var b    = PROC_RAW_BATCHES[l.batchIdx] || PROC_RAW_BATCHES[0] || {};
        var unit = (b.ingredient || {}).ingredientUnit || '';
        var rawOpts = PROC_RAW_BATCHES.map(function (rb, ri) {
            var ri_ing = rb.ingredient || {};
            return '<option value="' + ri + '"' + (ri === l.batchIdx ? ' selected' : '') + '>'
                + (rb.batchCode || String(rb.batchID).slice(0,8))
                + ' — ' + (ri_ing.ingredientName||'')
                + ' (còn ' + _procNF.format(rb.quantityOnHand) + ' ' + (ri_ing.ingredientUnit||'') + ')'
                + '</option>';
        }).join('');
        var selIngOpts = ingOpts.replace('value="' + l.outIngID + '"', 'value="' + l.outIngID + '" selected');
        return '<div class="proc-line" id="proc-line-' + l.id + '">'
            + '<span class="proc-line-no">Dòng ' + (idx+1) + '</span>'
            + '<button class="proc-line-del" onclick="removeProcLine(' + l.id + ')" title="Xóa">'
            +   '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2" width="14" height="14"><path d="M18 6 6 18M6 6l12 12"/></svg>'
            + '</button>'
            + '<div class="proc-line-grid">'
            +   '<div class="full"><span class="proc-mini-label">Batch thô đầu vào</span>'
            +     '<select onchange="onProcField(' + l.id + ',\'batchIdx\',this.value)">' + rawOpts + '</select></div>'
            +   '<div><span class="proc-mini-label">KL lấy ra</span>'
            +     '<div class="proc-with-unit">'
            +       '<input type="number" min="0" step="any" placeholder="0" value="' + (l.take||'') + '"'
            +       ' oninput="onProcField(' + l.id + ',\'take\',this.value)">'
            +       '<span class="unit-badge">' + unit + '</span>'
            +     '</div></div>'
            +   '<div><span class="proc-mini-label">KL thành phẩm</span>'
            +     '<div class="proc-with-unit">'
            +       '<input type="number" min="0" step="any" placeholder="0" value="' + (l.outQty||'') + '"'
            +       ' oninput="onProcField(' + l.id + ',\'outQty\',this.value)">'
            +       '<span class="unit-badge">' + unit + '</span>'
            +     '</div></div>'
            +   '<div class="full"><span class="proc-mini-label">Thành phẩm đầu ra <span style="color:var(--primary)">*</span></span>'
            +     '<select onchange="onProcField(' + l.id + ',\'outIngID\',this.value)">' + selIngOpts + '</select></div>'
            +   '<div><span class="proc-mini-label">NSX</span>'
            +     '<input type="date" value="' + l.mfd + '" oninput="onProcField(' + l.id + ',\'mfd\',this.value)"></div>'
            +   '<div><span class="proc-mini-label">HSD</span>'
            +     '<input type="date" value="' + l.exp + '" oninput="onProcField(' + l.id + ',\'exp\',this.value)"></div>'
            + '</div>'
            + '<div class="proc-chips" id="proc-chips-' + l.id + '"></div>'
            + '</div>';
    }).join('');

    for (var k = 0; k < PROC_LINES.length; k++) updateProcCalc(PROC_LINES[k].id);
}

function updateProcCalc(id) {
    var box = document.getElementById('proc-chips-' + id); if (!box) return;
    var l = null;
    for (var i = 0; i < PROC_LINES.length; i++) { if (PROC_LINES[i].id === id) { l = PROC_LINES[i]; break; } }
    if (!l) return;
    var b    = PROC_RAW_BATCHES[l.batchIdx] || {};
    var ing  = b.ingredient || {};
    var unit = ing.ingredientUnit || '';
    var take = parseFloat(l.take) || 0, out = parseFloat(l.outQty) || 0;
    var mult = unit === 'Gram' ? 1/1000 : 1; // đơn giá theo kg/L
    var cost = Math.round(take * mult * (b.unitCost || 0));
    var chips = '<span class="proc-chip cost">🔥 Chi phí: ' + _procNF.format(cost) + 'đ</span>';
    if (take > 0 && take > (b.quantityOnHand || 0)) {
        chips += '<span class="proc-chip err">⚠ Vượt tồn kho (' + _procNF.format(b.quantityOnHand) + ' ' + unit + ')</span>';
    }
    if (take > 0 && out > 0) {
        if (out > take) {
            chips += '<span class="proc-chip err">⚠ KL thành phẩm > KL lấy ra</span>';
        } else {
            var loss = take - out, pct = loss / take * 100;
            chips += '<span class="proc-chip ' + (pct <= 10 ? 'ok' : 'warn') + '">♻ Hao hụt: '
                + _procNF.format(Math.round(loss)) + ' ' + unit + ' (' + pct.toFixed(1) + '%)</span>';
        }
    }
    box.innerHTML = chips;
}

function recalcProc() {
    var totalCost = 0, lossSum = 0, lossN = 0;
    for (var i = 0; i < PROC_LINES.length; i++) {
        var l    = PROC_LINES[i];
        var b    = PROC_RAW_BATCHES[l.batchIdx] || {};
        var unit = (b.ingredient || {}).ingredientUnit || '';
        var take = parseFloat(l.take) || 0, out = parseFloat(l.outQty) || 0;
        totalCost += take * (unit === 'Gram' ? 1/1000 : 1) * (b.unitCost || 0);
        if (take > 0 && out > 0 && out <= take) { lossSum += (take - out) / take * 100; lossN++; }
    }
    var el = document.getElementById('ps-lines');  if (el) el.textContent = PROC_LINES.length;
    var el2 = document.getElementById('ps-loss');
    if (el2) el2.innerHTML = (lossN ? (lossSum / lossN).toFixed(1) : '0') + '<small>%</small>';
    var el3 = document.getElementById('ps-cost');
    if (el3) el3.innerHTML = _procNF.format(Math.round(totalCost)) + '<small>đ</small>';

    var btn = document.getElementById('proc-submit-btn');
    if (!btn) return;
    var ok = PROC_LINES.length > 0;
    if (ok) {
        for (var j = 0; j < PROC_LINES.length; j++) {
            var lj = PROC_LINES[j], bj = PROC_RAW_BATCHES[lj.batchIdx] || {};
            var tj = parseFloat(lj.take) || 0, oj = parseFloat(lj.outQty) || 0;
            var maxQty = bj.quantityOnHand || 0;
            if (tj <= 0 || oj <= 0 || oj > tj || (maxQty > 0 && tj > maxQty) || !lj.mfd || !lj.exp) { ok = false; break; }
        }
    }
    btn.disabled = !ok;
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
            if (!list.length) { tb.innerHTML = '<tr><td colspan="4" class="tbl-empty">Chưa có dữ liệu</td></tr>'; return; }
            tb.innerHTML = list.map(function (p) {
                return '<tr>'
                    + '<td><strong style="color:var(--primary)">' + String(p.processingID).slice(0,8) + '…</strong></td>'
                    + '<td>' + ((p.employee && p.employee.fullName) || '—') + '</td>'
                    + '<td>' + pDateTime(p.processedAt) + '</td>'
                    + '<td>' + (p.note || '—') + '</td>'
                    + '</tr>';
            }).join('');
        })
        .catch(function () { if (tb) tb.innerHTML = '<tr><td colspan="4" class="tbl-empty">Lỗi tải dữ liệu</td></tr>'; });
}

function submitProcessing() {
    var whSel = document.getElementById('proc-warehouse');
    var warehouseID = parseInt(whSel && whSel.value, 10);
    if (!warehouseID) { toast('Vui lòng chọn kho', 'error'); return; }
    if (!PROC_LINES.length) { toast('Thêm ít nhất 1 dòng sơ chế', 'error'); return; }

    var items = [], valid = true;
    for (var i = 0; i < PROC_LINES.length; i++) {
        var l  = PROC_LINES[i];
        var b  = PROC_RAW_BATCHES[l.batchIdx] || {};
        var tk = parseFloat(l.take), oq = parseFloat(l.outQty);
        if (!b.batchID || !tk || !l.outIngID || !oq || !l.mfd || !l.exp) { valid = false; break; }
        items.push({
            SourceBatchID:      b.batchID,
            InputKg:            tk,
            OutputIngredientID: parseInt(l.outIngID, 10),
            OutputPieces:       Math.round(oq),
            BagCount:           0,
            PiecesPerBag:       0,
            Mfd:                l.mfd,
            Exp:                l.exp,
            WasteNote:          null
        });
    }
    if (!valid) { toast('Điền đầy đủ các trường bắt buộc', 'error'); return; }

    var btn = document.getElementById('proc-submit-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Đang tạo…'; }

    apiPost('/processing/create', {
        EmployeeID:  localStorage.getItem('employeeId'),
        WarehouseID: warehouseID,
        Note:        (document.getElementById('proc-note') || {}).value || null,
        Items:       items
    })
    .then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error(t || ('HTTP ' + r.status)); });
        return r.json();
    })
    .then(function () {
        toast('Tạo phiếu sơ chế thành công!', 'success');
        PROC_LINES = [];
        renderProcLines();
        var n = document.getElementById('proc-note'); if (n) n.value = '';
        recalcProc();
        loadRawBatches();
        loadProcessingHistory();
    })
    .catch(function (e) {
        toast('Lỗi tạo phiếu: ' + (e.message || ''), 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" width="17" height="17"><path d="M20 6 9 17l-5-5"/></svg> Tạo phiếu sơ chế';
        }
    });
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

function doCheckIn() {
    var ss = null;
    try { ss = JSON.parse(localStorage.getItem('shiftStatus') || 'null'); } catch (e) {}
    if (!ss || !ss.hasShift) {
        toast('Bạn không có ca làm việc hôm nay.', 'error'); return;
    }
    if (ss.checkIn || ss.CheckIn) {
        var t = new Date(ss.checkIn || ss.CheckIn);
        toast('Bạn đã check-in lúc ' + t.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }), 'success'); return;
    }
    var now = new Date();
    ss.checkIn = now.toISOString();
    localStorage.setItem('shiftStatus', JSON.stringify(ss));
    dbFillHero(ss);
    toast('Check-in thành công lúc ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }), 'success');
}

function doCheckOut() {
    var ss = null;
    try { ss = JSON.parse(localStorage.getItem('shiftStatus') || 'null'); } catch (e) {}
    if (!ss || !ss.hasShift) {
        toast('Bạn không có ca làm việc hôm nay.', 'error'); return;
    }
    if (!(ss.checkIn || ss.CheckIn)) {
        toast('Bạn chưa check-in!', 'error'); return;
    }
    if (ss.checkOut || ss.CheckOut) {
        var t = new Date(ss.checkOut || ss.CheckOut);
        toast('Bạn đã check-out lúc ' + t.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }), 'success'); return;
    }
    var now = new Date();
    ss.checkOut = now.toISOString();
    localStorage.setItem('shiftStatus', JSON.stringify(ss));
    dbFillHero(ss);
    toast('Check-out thành công lúc ' + now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false }), 'success');
}

function dashRequestLeave() {
    var modal = document.getElementById('leave-modal');
    var today = new Date().toISOString().slice(0, 10);
    document.getElementById('leave-date').value = today;
    document.getElementById('leave-date').min = today;
    document.getElementById('leave-reason').value = '';
    modal.style.display = 'flex';
}

function closeLeaveModal() {
    document.getElementById('leave-modal').style.display = 'none';
}

function submitLeaveRequest() {
    var leaveDate = document.getElementById('leave-date').value;
    var reason = document.getElementById('leave-reason').value.trim();
    if (!leaveDate) { toast('Vui lòng chọn ngày xin nghỉ.', 'error'); return; }
    if (!reason) { toast('Vui lòng nhập lý do xin nghỉ.', 'error'); return; }
    apiPost('/leaveRequest/create', { leaveDate: leaveDate, reason: reason })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
            if (res.ok) {
                closeLeaveModal();
                toast('Đã gửi đơn xin nghỉ thành công!', 'success');
            } else {
                toast(res.d.message || 'Gửi đơn thất bại.', 'error');
            }
        })
        .catch(function () { toast('Lỗi kết nối, vui lòng thử lại.', 'error'); });
}

function dashContactManager() {
    var storeId = localStorage.getItem('storeId');
    if (!storeId) { toast('Vui lòng liên hệ trực tiếp quản lý ca của bạn.', 'success'); return; }
    apiGet('/employee/get-by-store/' + storeId)
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (emps) {
            var mgr = (emps || []).find(function (e) {
                var r2 = (e.role || e.Role || '').toLowerCase();
                return r2 === 'manager' || r2 === 'admin';
            });
            if (mgr) {
                var name = mgr.fullName || mgr.FullName || mgr.userName || mgr.UserName || '?';
                var phone = mgr.phone || mgr.Phone || '';
                toast('Quản lý: ' + name + (phone ? ' · ' + phone : ''), 'success');
            } else {
                toast('Vui lòng liên hệ trực tiếp quản lý ca của bạn.', 'success');
            }
        })
        .catch(function () { toast('Vui lòng liên hệ trực tiếp quản lý ca của bạn.', 'success'); });
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
            + '<td><input type="number" id="rl-qty-' + i + '" value="' + qtyExpected + '" step="0.1" min="0" oninput="updateWhReceiptTotals();syncGoodQty(' + i + ')" style="width:100px;padding:6px;border:1px solid var(--border);border-radius:4px;"></td>'
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

function syncGoodQty(i) {
    var qty = parseFloat(document.getElementById('rl-qty-' + i).value) || 0;
    var gqEl = document.getElementById('rl-gq-' + i);
    if (gqEl && parseFloat(gqEl.value) > qty) gqEl.value = qty;
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
            var confirmedId = WH_RECEIPT_ID;
            WH_PO_DATA = null;
            // Hiện màn hình thành công với nút in
            var formEl    = document.getElementById('wh-step-3-form');
            var successEl = document.getElementById('wh-step-3-success');
            var printBtn  = document.getElementById('wh-print-btn');
            if (formEl)    formEl.style.display    = 'none';
            if (successEl) successEl.style.display = 'block';
            if (printBtn && confirmedId) printBtn.onclick = function () { printReceipt(confirmedId); };
            WH_RECEIPT_ID = null;
            loadOrderedPOs();
            renderWhHistory();
        }).catch(function (err) { toast(err.message || 'Lỗi xác nhận nhập kho!', 'error'); });
}

function whBackToStep1() {
    var formEl    = document.getElementById('wh-step-3-form');
    var successEl = document.getElementById('wh-step-3-success');
    if (formEl)    formEl.style.display    = 'block';
    if (successEl) successEl.style.display = 'none';
    whGoStep(1);
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
        tbody.innerHTML = '<tr><td colspan="6" class="tbl-empty">Chưa có phiếu nhập</td></tr>';
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
        var idStr  = String(id);
        var printBtn = status === 'Confirmed'
            ? '<button class="btn btn-sm" style="margin-left:4px;background:#047857;color:#fff;border:none" onclick="printReceipt(\'' + idStr + '\')" title="In phiếu"><i class="ti-printer"></i></button>'
            : '';
        return '<tr>'
            + '<td style="color:var(--primary);font-weight:700;font-size:12px">' + idStr.slice(0, 12) + '...</td>'
            + '<td style="font-size:12px;color:var(--muted)">' + String(poId).slice(0, 12) + '...</td>'
            + '<td>' + emp + '</td>'
            + '<td style="font-size:12px;color:var(--muted)">' + String(date).slice(0, 10) + '</td>'
            + '<td><span class="badge ' + badgeCls + '">' + statusText + '</span></td>'
            + '<td style="white-space:nowrap">'
            +   '<button class="btn btn-sm" onclick="viewReceiptDetail(\'' + idStr + '\')" title="Xem chi tiết"><i class="ti-eye"></i> Chi tiết</button>'
            +   printBtn
            + '</td>'
            + '</tr>';
    }).join('');
}

function viewReceiptDetail(receiptId) {
    var modal = document.getElementById('receipt-detail-modal');
    var body  = document.getElementById('receipt-detail-body');
    if (!modal || !body) return;
    body.innerHTML = '<div style="text-align:center;padding:24px;color:#A39A91">Đang tải...</div>';
    modal.style.display = 'flex';
    apiGet('/receipt/getid/' + receiptId)
        .then(function (r) { return r.ok ? r.json() : Promise.reject('Không tìm thấy phiếu'); })
        .then(function (d) {
            var id  = d.ReceiptID || d.receiptID || receiptId;
            var emp = (d.Employee && (d.Employee.FullName || d.Employee.fullName)) || '—';
            var date = (d.DateReceive || d.dateReceive || '—').toString().slice(0, 10);
            var confirmedAt = d.ConfirmedAt || d.confirmedAt;
            var status = d.Status || d.status || (confirmedAt ? 'Confirmed' : 'Pending');
            var statusText = status === 'Confirmed' ? 'Đã xác nhận' : 'Chờ xác nhận';
            var badgeCls   = status === 'Confirmed' ? 'badge-green' : 'badge-yellow';
            var lines  = d.ReceiptDetail || d.receiptDetail || d.Details || d.details || [];
            var linesHtml = lines.length ? lines.map(function (l) {
                var ingName = (l.Ingredient && (l.Ingredient.IngredientName || l.Ingredient.ingredientName)) || l.IngredientName || l.ingredientName || '—';
                var qtyExp  = l.QuantityExpected || l.quantityExpected || 0;
                var qtyAct  = l.QuantityActual   || l.quantityActual   || 0;
                var qtyGood = l.GoodQuantity      || l.goodQuantity     || 0;
                var unitPrice = l.UnitPrice || l.unitPrice || 0;
                return '<tr>'
                    + '<td>' + ingName + '</td>'
                    + '<td style="text-align:right">' + Number(qtyExp).toLocaleString('vi-VN') + '</td>'
                    + '<td style="text-align:right">' + Number(qtyAct).toLocaleString('vi-VN') + '</td>'
                    + '<td style="text-align:right">' + Number(qtyGood).toLocaleString('vi-VN') + '</td>'
                    + '<td style="text-align:right">' + Number(unitPrice).toLocaleString('vi-VN') + 'đ</td>'
                    + '</tr>';
            }).join('') : '<tr><td colspan="5" class="tbl-empty">Không có chi tiết</td></tr>';

            body.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;font-size:13px">'
                + '<div><span style="color:#A39A91;font-weight:600">Mã phiếu</span><br><strong style="color:var(--primary);word-break:break-all">' + id + '</strong></div>'
                + '<div><span style="color:#A39A91;font-weight:600">Trạng thái</span><br><span class="badge ' + badgeCls + '">' + statusText + '</span></div>'
                + '<div><span style="color:#A39A91;font-weight:600">Người nhận</span><br><strong>' + emp + '</strong></div>'
                + '<div><span style="color:#A39A91;font-weight:600">Ngày nhận</span><br><strong>' + date + '</strong></div>'
                + '</div>'
                + '<div class="tbl-wrap"><table><thead><tr>'
                + '<th>Nguyên liệu</th><th style="text-align:right">SL yêu cầu</th><th style="text-align:right">SL thực nhận</th><th style="text-align:right">SL tốt</th><th style="text-align:right">Đơn giá</th>'
                + '</tr></thead><tbody>' + linesHtml + '</tbody></table></div>';

            var printBtnEl = document.getElementById('receipt-detail-print-btn');
            if (printBtnEl) {
                if (status === 'Confirmed') {
                    printBtnEl.style.display = 'inline-flex';
                    printBtnEl.onclick = function () { printReceipt(id); };
                } else {
                    printBtnEl.style.display = 'none';
                }
            }
        })
        .catch(function (e) {
            body.innerHTML = '<div style="color:#DC2626;padding:16px">Lỗi tải chi tiết: ' + (e.message || e) + '</div>';
        });
}

function closeReceiptDetailModal() {
    var modal = document.getElementById('receipt-detail-modal');
    if (modal) modal.style.display = 'none';
}

function _docTienVND(n) {
    if (!n || n === 0) return 'Không đồng.';
    var d = ['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
    function g3(num, lead) {
        var h=Math.floor(num/100),t=Math.floor((num%100)/10),u=num%10,s='';
        if(lead||h){s+=d[h]+' trăm';if(!t&&u)s+=' lẻ';}
        if(t>1){s+=' '+d[t]+' mươi';if(u===1)s+=' mốt';else if(u===5)s+=' lăm';else if(u)s+=' '+d[u];}
        else if(t===1){s+=' mười';if(u===5)s+=' lăm';else if(u)s+=' '+d[u];}
        else if(u)s+=' '+d[u];
        return s.trim();
    }
    var units=['', ' nghìn', ' triệu', ' tỷ'];
    var groups=[],tmp=n;
    while(tmp>0){groups.unshift(tmp%1000);tmp=Math.floor(tmp/1000);}
    var res='';
    for(var i=0;i<groups.length;i++){if(groups[i])res+=g3(groups[i],i>0)+units[groups.length-1-i]+' ';}
    res=res.trim().replace(/\s+/g,' ')+' đồng.';
    return res.charAt(0).toUpperCase()+res.slice(1);
}

function printReceipt(receiptId) {
    apiGet('/receipt/getid/' + receiptId)
        .then(function (r) { return r.ok ? r.json() : Promise.reject('Không tìm thấy phiếu'); })
        .then(function (d) {
            var id       = d.ReceiptID || d.receiptID || receiptId;
            var emp      = (d.Employee && (d.Employee.FullName || d.Employee.fullName)) || '—';
            var supp     = (d.Supplier && (d.Supplier.SupplierName || d.Supplier.supplierName))
                        || (d.supplier && (d.supplier.supplierName || d.supplier.SupplierName)) || '—';
            var store    = (d.Store && (d.Store.StoreName || d.Store.storeName))
                        || (d.store && (d.store.storeName || d.store.StoreName)) || 'Chônlibi';
            var dateRaw  = (d.DateReceive || d.dateReceive || '').toString().slice(0, 10);
            var day      = dateRaw.slice(8, 10) || '.....';
            var mon      = dateRaw.slice(5, 7)  || '.....';
            var yr       = dateRaw.slice(0, 4)  || '20.....';
            var lines    = d.ReceiptDetail || d.receiptDetail || d.Details || d.details || [];
            var tong     = lines.reduce(function (s, l) {
                return s + (l.GoodQuantity || l.goodQuantity || 0) * (l.UnitPrice || l.unitPrice || 0);
            }, 0);
            var rowsHtml = lines.map(function (l, i) {
                var ing      = l.Ingredient || l.ingredient || {};
                var ingName  = ing.ingredientName || ing.IngredientName || l.IngredientName || l.ingredientName || '—';
                var unit     = ing.ingredientUnit || ing.IngredientUnit || l.IngredientUnit || l.ingredientUnit || '';
                var maSo     = (l.IngredientID || l.ingredientID || '').toString().slice(0,6).toUpperCase() || ('NL' + String(i+1).padStart(2,'0'));
                var qtyExp   = l.QuantityExpected || l.quantityExpected || 0;
                var qtyGood  = l.GoodQuantity     || l.goodQuantity     || 0;
                var unitPrice = l.UnitPrice        || l.unitPrice        || 0;
                var sub      = Number(qtyGood) * Number(unitPrice);
                return '<tr><td class="c">' + (i+1) + '</td><td>' + ingName + '</td>'
                    + '<td class="c">' + maSo + '</td>'
                    + '<td class="c">' + unit + '</td>'
                    + '<td class="r">' + Number(qtyExp).toLocaleString('vi-VN')   + '</td>'
                    + '<td class="r">' + Number(qtyGood).toLocaleString('vi-VN')  + '</td>'
                    + '<td class="r">' + Number(unitPrice).toLocaleString('vi-VN') + '</td>'
                    + '<td class="r">' + sub.toLocaleString('vi-VN') + '</td></tr>';
            }).join('');
            for (var k = 0; k < 3; k++) rowsHtml += '<tr class="empty"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
            var html = '<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8">'
                + '<title>Phiếu Nhập Kho - ' + id.toString().slice(0,8).toUpperCase() + '</title>'
                + '<style>'
                + ':root{--ink:#111;--line:#000;}*{box-sizing:border-box;}'
                + 'body{margin:0;background:#e9eaec;font-family:"Times New Roman",Times,serif;color:var(--ink);-webkit-print-color-adjust:exact;print-color-adjust:exact;}'
                + '.toolbar{position:sticky;top:0;z-index:10;display:flex;justify-content:center;gap:12px;padding:12px;background:#1f2937;}'
                + '.toolbar button{font-family:system-ui,sans-serif;font-size:14px;font-weight:600;padding:8px 18px;border:0;border-radius:8px;cursor:pointer;background:#E8590C;color:#fff;}'
                + '.toolbar .hint{color:#cbd5e1;font-family:system-ui,sans-serif;font-size:12px;align-self:center;}'
                + '.sheet{width:210mm;min-height:297mm;margin:16px auto;padding:14mm 16mm;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.18);font-size:13.5pt;line-height:1.45;}'
                + '.head{display:flex;justify-content:space-between;align-items:flex-start;}'
                + '.head .left{width:48%;}.head .right{width:48%;text-align:right;}'
                + '.mau{font-weight:700;}.tt{font-style:italic;font-size:11.5pt;line-height:1.3;}'
                + '.title{text-align:center;margin:14px 0 2px;}'
                + '.title h1{font-size:18pt;font-weight:700;letter-spacing:1px;margin:0;text-transform:uppercase;}'
                + '.title .date{font-style:italic;font-size:12.5pt;}'
                + '.nocc{display:flex;justify-content:center;gap:34px;font-size:12.5pt;margin-bottom:8px;}'
                + '.meta p{margin:4px 0;}.fill{border-bottom:1px dotted #555;}'
                + 'table{width:100%;border-collapse:collapse;margin:8px 0;font-size:12.5pt;}'
                + 'th,td{border:1px solid var(--line);padding:4px 6px;vertical-align:middle;}'
                + 'th{text-align:center;font-weight:700;}'
                + '.c{text-align:center;}.r{text-align:right;}'
                + '.codes td{text-align:center;font-style:italic;font-size:11pt;padding:2px;}'
                + '.empty td{height:26px;}.sum td{font-weight:700;}'
                + '.total-words{margin:6px 0;}'
                + '.sign-wrap{margin-top:14px;page-break-inside:avoid;}'
                + '.sign-date{text-align:right;font-style:italic;font-size:12.5pt;margin-right:6%;margin-bottom:6px;}'
                + '.signs{display:flex;justify-content:space-between;text-align:center;}'
                + '.signs .col{width:24%;}.signs .role{font-weight:700;font-size:12.5pt;}'
                + '.signs .sub{font-style:italic;font-size:11pt;}.signs .space{height:70px;}.signs .name{font-weight:600;}'
                + '.note{font-style:italic;font-size:10.5pt;color:#333;margin-top:16px;border-top:1px solid #999;padding-top:6px;}'
                + '@media print{@page{size:A4;margin:12mm;}body{background:#fff;}.toolbar{display:none;}'
                + '.sheet{width:auto;min-height:auto;margin:0;padding:0;box-shadow:none;}.note{color:#000;}}'
                + '</style></head><body>'
                + '<div class="toolbar"><button onclick="window.print()">🖨️ In phiếu (A4)</button>'
                + '<span class="hint">Mẹo: trong hộp thoại in, chọn "Lưu thành PDF" để xuất file.</span></div>'
                + '<div class="sheet">'
                + '<div class="head"><div class="left">'
                + '<p style="margin:2px 0">Đơn vị: <b>' + store + '</b></p>'
                + '<p style="margin:2px 0">Bộ phận: <span class="fill">Kho nguyên liệu</span></p>'
                + '</div><div class="right">'
                + '<p class="mau" style="margin:2px 0">Mẫu số: 01 - VT</p>'
                + '<p class="tt" style="margin:2px 0">(Kèm theo Thông tư số 99/2025/TT-BTC<br>ngày 27 tháng 10 năm 2025 của<br>Bộ trưởng Bộ Tài chính)</p>'
                + '</div></div>'
                + '<div class="title"><h1>Phiếu Nhập Kho</h1>'
                + '<div class="date">Ngày ' + day + ' tháng ' + mon + ' năm ' + yr + '</div></div>'
                + '<div class="nocc"><span>Số: <b>' + id.toString().slice(0,8).toUpperCase() + '</b></span>'
                + '<span>Nợ: <span class="fill">.............</span></span>'
                + '<span>Có: <span class="fill">.............</span></span></div>'
                + '<div class="meta">'
                + '<p>- Họ và tên người giao: <b>' + supp + '</b></p>'
                + '<p>- Theo đơn đặt hàng số <b>' + id.toString().slice(0,8).toUpperCase() + '</b> ngày ' + day + ' tháng ' + mon + ' năm ' + yr + ' của <span class="fill">' + supp + '</span></p>'
                + '<p>- Nhập tại kho: <b>Kho nguyên liệu</b> &nbsp;&nbsp; Địa điểm: <span class="fill">' + store + '</span></p>'
                + '</div>'
                + '<table><thead>'
                + '<tr><th rowspan="2" style="width:5%">STT</th>'
                + '<th rowspan="2">Tên, nhãn hiệu, quy cách, phẩm chất vật tư, dụng cụ, sản phẩm, hàng hóa</th>'
                + '<th rowspan="2" style="width:8%">Mã số</th>'
                + '<th rowspan="2" style="width:9%">Đơn vị tính</th>'
                + '<th colspan="2" style="width:18%">Số lượng</th>'
                + '<th rowspan="2" style="width:13%">Đơn giá</th>'
                + '<th rowspan="2" style="width:16%">Thành tiền</th></tr>'
                + '<tr><th style="width:9%">Theo chứng từ</th><th style="width:9%">Thực nhập</th></tr>'
                + '<tr class="codes"><td>A</td><td>B</td><td>C</td><td>D</td><td>1</td><td>2</td><td>3</td><td>4</td></tr>'
                + '</thead><tbody>' + rowsHtml + '</tbody>'
                + '<tfoot><tr class="sum"><td class="c"></td><td><b>Cộng</b></td>'
                + '<td class="c">x</td><td class="c">x</td><td class="c">x</td><td class="c">x</td><td class="c">x</td>'
                + '<td class="r">' + tong.toLocaleString('vi-VN') + '</td></tr></tfoot>'
                + '</table>'
                + '<div class="total-words">- Tổng số tiền (viết bằng chữ): <i>' + _docTienVND(tong) + '</i></div>'
                + '<div style="margin:4px 0 0">- Số chứng từ gốc kèm theo: <span class="fill">................................</span></div>'
                + '<div class="sign-wrap">'
                + '<div class="sign-date">TP. HCM, ngày ' + day + ' tháng ' + mon + ' năm ' + yr + '</div>'
                + '<div class="signs">'
                + '<div class="col"><div class="role">Người lập phiếu</div><div class="sub">(Ký, họ tên)</div>'
                + '<div class="space"></div>' + (emp ? '<div class="name">' + emp + '</div>' : '') + '</div>'
                + '<div class="col"><div class="role">Người giao hàng</div><div class="sub">(Ký, họ tên)</div><div class="space"></div></div>'
                + '<div class="col"><div class="role">Thủ kho</div><div class="sub">(Ký, họ tên)</div><div class="space"></div></div>'
                + '<div class="col"><div class="role">Kế toán trưởng</div><div class="sub">(Hoặc bộ phận có nhu cầu nhập)<br>(Ký, họ tên)</div><div class="space"></div></div>'
                + '</div></div>'
                + '<div class="note">Ghi chú: Tùy theo đặc điểm hoạt động sản xuất kinh doanh và yêu cầu quản lý của đơn vị mình, doanh nghiệp được xây dựng, thiết kế biểu mẫu chứng từ kế toán.</div>'
                + '</div></body></html>';
            var win = window.open('', '_blank', 'width=920,height=750');
            if (win) { win.document.write(html); win.document.close(); }
        })
        .catch(function () { toast('Không thể tải dữ liệu để in!', 'error'); });
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
showTab('dashboard');
loadAvailableTickets();

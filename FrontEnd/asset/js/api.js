// Backend chạy trong docker mapped tới host:3000 (xem docker-compose.yml: backend.ports = 127.0.0.1:3000:8080).
// Khi mở FE qua Live Server hoặc python http.server thì gọi thẳng backend trên 3000.
// Khi chạy production qua nginx thì dùng relative path.
var API_BASE = (window.location.port === '5500' || window.location.port === '5501' || window.location.port === '3001' || window.location.port === '8765')
    ? 'http://127.0.0.1:3000/api/pbl3'
    : '/api/pbl3';

function getToken()  { return localStorage.getItem('token'); }
function setToken(t) { localStorage.setItem('token', t); }

function clearAuth() {
    var keysToRemove = ['token', 'fullName', 'userId', 'employeeId', 'storeId', 'role', 'shiftStatus'];
    keysToRemove.forEach(function (k) { localStorage.removeItem(k); });
}

function isTokenExpired() {
    var token = getToken();
    if (!token || token === 'undefined' || token === 'null') return true;
    try {
        var parts = token.split('.');
        if (parts.length < 3) return true;
        var base64Url = parts[1];
        var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        var padLength = (4 - (base64.length % 4)) % 4;
        base64 += '='.repeat(padLength);
        var payload = JSON.parse(atob(base64));
        return payload.exp * 1000 < Date.now();
    } catch (e) {
        console.error('Error checking token expiration:', e);
        return true;
    }
}

function apiFetch(method, path, body, noAuthRedirect) {
    var opts = { method: method, headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } };
    var token = getToken();
    if (token) {
        if (isTokenExpired()) {
            clearAuth();
            if (!noAuthRedirect) {
                showPopup({ type: 'warning', title: 'Phiên đăng nhập hết hạn', message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' })
                    .then(function () { window.location.href = 'index.html'; });
            }
            return Promise.reject(new Error('Token expired'));
        }
        opts.headers['Authorization'] = 'Bearer ' + token;
    }
    if (body !== undefined) opts.body = JSON.stringify(body);
    return fetch(API_BASE + path, opts).then(function (res) {
        if (res.status === 401 && !noAuthRedirect) {
            clearAuth();
            window.location.href = 'index.html';
            return new Promise(function() {});
        }
        return res;
    });
}

function apiGet(path, noAuth)              { return apiFetch('GET',    path, undefined, noAuth); }
function apiPost(path, body, noAuth)       { return apiFetch('POST',   path, body, noAuth); }
function apiPut(path, body)                { return apiFetch('PUT',    path, body); }
function apiDelete(path)                   { return apiFetch('DELETE', path); }

// ─── Tình trạng còn hàng theo ProductVarient của 1 cửa hàng ─────────────────
// Dùng chung cho trang nhân viên (lập hóa đơn) và trang khách (menu, trang chủ):
// làm mờ + chặn chọn những món mà nguyên liệu đã hết. Trả về object dạng
// { map: { varientId: { available, maxServings } }, loaded: bool }.
// loaded=false ⇒ chưa xác định được (fail-open: KHÔNG làm mờ món nào).
function buildAvailMap(list) {
    var map = {};
    (Array.isArray(list) ? list : []).forEach(function (x) {
        var id = x.productVarientID != null ? x.productVarientID : x.ProductVarientID;
        if (id == null) return;
        var avail = (x.isAvailable !== undefined) ? x.isAvailable : x.IsAvailable;
        var max   = (x.maxServings  !== undefined) ? x.maxServings  : x.MaxServings;
        map[id] = { available: avail !== false, maxServings: (max == null ? -1 : Number(max)) };
    });
    return { map: map, loaded: true };
}

// Fallback khi backend chưa có endpoint /product/availability: tự tính từ công
// thức + tồn kho của store. Khớp logic BillService.ConsumeIngredients (chỉ lô
// đã sơ chế, còn hàng, chưa hết hạn; nhu cầu mỗi phần = QtyAfterProcess).
function computeAvailabilityClientSide(storeID) {
    var asArr = function (d) { return Array.isArray(d) ? d : (d && d.data ? d.data : []); };
    return Promise.all([
        apiGet('/recipe/get-all', true).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
        apiGet('/inventorybatch/by-store/' + storeID, true).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
    ]).then(function (res) {
        var recipes = asArr(res[0]), batches = asArr(res[1]);
        var today = new Date(); today.setHours(0, 0, 0, 0);

        var stockByIng = {};
        batches.forEach(function (b) {
            var type   = b.batchType || b.BatchType;
            var status = b.status || b.Status;
            var qty    = Number(b.quantityOnHand != null ? b.quantityOnHand : b.QuantityOnHand) || 0;
            var exp    = b.exp || b.Exp;
            if (type !== 'Processed' || status !== 'Available' || qty <= 0) return;
            if (exp && new Date(exp) < today) return;
            var ingId = b.ingredientID != null ? b.ingredientID : b.IngredientID;
            stockByIng[ingId] = (stockByIng[ingId] || 0) + qty;
        });

        var byVarient = {};
        recipes.forEach(function (r) {
            if ((r.deletedAt || r.DeletedAt)) return;
            var vid   = r.productVarientID != null ? r.productVarientID : r.ProductVarientID;
            var ingId = r.ingredientID != null ? r.ingredientID : r.IngredientID;
            var need  = Number(r.qtyAfterProcess != null ? r.qtyAfterProcess : r.QtyAfterProcess) || 0;
            if (!byVarient[vid]) byVarient[vid] = [];
            byVarient[vid].push({ ingId: ingId, need: need });
        });

        var map = {};
        Object.keys(byVarient).forEach(function (vid) {
            var maxServings = Infinity;
            byVarient[vid].forEach(function (it) {
                if (it.need <= 0) return;
                var avail = stockByIng[it.ingId] || 0;
                maxServings = Math.min(maxServings, Math.floor(avail / it.need));
            });
            if (maxServings === Infinity) maxServings = -1; // mọi need <= 0
            map[vid] = { available: maxServings !== 0, maxServings: maxServings };
        });
        return { map: map, loaded: true };
    }).catch(function () { return { map: {}, loaded: false }; });
}

function fetchVarientAvailability(storeID) {
    if (!storeID) return Promise.resolve({ map: {}, loaded: false });
    return apiGet('/product/availability/' + storeID, true)
        .then(function (r) {
            if (!r.ok) throw new Error('no endpoint');
            return r.json().then(buildAvailMap);
        })
        .catch(function () { return computeAvailabilityClientSide(storeID); });
}

// true nếu món đã hết hàng (chỉ khi đã tải được dữ liệu tồn kho).
function isVarientOut(avail, varientId) {
    if (!avail || !avail.loaded) return false;
    var info = avail.map[varientId];
    return info ? info.available === false : false;
}

function luuThongTinNhanVien(data) {
    setToken(data.acessToken || data.AcessToken || data.accessToken || data.AccessToken);
    localStorage.setItem('fullName',   data.fullName   || data.FullName   || '');
    localStorage.setItem('employeeId', data.employeeID || data.EmployeeID || '');
    localStorage.setItem('storeId',    data.storeID    || data.StoreID    || '');
    var role = (data.role || data.Role || '');
    localStorage.setItem('role', role === 'Manager' ? 'admin' : 'employee');
    // Lưu trạng thái ca lúc đăng nhập để màn dashboard hiển thị banner đúng giờ/trễ/vắng.
    var cs = data.currentShift || data.CurrentShift;
    if (cs) {
        localStorage.setItem('shiftStatus', JSON.stringify(cs));
    } else {
        localStorage.removeItem('shiftStatus');
    }
}

function luuThongTinKhachHang(data) {
    setToken(data.acessToken || data.AcessToken || data.accessToken || data.AccessToken);
    localStorage.setItem('fullName', data.fullName || data.FullName || '');
    localStorage.setItem('userId',   data.userID   || data.UserID   || '');
    localStorage.setItem('role',     'user');
}

// ─── SePay payment helpers ─────────────────────────────────────────────────
// Poll trạng thái thanh toán bill (FE dùng sau khi tạo bill BankTransfer)
function getPaymentStatus(billId) {
    return apiGet('/bill/payment-status/' + encodeURIComponent(billId))
        .then(function (r) { return r.ok ? r.json() : null; });
}

// Huỷ bill chưa thanh toán (countdown 3p hết hoặc user bấm Huỷ)
function cancelBill(billId) {
    return apiPost('/bill/cancel/' + encodeURIComponent(billId), {})
        .then(function (r) { return r.ok; })
        .catch(function () { return false; });
}

// User bấm "Tôi đã chuyển khoản" → backend query SePay xem tiền đã về chưa.
// Trả về true nếu đã nhận được tiền (bill Paid), false nếu chưa.
function verifyPayment(billId) {
    return apiPost('/bill/verify-payment/' + encodeURIComponent(billId), {})
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { return !!(j && j.paid); })
        .catch(function () { return false; });
}

// Hiện modal QR cho bill BankTransfer. data = response object trả về từ /bill/create-delivery
// onPaid() được gọi khi tiền về (webhook đã chạy). Trả về 1 hàm cancel() để gọi từ ngoài.
function showSePayQrModal(data, onPaid) {
    if (!data || !data.qrUrl) {
        alert('Không tạo được QR thanh toán. Vui lòng thử lại.');
        return function () {};
    }
    // Tạo DOM ad-hoc, không cần thêm CSS riêng
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;'
                          + 'display:flex;align-items:center;justify-content:center;padding:20px;';
    var box = document.createElement('div');
    box.style.cssText = 'background:#fff;border-radius:12px;max-width:380px;width:100%;'
                      + 'padding:24px;text-align:center;font-family:inherit;box-shadow:0 10px 40px rgba(0,0,0,.3);';
    var amount = Number(data.total || 0).toLocaleString('vi-VN');
    var ref = data.paymentReference || '';
    var testBadge = data.testMode
        ? '<div style="background:#fff3cd;color:#856404;padding:8px;border-radius:6px;margin-bottom:10px;font-size:12px;line-height:1.4;">'
        + '⚠ <strong>TEST MODE</strong> – TK ảo SePay không nhận tiền thật.<br>'
        + 'Test bằng <strong>"Mô phỏng giao dịch"</strong> trên dashboard SePay (KHÔNG dùng "Gửi thử webhook" — gửi mã mẫu, không khớp bill).'
        + '</div>'
        : '';
    box.innerHTML = testBadge
        + '<h3 style="margin:0 0 8px;color:#333;">Quét QR để thanh toán</h3>'
        + '<p style="margin:0 0 12px;color:#666;font-size:14px;">Mở app ngân hàng và quét mã bên dưới</p>'
        + '<img src="' + data.qrUrl + '" alt="SePay QR" style="width:100%;max-width:280px;border:1px solid #eee;border-radius:8px;">'
        + '<div style="margin-top:12px;padding:12px;background:#f5f5f5;border-radius:8px;text-align:left;font-size:13px;">'
        +   '<div><strong>Ngân hàng:</strong> ' + (data.bankCode || '') + '</div>'
        +   '<div><strong>Số tài khoản:</strong> ' + (data.bankAccount || '') + '</div>'
        +   (data.bankAccountName ? '<div><strong>Chủ tài khoản:</strong> ' + data.bankAccountName + '</div>' : '')
        +   '<div><strong>Số tiền:</strong> ' + amount + ' đ</div>'
        +   '<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">'
        +     '<strong>Nội dung CK:</strong> <code id="sepay-ref-code">' + ref + '</code>'
        +     '<button id="sepay-copy-ref-btn" type="button" style="padding:3px 8px;border:1px solid #ddd;'
        +       'background:#fff;border-radius:4px;cursor:pointer;font-size:11px;">Copy</button>'
        +   '</div>'
        + '</div>'
        + '<div id="sepay-status" style="margin-top:12px;font-size:14px;color:#e67e22;">'
        +   'Còn lại <strong id="sepay-countdown">03:00</strong> để thanh toán'
        + '</div>'
        + '<div id="sepay-verify-msg" style="margin-top:8px;font-size:13px;display:none;"></div>'
        + '<button id="sepay-confirm-btn" style="margin-top:14px;padding:10px 18px;border:none;border-radius:6px;'
        +   'background:#27ae60;color:#fff;cursor:pointer;font-size:14px;width:100%;">Tôi đã chuyển khoản</button>'
        + '<button id="sepay-cancel-btn" style="margin-top:8px;padding:10px 18px;border:none;border-radius:6px;'
        +   'background:#e74c3c;color:#fff;cursor:pointer;font-size:14px;width:100%;">Huỷ đơn</button>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Nút Copy mã CK
    var copyBtn = box.querySelector('#sepay-copy-ref-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(ref).then(function () {
                    copyBtn.textContent = '✓ Đã copy';
                    setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1500);
                });
            } else {
                // fallback cho browser cũ
                var t = document.createElement('textarea');
                t.value = ref; document.body.appendChild(t); t.select();
                try { document.execCommand('copy'); copyBtn.textContent = '✓ Đã copy'; } catch (e) {}
                document.body.removeChild(t);
                setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1500);
            }
        });
    }

    var stopped = false;
    var finalized = false; // chống double-call onPaid / cancel
    function cleanup() {
        stopped = true;
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }
    function formatMMSS(sec) {
        var m = Math.floor(sec / 60), s = sec % 60;
        return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }

    // User chủ động huỷ → gọi API cancel, alert, đóng popup
    box.querySelector('#sepay-cancel-btn').addEventListener('click', function () {
        if (finalized) { cleanup(); return; }
        finalized = true;
        cancelBill(data.billID).then(function () {
            cleanup();
            alert('Đã huỷ đơn hàng.');
        });
    });

    // User bấm "Tôi đã chuyển khoản" → backend query SePay xem tiền đã về chưa.
    // Về rồi → chấp nhận (onPaid); chưa → báo lỗi, giữ popup để thanh toán lại.
    var confirmBtn = box.querySelector('#sepay-confirm-btn');
    var verifyMsg = box.querySelector('#sepay-verify-msg');
    var checking = false;
    confirmBtn.addEventListener('click', function () {
        if (finalized || stopped || checking) return;
        checking = true;
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.6';
        confirmBtn.style.cursor = 'default';
        confirmBtn.textContent = 'Đang kiểm tra...';
        if (verifyMsg) verifyMsg.style.display = 'none';

        verifyPayment(data.billID).then(function (paid) {
            checking = false;
            if (finalized || stopped) return; // popup đã đóng (poll/huỷ) trong lúc chờ
            if (paid) {
                finalized = true;
                cleanup();
                if (typeof onPaid === 'function') onPaid();
                return;
            }
            // Chưa nhận được tiền → cho user thanh toán lại
            confirmBtn.disabled = false;
            confirmBtn.style.opacity = '1';
            confirmBtn.style.cursor = 'pointer';
            confirmBtn.textContent = 'Tôi đã chuyển khoản';
            if (verifyMsg) {
                verifyMsg.style.color = '#e74c3c';
                verifyMsg.textContent = 'Chưa nhận được tiền. Vui lòng quét QR thanh toán lại rồi bấm xác nhận.';
                verifyMsg.style.display = 'block';
            }
        });
    });

    // Countdown 3 phút (180s) — tick 1s update UI; poll status mỗi 3s
    var SECONDS_TOTAL = 180;
    var remaining = SECONDS_TOTAL;
    var countdownEl = box.querySelector('#sepay-countdown');

    var tickTimer = setInterval(function () {
        if (stopped) { clearInterval(tickTimer); return; }
        remaining--;
        if (countdownEl) countdownEl.textContent = formatMMSS(Math.max(0, remaining));

        // Poll status mỗi 3s
        if (remaining % 3 === 0 || remaining <= 0) {
            getPaymentStatus(data.billID).then(function (st) {
                if (!st || stopped || finalized) return;
                if (st.paymentStatus === 'Paid') {
                    finalized = true;
                    clearInterval(tickTimer);
                    cleanup();
                    if (typeof onPaid === 'function') onPaid();
                }
            }).catch(function () { /* lỗi mạng – cứ thử lại lần sau */ });
        }

        // Hết giờ — tự huỷ bill
        if (remaining <= 0 && !finalized) {
            finalized = true;
            clearInterval(tickTimer);
            cancelBill(data.billID).then(function () {
                cleanup();
                alert('Hết thời gian thanh toán (3 phút). Đơn hàng đã bị huỷ.');
            });
        }
    }, 1000);

    return cleanup;
}

(function checkUserRedirect() {
    var role = localStorage.getItem('role');
    var token = localStorage.getItem('token');
    if ((role === 'admin' || role === 'employee') && token && !isTokenExpired()) {
        var pathname = window.location.pathname;
        if (pathname.indexOf('admin.html') !== -1 || pathname.indexOf('employee.html') !== -1) {
            return;
        }
        var targetPage = role === 'admin' ? 'admin.html' : 'employee.html';
        if (pathname.indexOf('/html/') !== -1) {
            var basePath = pathname.substring(0, pathname.indexOf('/html/') + 6);
            window.location.replace(basePath + targetPage);
        } else {
            var lastSlash = pathname.lastIndexOf('/');
            var basePath = pathname.substring(0, lastSlash + 1);
            window.location.replace(basePath + targetPage);
        }
    }
})();

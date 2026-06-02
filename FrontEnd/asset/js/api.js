// Khi chạy qua Live Server (port 5500) thì gọi thẳng backend; khi qua nginx thì dùng relative path
var API_BASE = (window.location.port === '5500' || window.location.port === '5501' || window.location.port === '3001')
    ? 'http://127.0.0.1:5188/api/pbl3'
    : '/api/pbl3';

function getToken()  { return localStorage.getItem('token'); }
function setToken(t) { localStorage.setItem('token', t); }

function clearAuth() { localStorage.clear(); }

function isTokenExpired() {
    var token = getToken();
    if (!token) return true;
    try {
        var payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.exp * 1000 < Date.now();
    } catch (e) {
        return true;
    }
}

function apiFetch(method, path, body, noAuthRedirect) {
    var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    var token = getToken();
    if (!token) return true;
    try {
        var payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload.exp * 1000 < Date.now();
    } catch (e) {
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
                alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                window.location.href = '/html/index.html';
            }
            return Promise.reject(new Error('Token expired'));
        }
        opts.headers['Authorization'] = 'Bearer ' + token;
    }
    if (body !== undefined) opts.body = JSON.stringify(body);
    return fetch(API_BASE + path, opts).then(function (res) {
        if (res.status === 401 && !noAuthRedirect) {
            clearAuth();
            window.location.href = '/html/index.html';
            return new Promise(function() {});
        }
        return res;
    });
}

function apiGet(path, noAuth)              { return apiFetch('GET',    path, undefined, noAuth); }
function apiPost(path, body, noAuth)       { return apiFetch('POST',   path, body, noAuth); }
function apiPut(path, body)                { return apiFetch('PUT',    path, body); }
function apiDelete(path)                   { return apiFetch('DELETE', path); }

function luuThongTinNhanVien(data) {
    setToken(data.acessToken || data.AcessToken);
    localStorage.setItem('fullName',   data.fullName   || data.FullName   || '');
    localStorage.setItem('employeeId', data.employeeID || data.EmployeeID || '');
    localStorage.setItem('storeId',    data.storeID    || data.StoreID    || '');
    var role = (data.role || data.Role || '');
    localStorage.setItem('role', role === 'Manager' ? 'admin' : 'employee');
}

function luuThongTinKhachHang(data) {
    setToken(data.acessToken || data.AcessToken);
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
        + '<button id="sepay-cancel-btn" style="margin-top:14px;padding:10px 18px;border:none;border-radius:6px;'
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
                if (st.paymentStatus === 'Paid' || st.paymentStatus === 1) {
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

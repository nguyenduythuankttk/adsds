// Mở/đóng modal đăng nhập
document.getElementById('openLoginBtn').addEventListener('click', function (e) {
    e.preventDefault();

    var fullName = localStorage.getItem('fullName');
    var role     = localStorage.getItem('role');

    if (fullName) {
        if (role === 'admin') {
            window.location.href = 'admin.html';
        } else if (role === 'employee') {
            window.location.href = 'employee.html';
        } else {
            window.location.href = 'user.html';
        }
    } else {
        document.getElementById('login-modal').classList.add('active');
    }
});

document.getElementById('closeLoginBtn').addEventListener('click', function () {
    document.getElementById('login-modal').classList.remove('active');
});

document.getElementById('login-modal').addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('active');
});

// Chuyển đổi tab Đăng nhập / Đăng ký
document.querySelectorAll('.modal-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
        document.querySelectorAll('.modal-tab').forEach(function (t) { t.classList.remove('active'); });
        document.querySelectorAll('.modal-panel').forEach(function (p) { p.classList.remove('active'); });
        tab.classList.add('active');
        document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
});

// ── Đăng nhập ────────────────────────────────────────
document.getElementById('btn-login').addEventListener('click', function () {
    var username = document.getElementById('login-username').value.trim();
    var password = document.getElementById('login-password').value;
    var errEl    = document.getElementById('login-error');
    errEl.textContent = '';

    if (!username || !password) { errEl.textContent = 'Vui lòng nhập tên đăng nhập và mật khẩu.'; return; }

    var body = { UserName: username, HashPassword: password };

    // Thử đăng nhập khách hàng trước
    apiPost('/auth/customer_login', body)
        .then(function (res) {
            if (res.ok) return res.json().then(function (d) { return { ok: true, data: d.data, type: 'user' }; });
            // Nếu thất bại, thử đăng nhập nhân viên
            return apiPost('/auth/employee_login', body)
                .then(function (res2) {
                    if (res2.ok) return res2.json().then(function (d) { return { ok: true, data: d.data, type: 'employee' }; });
                    return res2.json().then(function (d) { return { ok: false, msg: d.message || 'Sai tên đăng nhập hoặc mật khẩu.' }; });
                });
        })
        .then(function (result) {
            if (!result.ok) { errEl.textContent = result.msg; return; }
            if (result.type === 'user') {
                luuThongTinKhachHang(result.data);
                document.getElementById('login-modal').classList.remove('active');
                updateHeaderAfterLogin(result.data.fullName || result.data.FullName || '');
            } else {
                luuThongTinNhanVien(result.data);
                document.getElementById('login-modal').classList.remove('active');
                var role = localStorage.getItem('role');
                if (role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'employee.html';
                }
            }
        })
        .catch(function () { errEl.textContent = 'Lỗi kết nối máy chủ.'; });
});

// ── Đăng ký ───────────────────────────────────────────
document.getElementById('btn-register').addEventListener('click', function () {
    var fullName  = document.getElementById('reg-fullname').value.trim();
    var username  = document.getElementById('reg-username').value.trim();
    var phone     = document.getElementById('reg-phone').value.trim();
    var email     = document.getElementById('reg-email').value.trim();
    var birthdate = document.getElementById('reg-birthdate').value;
    var gender    = document.getElementById('reg-gender').value;
    var password  = document.getElementById('reg-password').value;
    var errEl     = document.getElementById('register-error');
    errEl.textContent = '';

    if (!fullName || !username || !phone || !email || !birthdate || !password) {
        errEl.textContent = 'Vui lòng điền đầy đủ các trường.'; return;
    }
    if (password.length < 6) { errEl.textContent = 'Mật khẩu phải có ít nhất 6 ký tự.'; return; }

    apiPost('/auth/register', {
        UserName:     username,
        HashPassword: password,
        FullName:     fullName,
        BirthDate:    birthdate,
        Phone:        phone,
        Email:        email,
        Gender:       gender
    })
    .then(function (res) {
        return res.json().then(function (d) { return { status: res.status, data: d }; });
    })
    .then(function (r) {
        if (r.status === 200) {
            alert('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập.');
            document.querySelector('[data-tab="login"]').click();
            document.getElementById('login-username').value = username;
        } else {
            errEl.textContent = r.data.message || 'Đăng ký thất bại.';
        }
    })
    .catch(function () { errEl.textContent = 'Lỗi kết nối máy chủ.'; });
});

function updateHeaderAfterLogin(name) {
    var btn       = document.getElementById('openLoginBtn');
    var role      = localStorage.getItem('role');
    var initial   = name.charAt(0).toUpperCase();
    var shortName = name.split(' ').pop();

    // Hiện nút Giao Hàng
    var deliveryBtn = document.getElementById('delivery-btn');
    if (deliveryBtn) deliveryBtn.style.display = '';

    // Đổi button thành avatar + tên + nút đăng xuất
    btn.innerHTML =
        '<span class="user-avatar-btn">' + initial + '</span>' +
        '<span id="login-btn-text">' + shortName + '</span>' +
        '<span class="logout-divider">|</span>' +
        '<span class="logout-text" id="btn-logout-header">Đăng xuất</span>';

    // Gắn sự kiện đăng xuất
    var logoutEl = document.getElementById('btn-logout-header');
    if (logoutEl) {
        logoutEl.addEventListener('click', function (e) {
            e.stopPropagation();
            apiPost('/auth/logout').then(function () {
                clearAuth();
                window.location.reload();
            }).catch(function () {
                clearAuth();
                window.location.reload();
            });
        });
    }

    if (role === 'admin') {
        btn.title = 'Vào trang quản lý';
    } else if (role === 'employee') {
        btn.title = 'Xem trang nhân viên';
    } else {
        btn.title = 'Xem trang cá nhân';
    }
}

// Kiểm tra đã đăng nhập khi tải trang
(function ktraReferrer() {
    var name = localStorage.getItem('fullName');
    if (!name) return;
    updateHeaderAfterLogin(name);
})();

// Mở/đóng modal đăng nhập
var _openLoginBtn = document.getElementById('openLoginBtn');
if (_openLoginBtn) {
    _openLoginBtn.addEventListener('click', function (e) {
        e.preventDefault();

        var fullName = localStorage.getItem('fullName');
        var role     = localStorage.getItem('role');

        if (fullName) {
            if (role === 'admin') {
                window.location.href = '/html/admin.html';
            } else if (role === 'employee') {
                window.location.href = '/html/employee.html';
            } else {
                window.location.href = '/html/user.html';
            }
        } else {
            document.getElementById('login-modal').classList.add('active');
        }
    });
}

var _closeLoginBtn = document.getElementById('closeLoginBtn');
if (_closeLoginBtn) {
    _closeLoginBtn.addEventListener('click', function () {
        document.getElementById('login-modal').classList.remove('active');
    });
}

var _loginModal = document.getElementById('login-modal');
if (_loginModal) {
    _loginModal.addEventListener('click', function (e) {
        if (e.target === this) this.classList.remove('active');
    });
}

// Chuyển đổi tab Đăng nhập / Đăng ký
document.querySelectorAll('.modal-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
        document.querySelectorAll('.modal-tab').forEach(function (t) { t.classList.remove('active'); });
        document.querySelectorAll('.modal-panel').forEach(function (p) { p.classList.remove('active'); });
        tab.classList.add('active');
        document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    });
});

// ── Role tabs trong panel đăng nhập ──────────────────
var _loginRole = 'customer';
var roleHints = {
    customer: 'Đăng nhập với tài khoản khách hàng',
    employee: 'Đăng nhập với tài khoản nhân viên'
};
document.querySelectorAll('.login-role-tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
        document.querySelectorAll('.login-role-tab').forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        _loginRole = tab.dataset.role;
        var hint = document.getElementById('login-role-hint');
        if (hint) hint.textContent = roleHints[_loginRole] || '';
        document.getElementById('login-error').textContent = '';
    });
});

// ── Đăng nhập ────────────────────────────────────────
document.getElementById('btn-login').addEventListener('click', function () {
    var username = document.getElementById('login-username').value.trim();
    var password = document.getElementById('login-password').value;
    var errEl    = document.getElementById('login-error');
    errEl.textContent = '';

    if (!username || !password) { errEl.textContent = 'Vui lòng nhập tên đăng nhập và mật khẩu.'; return; }

    var body     = { UserName: username, HashPassword: password };
    var endpoint = _loginRole === 'employee' ? '/auth/employee_login' : '/auth/customer_login';

    apiPost(endpoint, body, true)
        .then(function (res) {
            return res.json().then(function (d) { return { ok: res.ok, data: d.data, msg: d.message }; });
        })
        .then(function (result) {
            if (!result.ok) { errEl.textContent = result.msg || 'Sai tên đăng nhập hoặc mật khẩu.'; return; }
            if (_loginRole === 'employee') {
                luuThongTinNhanVien(result.data);
                document.getElementById('login-modal').classList.remove('active');
                var role = localStorage.getItem('role');
                window.location.href = role === 'admin' ? '/html/admin.html' : '/html/employee.html';
            } else {
                luuThongTinKhachHang(result.data);
                document.getElementById('login-modal').classList.remove('active');
                updateHeaderAfterLogin(result.data.fullName || result.data.FullName || '');
            }
        })
        .catch(function () { errEl.textContent = 'Lỗi kết nối máy chủ.'; });
});

// ── Ẩn/hiện mật khẩu ─────────────────────────────────
function togglePw(id, btn) {
    var inp = document.getElementById(id);
    if (inp.type === 'password') { inp.type = 'text'; btn.textContent = '🙈'; }
    else { inp.type = 'password'; btn.textContent = '👁'; }
}

// ── Quên mật khẩu ─────────────────────────────────────
(function () {
    function showPanel(id) {
        document.querySelectorAll('.modal-panel').forEach(function (p) { p.classList.remove('active'); });
        document.getElementById(id).classList.add('active');
    }

    function safeJson(res) {
        return res.text().then(function (text) {
            var d = {};
            try { d = JSON.parse(text); } catch (e) {}
            return { status: res.status, data: d };
        });
    }

    var _forgotEmail = '';
    var _forgotTimerRef = { interval: null };

    function startForgotCountdown() {
        var timerEl     = document.getElementById('forgot-otp-timer');
        var countdownEl = document.getElementById('forgot-otp-countdown');
        var btnResend   = document.getElementById('btn-forgot-resend');
        var secs = 60;
        timerEl.textContent = secs;
        countdownEl.style.display = '';
        btnResend.style.display = 'none';
        clearInterval(_forgotTimerRef.interval);
        _forgotTimerRef.interval = setInterval(function () {
            secs--;
            timerEl.textContent = secs;
            if (secs <= 0) {
                clearInterval(_forgotTimerRef.interval);
                countdownEl.style.display = 'none';
                btnResend.style.display = '';
            }
        }, 1000);
    }

    // Mở panel nhập email
    document.getElementById('link-forgot-password').addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector('.modal-tabs').style.display = 'none';
        document.getElementById('closeLoginBtn').style.display = 'none';
        document.getElementById('forgot-error').textContent = '';
        document.getElementById('forgot-email').value = '';
        showPanel('panel-forgot');
    });

    // Quay lại đăng nhập
    document.getElementById('btn-back-login').addEventListener('click', function () {
        clearInterval(_forgotTimerRef.interval);
        document.querySelector('.modal-tabs').style.display = '';
        document.getElementById('closeLoginBtn').style.display = '';
        document.querySelectorAll('.modal-tab').forEach(function (t) { t.classList.remove('active'); });
        document.querySelector('[data-tab="login"]').classList.add('active');
        showPanel('panel-login');
    });

    // Gửi OTP quên mật khẩu
    document.getElementById('btn-forgot-send').addEventListener('click', function () {
        var email = document.getElementById('forgot-email').value.trim();
        var errEl = document.getElementById('forgot-error');
        errEl.textContent = '';
        if (!email) { errEl.textContent = 'Vui lòng nhập email.'; return; }
        _forgotEmail = email;
        apiPost('/auth/forgot-password', { Email: email }, true)
            .then(safeJson)
            .then(function (r) {
                if (r.status === 200) {
                    document.getElementById('forgot-otp-input').value = '';
                    document.getElementById('forgot-new-pw').value = '';
                    document.getElementById('forgot-confirm-pw').value = '';
                    document.getElementById('forgot-otp-error').textContent = '';
                    showPanel('panel-forgot-otp');
                    startForgotCountdown();
                } else {
                    errEl.textContent = r.data.message || 'Không tìm thấy email trong hệ thống.';
                }
            })
            .catch(function () { errEl.textContent = 'Lỗi kết nối máy chủ.'; });
    });

    // Gửi lại OTP
    document.getElementById('btn-forgot-resend').addEventListener('click', function () {
        var errEl = document.getElementById('forgot-otp-error');
        errEl.textContent = '';
        apiPost('/auth/forgot-password', { Email: _forgotEmail }, true)
            .then(safeJson)
            .then(function (r) {
                if (r.status === 200) {
                    document.getElementById('forgot-otp-input').value = '';
                    startForgotCountdown();
                } else {
                    errEl.textContent = r.data.message || 'Không thể gửi lại mã OTP.';
                }
            })
            .catch(function () { errEl.textContent = 'Lỗi kết nối máy chủ.'; });
    });

    // Đặt lại mật khẩu
    document.getElementById('btn-forgot-reset').addEventListener('click', function () {
        var otp       = document.getElementById('forgot-otp-input').value.trim();
        var newPw     = document.getElementById('forgot-new-pw').value;
        var confirmPw = document.getElementById('forgot-confirm-pw').value;
        var errEl     = document.getElementById('forgot-otp-error');
        errEl.textContent = '';
        if (!otp || otp.length !== 6)         { errEl.textContent = 'Vui lòng nhập đúng 6 chữ số OTP.'; return; }
        if (!newPw || newPw.length < 6)       { errEl.textContent = 'Mật khẩu mới phải có ít nhất 6 ký tự.'; return; }
        if (newPw !== confirmPw)               { errEl.textContent = 'Mật khẩu xác nhận không khớp.'; return; }
        apiPost('/auth/reset-password', { Token: otp, NewPassword: newPw }, true)
            .then(safeJson)
            .then(function (r) {
                if (r.status === 200) {
                    clearInterval(_forgotTimerRef.interval);
                    document.querySelector('.modal-tabs').style.display = '';
                    document.getElementById('closeLoginBtn').style.display = '';
                    document.querySelectorAll('.modal-tab').forEach(function (t) { t.classList.remove('active'); });
                    document.querySelector('[data-tab="login"]').classList.add('active');
                    showPanel('panel-login');
                    alert('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
                } else {
                    errEl.textContent = r.data.message || 'OTP không đúng hoặc đã hết hạn.';
                }
            })
            .catch(function () { errEl.textContent = 'Lỗi kết nối máy chủ.'; });
    });
})();

// ── Đăng ký ───────────────────────────────────────────
var _registerEmail = '';
var _registerUsername = '';

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
    var confirmPw = document.getElementById('reg-password-confirm').value;
    if (password !== confirmPw) { errEl.textContent = 'Mật khẩu xác nhận không khớp.'; return; }

    if (!/^0\d{9}$/.test(phone)) {
        errEl.textContent = 'Số điện thoại phải gồm 10 chữ số và bắt đầu bằng 0.'; return;
    }

    var minBirthYear = new Date();
    minBirthYear.setFullYear(minBirthYear.getFullYear() - 10);
    if (!birthdate || new Date(birthdate) > minBirthYear) {
        errEl.textContent = 'Bạn phải đủ 10 tuổi trở lên.'; return;
    }

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
            document.querySelectorAll('.modal-panel').forEach(function (p) { p.classList.remove('active'); });
            document.getElementById('panel-otp').classList.add('active');
            document.querySelector('.modal-tabs').style.display = 'none';
            document.getElementById('closeLoginBtn').style.display = 'none';
            document.getElementById('otp-error').textContent = '';
            document.getElementById('otp-input').value = '';

            var timerEl      = document.getElementById('otp-timer');
            var countdownEl  = document.getElementById('otp-countdown');
            var btnResend    = document.getElementById('btn-resend-otp');
            var countdownRef = { interval: null };

            function safeJson(res) {
                return res.text().then(function (text) {
                    var d = {};
                    try { d = JSON.parse(text); } catch (e) {}
                    return { status: res.status, data: d };
                });
            }

            function resetToRegister() {
                clearInterval(countdownRef.interval);
                document.getElementById('closeLoginBtn').style.display = '';
                document.querySelector('.modal-tabs').style.display = '';
                document.querySelectorAll('.modal-tab').forEach(function (t) { t.classList.remove('active'); });
                document.querySelectorAll('.modal-panel').forEach(function (p) { p.classList.remove('active'); });
                document.querySelector('[data-tab="register"]').classList.add('active');
                document.getElementById('panel-register').classList.add('active');
            }

            function startCountdown() {
                var secs = 60;
                timerEl.textContent = secs;
                countdownEl.style.display = '';
                btnResend.style.display = 'none';
                clearInterval(countdownRef.interval);
                countdownRef.interval = setInterval(function () {
                    secs--;
                    timerEl.textContent = secs;
                    if (secs <= 0) {
                        clearInterval(countdownRef.interval);
                        countdownEl.style.display = 'none';
                        btnResend.style.display = '';
                    }
                }, 1000);
            }

            startCountdown();

            document.getElementById('btn-cancel-otp').onclick = resetToRegister;

            btnResend.onclick = function () {
                var otpErr = document.getElementById('otp-error');
                otpErr.textContent = '';
                apiPost('/auth/resend-verify-email', { Email: email })
                    .then(safeJson)
                    .then(function (result) {
                        if (result.status === 200) {
                            document.getElementById('otp-input').value = '';
                            startCountdown();
                        } else {
                            otpErr.textContent = result.data.message || 'Không thể gửi lại mã OTP.';
                        }
                    })
                    .catch(function () { otpErr.textContent = 'Không thể kết nối đến máy chủ.'; });
            };

            document.getElementById('btn-verify-otp').onclick = function () {
                var otp    = document.getElementById('otp-input').value.trim();
                var otpErr = document.getElementById('otp-error');
                otpErr.textContent = '';
                if (!otp || otp.length !== 6) { otpErr.textContent = 'Vui lòng nhập đúng 6 chữ số.'; return; }
                apiPost('/auth/verify-otp', { Otp: otp })
                    .then(safeJson)
                    .then(function (result) {
                        if (result.status === 200) {
                            clearInterval(countdownRef.interval);
                            document.getElementById('closeLoginBtn').style.display = '';
                            document.querySelector('.modal-tabs').style.display = '';
                            document.querySelectorAll('.modal-tab').forEach(function (t) { t.classList.remove('active'); });
                            document.querySelectorAll('.modal-panel').forEach(function (p) { p.classList.remove('active'); });
                            document.querySelector('[data-tab="login"]').classList.add('active');
                            document.getElementById('panel-login').classList.add('active');
                            document.getElementById('login-username').value = username;
                            alert('Xác thực thành công! Bạn có thể đăng nhập ngay bây giờ.');
                        } else {
                            otpErr.textContent = result.data.message || 'OTP không đúng hoặc đã hết hạn.';
                        }
                    })
                    .catch(function () { otpErr.textContent = 'Không thể kết nối đến máy chủ.'; });
            };
        } else {
            errEl.textContent = r.data.message || 'Đăng ký thất bại.';
        }
    })
    .catch(function () { errEl.textContent = 'Lỗi kết nối máy chủ.'; });
});

document.getElementById('btn-verify-otp').addEventListener('click', function () {
    var otp   = document.getElementById('otp-input').value.trim();
    var errEl = document.getElementById('otp-error');
    errEl.textContent = '';
    if (!otp) { errEl.textContent = 'Vui lòng nhập mã OTP.'; return; }

    apiPost('/auth/verify-otp', { Otp: otp })
    .then(function (res) {
        return res.json().then(function (d) { return { status: res.status, data: d }; });
    })
    .then(function (r) {
        if (r.status === 200) {
            document.getElementById('otp-step').style.display = 'none';
            document.getElementById('register-form-step').style.display = '';
            document.getElementById('otp-input').value = '';
            document.querySelector('[data-tab="login"]').click();
            document.getElementById('login-username').value = _registerUsername;
            alert('Xác thực thành công! Bạn có thể đăng nhập ngay bây giờ.');
        } else {
            errEl.textContent = r.data.message || 'OTP không hợp lệ hoặc đã hết hạn.';
        }
    })
    .catch(function () { errEl.textContent = 'Lỗi kết nối máy chủ.'; });
});

document.getElementById('btn-resend-otp').addEventListener('click', function () {
    var errEl = document.getElementById('otp-error');
    errEl.textContent = '';
    if (!_registerEmail) { errEl.textContent = 'Không có email để gửi lại.'; return; }

    apiPost('/auth/resend-verify-email', { Email: _registerEmail })
    .then(function (res) {
        return res.json().then(function (d) { return { status: res.status, data: d }; });
    })
    .then(function (r) {
        if (r.status === 200) {
            alert(r.data.message || 'Đã gửi lại OTP.');
        } else {
            errEl.textContent = r.data.message || 'Không thể gửi lại OTP.';
        }
    })
    .catch(function () { errEl.textContent = 'Lỗi kết nối máy chủ.'; });
});

function updateHeaderAfterLogin(name) {
    var btn       = document.getElementById('openLoginBtn');
    var role      = localStorage.getItem('role');
    var initial   = name.charAt(0).toUpperCase();
    var shortName = name.split(' ').pop();

    // Hiện nút Giỏ Hàng
    var cartFab = document.getElementById('cart-fab');
    if (cartFab) cartFab.style.display = '';

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
    if (isTokenExpired()) { clearAuth(); return; }
    updateHeaderAfterLogin(name);
})();


// ── Gender toggle slider ──────────────────────────────
(function () {
    var toggle = document.getElementById('gender-toggle');
    if (!toggle) return;
    var hidden = document.getElementById('reg-gender');

    toggle.querySelectorAll('.gender-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            toggle.querySelectorAll('.gender-btn').forEach(function (b) {
                b.classList.remove('active');
            });
            this.classList.add('active');
            hidden.value = this.dataset.value;
            if (this.dataset.value === 'Female') {
                toggle.classList.add('female');
            } else {
                toggle.classList.remove('female');
            }
        });
    });
})();

// ── Header Nav Toggle (Home / User) ──────────────────
(function () {
    var homeBtn  = document.getElementById('nav-toggle-home');
    var userBtn  = document.getElementById('nav-toggle-user');
    var thumb    = document.getElementById('nav-toggle-thumb');
    if (!homeBtn || !userBtn) return;

    function setActiveTab(tab) {
        if (tab === 'home') {
            homeBtn.classList.add('active');
            userBtn.classList.remove('active');
            if (thumb) thumb.classList.remove('on-user');
        } else {
            userBtn.classList.add('active');
            homeBtn.classList.remove('active');
            if (thumb) thumb.classList.add('on-user');
        }
    }

    // Trang hiện tại là Home → active Home
    setActiveTab('home');

    homeBtn.addEventListener('click', function () {
        window.location.href = 'index.html';
    });

    userBtn.addEventListener('click', function () {
        var fullName = localStorage.getItem('fullName');
        var role     = localStorage.getItem('role');
        // Chỉ điều hướng khi phiên còn hợp lệ; token hết hạn → mở modal đăng nhập tại chỗ
        // (tránh nhảy sang user.html rồi bị guard đá về index = cảm giác "tự đăng xuất")
        if (fullName && !isTokenExpired()) {
            if (role === 'admin') {
                window.location.href = 'admin.html';
            } else if (role === 'employee') {
                window.location.href = 'employee.html';
            } else {
                window.location.href = 'user.html';
            }
        } else {
            var loginModal = document.getElementById('login-modal');
            if (loginModal) loginModal.classList.add('active');
        }
    });
})();

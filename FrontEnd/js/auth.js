/**
 * auth.js — Quản lý session: lưu token vào localStorage sau login,
 * gọi API logout để blacklist token trên server, rồi xóa localStorage.
 *
 * Luồng đầy đủ:
 *  LOGIN  → server trả accessToken → lưu vào localStorage
 *  LOGOUT → gọi POST /auth/logout (server lưu SHA256(token) vào BlackListedToken)
 *           → xóa localStorage → redirect về login
 *  MIDDLEWARE (backend) → mỗi request vào protected endpoint:
 *           → hash token từ header → kiểm tra BlackListedToken table
 *           → nếu có → trả 401 "Token đã bị thu hồi"
 */

let _sessionTimer  = null;
let _warningTimer  = null;

const authModule = {

  /* ───────── LOGIN ───────── */
  /**
   * Lưu thông tin session vào localStorage sau khi đăng nhập thành công.
   * @param {string} token     - JWT access token từ server
   * @param {string} role      - "Customer" | "Manager" | "Dining" | "Kitchen" | "Counter"
   * @param {string} userId    - UserID (GUID)
   * @param {string|null} storeId - StoreID (chỉ có với Employee)
   * @param {object|null} profile - Thông tin đầy đủ từ server (tên, email…)
   */
  login(token, role, userId, storeId = null, profile = null) {
    if (!token || token === 'undefined' || token === 'null') {
      throw new Error('Không nhận được token hợp lệ từ server.');
    }

    localStorage.setItem('token',   token);
    localStorage.setItem('role',    role);
    localStorage.setItem('userId',  userId);
    if (storeId !== null) localStorage.setItem('storeId', String(storeId));
    if (profile)          localStorage.setItem('profile', JSON.stringify(profile));

    const name = profile?.fullName || profile?.employeeName || '';
    if (name) localStorage.setItem('displayName', name);

    console.info(
      `[auth] Đăng nhập OK | role: ${role} | user: ${name || userId}`,
      `| token length: ${token.length}`
    );
  },

  /* ───────── LOGOUT ───────── */
  /**
   * 1. Gọi POST /auth/logout → server tính SHA256(token) và lưu vào BlackListedToken
   * 2. Xóa toàn bộ localStorage
   * 3. Redirect về trang login
   *
   * Timeout 4s — nếu server không phản hồi vẫn logout phía client.
   */
  async logout() {
    const token = localStorage.getItem('token');
    console.log("token: " + token);

    if (token) {
      try {
        await Promise.race([
          fetch('http://localhost:5188/api/pbl3/auth/logout', {
            method:    'POST',
            keepalive: true,           // hoàn thành request dù page navigate
            headers: {
              'Content-Type':  'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          }),
          // new Promise((_, reject) =>
          //   setTimeout(() => reject(new Error('timeout')), 4000)
          // ),
        ]);
        console.info('[auth] Logout: token đã được blacklist trên server.' + token);
      } catch (err) {
        // Server không phản hồi / lỗi mạng → vẫn logout client-side
        console.warn('[auth] Logout API lỗi:', err.message,
          '— tiếp tục xóa session local.');
      }
    }

    this._clearTimers();
    localStorage.clear();
    window.location.href = '/index.html';
  },

  /**
   * Xử lý 401 từ server (token hết hạn / bị blacklist từ middleware).
   * Không gọi API logout vì token đã không còn hợp lệ.
   */
  handleUnauthorized() {
    console.warn('[auth] 401 nhận được — xóa session và redirect về login.');
    this._clearTimers();
    localStorage.clear();
    window.location.href = '/index.html';
  },

  /* ───────── SESSION INFO ───────── */
  getUser() {
    return {
      token:       localStorage.getItem('token'),
      role:        localStorage.getItem('role'),
      userId:      localStorage.getItem('userId'),
      storeId:     localStorage.getItem('storeId'),
      displayName: localStorage.getItem('displayName') || '',
    };
  },

  getProfile() {
    try { return JSON.parse(localStorage.getItem('profile') || '{}'); }
    catch { return {}; }
  },

  isLoggedIn() {
    const t = localStorage.getItem('token');
    return !!t && t !== 'undefined' && t !== 'null';
  },

  /* ───────── TOKEN EXPIRY ───────── */
  /** Đọc trường `exp` từ JWT payload (không cần thư viện). */
  getTokenExpiry() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const b64     = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const padded  = b64 + '='.repeat((4 - b64.length % 4) % 4);
      const payload = JSON.parse(atob(padded));
      return payload.exp ? payload.exp * 1000 : null; // ms
    } catch {
      return null;
    }
  },

  isTokenExpired() {
    const exp = this.getTokenExpiry();
    return exp === null || Date.now() >= exp;
  },

  msUntilExpiry() {
    const exp = this.getTokenExpiry();
    return exp ? Math.max(0, exp - Date.now()) : 0;
  },

  /* ───────── SESSION TIMER ───────── */
  /**
   * Khởi động timer tự động logout khi token hết hạn.
   * Cảnh báo trước 2 phút.
   * Gọi sau guard() ở mỗi trang bảo vệ.
   */
  startSessionTimer() {
    this._clearTimers();
    const ms = this.msUntilExpiry();
    if (ms <= 0) { this._onSessionExpired(); return; }

    const remaining = Math.round(ms / 60000);
    console.info(`[auth] Phiên còn ${remaining} phút.`);

    const warnMs = ms - 2 * 60 * 1000;
    if (warnMs > 0) {
      _warningTimer = setTimeout(() => this._onSessionWarning(), warnMs);
    }
    _sessionTimer = setTimeout(() => this._onSessionExpired(), ms);
  },

  _clearTimers() {
    if (_sessionTimer)  { clearTimeout(_sessionTimer);  _sessionTimer  = null; }
    if (_warningTimer)  { clearTimeout(_warningTimer);  _warningTimer  = null; }
  },

  _onSessionWarning() {
    _showToast('⚠️ Phiên làm việc sắp hết hạn (còn 2 phút). Hãy lưu công việc.', 'warn');
  },

  _onSessionExpired() {
    this._clearTimers();
    _showExpiredBanner();
  },

  /* ───────── ROUTE GUARD ───────── */
  /**
   * Kiểm tra đăng nhập và role. Gọi ở đầu mỗi trang bảo vệ.
   * @param {string[]} allowedRoles - Danh sách role được phép, ví dụ ['Customer']
   * @returns {boolean}
   */
  guard(allowedRoles = []) {
    if (!this.isLoggedIn()) {
      window.location.href = '/index.html';
      return false;
    }
    if (this.isTokenExpired()) {
      this._clearTimers();
      localStorage.clear();
      window.location.href = '/index.html';
      return false;
    }
    const role = localStorage.getItem('role');
    if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      alert('Bạn không có quyền truy cập trang này.');
      window.location.href = '/index.html';
      return false;
    }
    this.startSessionTimer();
    return true;
  },

  redirectAfterLogin(role) {
    const routes = {
      Customer: '/customer/home.html',
      Manager:  '/employee/home.html',
      Dining:   '/employee/home.html',
      Kitchen:  '/employee/home.html',
      Counter:  '/employee/home.html',
    };
    window.location.href = routes[role] || '/index.html';
  },
};

/* ═══ UI HELPERS ═══ */

function _showToast(msg, type = 'info') {
  const colors = { info: '#2563eb', warn: '#d97706', error: '#dc2626', success: '#16a34a' };
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:99999;
    padding:12px 18px;border-radius:10px;
    background:${colors[type] || colors.info};color:#fff;
    font-size:.9rem;font-family:sans-serif;
    box-shadow:0 4px 16px rgba(0,0,0,.2);
    animation:fadeIn .25s ease;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

/** Banner toàn trang khi session hết hạn — đếm ngược 3s rồi redirect. */
function _showExpiredBanner() {
  if (document.getElementById('session-expired-banner')) return;

  const overlay = document.createElement('div');
  overlay.id = 'session-expired-banner';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    background:rgba(0,0,0,.6);
    display:flex;align-items:center;justify-content:center;
    font-family:sans-serif;
  `;
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:16px;padding:40px 44px;
      text-align:center;max-width:360px;box-shadow:0 8px 40px rgba(0,0,0,.3);">
      <div style="font-size:2.8rem;margin-bottom:14px">⏱️</div>
      <h3 style="margin:0 0 8px;font-size:1.1rem;color:#111">Phiên làm việc hết hạn</h3>
      <p style="margin:0 0 22px;color:#6b7280;font-size:.9rem;line-height:1.5">
        Đang chuyển về trang đăng nhập…<br>
        <span id="session-countdown"
          style="font-weight:700;color:#dc2626;font-size:1.1rem">3</span> giây
      </p>
      <button onclick="authModule.handleUnauthorized()"
        style="padding:10px 28px;background:#dc2626;color:#fff;
          border:none;border-radius:8px;cursor:pointer;font-size:.9rem;font-weight:600;">
        Đăng nhập ngay
      </button>
    </div>`;
  document.body.appendChild(overlay);

  let count = 3;
  const tick = setInterval(() => {
    const el = document.getElementById('session-countdown');
    if (el) el.textContent = --count;
    if (count <= 0) {
      clearInterval(tick);
      localStorage.clear();
      window.location.href = '/index.html';
    }
  }, 1000);
}

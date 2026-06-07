/* popup.js — Hệ popup/modal dùng chung cho toàn site.
 * Thay cho alert()/confirm() thô của trình duyệt và cho thông báo kết quả của
 * các thao tác quan trọng (xuất hóa đơn, nhập kho, thêm bàn, CRUD...).
 *
 * API toàn cục:
 *   showPopup({ type, title, message, html, buttonText, onClose }) -> Promise<void>
 *   showConfirm({ type, title, message, confirmText, cancelText, danger }) -> Promise<boolean>
 *   showAlert(message, type) -> Promise<void>     // rút gọn cho showPopup
 *
 *   type: 'success' | 'error' | 'warning' | 'info'  (mặc định 'info')
 *
 * Ngoài ra module tự override window.alert -> showPopup (không chặn luồng) nên mọi
 * lệnh alert() cũ trên mọi trang sẽ hiển thị dưới dạng popup; loại popup được suy ra
 * từ nội dung thông báo (vd "thành công" -> success, "Lỗi/thất bại/hết hàng" -> error).
 */
(function () {
    if (window.showPopup) return; // tránh nạp trùng

    var STYLE_ID = 'app-popup-style';
    function injectStyle() {
        if (document.getElementById(STYLE_ID)) return;
        var css =
            '.app-popup-overlay{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(20,12,8,.45);animation:appPopFade .15s ease;}' +
            '.app-popup{width:100%;max-width:392px;background:#fff;border-radius:16px;box-shadow:0 22px 60px rgba(0,0,0,.32);overflow:hidden;animation:appPopIn .18s cubic-bezier(.2,.7,.3,1);font-family:"Inter",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;}' +
            '.app-popup-body{padding:28px 24px 10px;text-align:center;}' +
            '.app-popup-icon{width:58px;height:58px;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800;line-height:1;}' +
            '.app-popup-title{font-size:17px;font-weight:800;color:#111;margin:0 0 8px;}' +
            '.app-popup-msg{font-size:14px;line-height:1.55;color:#555;white-space:pre-wrap;word-break:break-word;}' +
            '.app-popup-foot{display:flex;gap:10px;justify-content:center;padding:18px 24px 22px;}' +
            '.app-popup-btn{min-width:104px;padding:10px 18px;border:none;border-radius:10px;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;transition:transform .1s,box-shadow .15s,background .15s;}' +
            '.app-popup-btn:hover{transform:translateY(-1px);}' +
            '.app-popup-btn:focus{outline:2px solid rgba(220,77,11,.4);outline-offset:2px;}' +
            '.app-popup-btn-primary{background:#dc4d0b;color:#fff;}' +
            '.app-popup-btn-primary:hover{background:#b83c08;box-shadow:0 6px 16px rgba(220,77,11,.32);}' +
            '.app-popup-btn-danger{background:#dc2626;color:#fff;}' +
            '.app-popup-btn-danger:hover{background:#b91c1c;box-shadow:0 6px 16px rgba(220,38,38,.3);}' +
            '.app-popup-btn-ghost{background:#f1efed;color:#444;}' +
            '.app-popup-btn-ghost:hover{background:#e6e3e0;}' +
            '@keyframes appPopFade{from{opacity:0}to{opacity:1}}' +
            '@keyframes appPopIn{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}';
        var s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = css;
        (document.head || document.documentElement).appendChild(s);
    }

    // icon (ký tự) + màu cho từng loại
    var TYPES = {
        success: { icon: '✓', color: '#16a34a', bg: '#dcfce7', title: 'Thành công' },
        error:   { icon: '✕', color: '#dc2626', bg: '#fee2e2', title: 'Đã xảy ra lỗi' },
        warning: { icon: '!',      color: '#d97706', bg: '#fef3c7', title: 'Lưu ý' },
        info:    { icon: 'i',      color: '#dc4d0b', bg: '#fdf0ea', title: 'Thông báo' }
    };

    // Suy ra loại popup từ nội dung (dùng cho window.alert override).
    function guessType(msg) {
        var m = (msg || '').toLowerCase();
        if (/(thành công|thành công!|đã (thêm|lưu|xoá|xóa|huỷ|hủy|gửi|sao chép|duyệt)|hoàn tất)/.test(m)) return 'success';
        if (/(lỗi|thất bại|không thể|không được|không đúng|không hợp lệ|hết hàng|hết thời gian|hết hạn|thiếu|vượt quá|chưa |no access|không tìm thấy|không hỗ trợ)/.test(m)) return 'error';
        if (/(vui lòng|hãy |bạn chưa|cần )/.test(m)) return 'warning';
        return 'info';
    }

    function makeOverlay() {
        var overlay = document.createElement('div');
        overlay.className = 'app-popup-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        return overlay;
    }

    function iconHtml(t) {
        return '<div class="app-popup-icon" style="color:' + t.color + ';background:' + t.bg + '">' + t.icon + '</div>';
    }

    function mount(overlay, onKey) {
        injectStyle();
        document.body.appendChild(overlay);
        document.addEventListener('keydown', onKey);
    }
    function unmount(overlay, onKey) {
        document.removeEventListener('keydown', onKey);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }

    function escapeText(s) {
        var d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    function showPopup(opts) {
        opts = opts || {};
        var typeKey = TYPES[opts.type] ? opts.type : 'info';
        var t = TYPES[typeKey];
        var title = opts.title != null ? opts.title : t.title;
        var bodyHtml = opts.html != null ? opts.html : ('<div class="app-popup-msg">' + escapeText(opts.message) + '</div>');
        var btnText = opts.buttonText || 'Đồng ý';

        var overlay = makeOverlay();
        overlay.innerHTML =
            '<div class="app-popup">' +
              '<div class="app-popup-body">' +
                iconHtml(t) +
                (title ? '<div class="app-popup-title">' + escapeText(title) + '</div>' : '') +
                bodyHtml +
              '</div>' +
              '<div class="app-popup-foot">' +
                '<button type="button" class="app-popup-btn app-popup-btn-primary app-popup-ok">' + escapeText(btnText) + '</button>' +
              '</div>' +
            '</div>';

        return new Promise(function (resolve) {
            function done() {
                unmount(overlay, onKey);
                if (typeof opts.onClose === 'function') { try { opts.onClose(); } catch (e) {} }
                resolve();
            }
            function onKey(e) { if (e.key === 'Escape' || e.key === 'Enter') { e.preventDefault(); done(); } }
            mount(overlay, onKey);
            overlay.querySelector('.app-popup-ok').addEventListener('click', done);
            overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) done(); });
            setTimeout(function () { var b = overlay.querySelector('.app-popup-ok'); if (b) b.focus(); }, 30);
        });
    }

    function showConfirm(opts) {
        opts = opts || {};
        var typeKey = TYPES[opts.type] ? opts.type : 'warning';
        var t = TYPES[typeKey];
        var title = opts.title != null ? opts.title : 'Xác nhận';
        var okClass = opts.danger || typeKey === 'error' ? 'app-popup-btn-danger' : 'app-popup-btn-primary';
        var confirmText = opts.confirmText || 'Đồng ý';
        var cancelText = opts.cancelText || 'Huỷ';

        var overlay = makeOverlay();
        overlay.innerHTML =
            '<div class="app-popup">' +
              '<div class="app-popup-body">' +
                iconHtml(t) +
                '<div class="app-popup-title">' + escapeText(title) + '</div>' +
                '<div class="app-popup-msg">' + escapeText(opts.message) + '</div>' +
              '</div>' +
              '<div class="app-popup-foot">' +
                '<button type="button" class="app-popup-btn app-popup-btn-ghost app-popup-cancel">' + escapeText(cancelText) + '</button>' +
                '<button type="button" class="app-popup-btn ' + okClass + ' app-popup-ok">' + escapeText(confirmText) + '</button>' +
              '</div>' +
            '</div>';

        return new Promise(function (resolve) {
            function finish(val) { unmount(overlay, onKey); resolve(val); }
            function onKey(e) {
                if (e.key === 'Escape') { e.preventDefault(); finish(false); }
                else if (e.key === 'Enter') { e.preventDefault(); finish(true); }
            }
            mount(overlay, onKey);
            overlay.querySelector('.app-popup-ok').addEventListener('click', function () { finish(true); });
            overlay.querySelector('.app-popup-cancel').addEventListener('click', function () { finish(false); });
            overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) finish(false); });
            setTimeout(function () { var b = overlay.querySelector('.app-popup-ok'); if (b) b.focus(); }, 30);
        });
    }

    function showAlert(message, type) {
        return showPopup({ message: message, type: type || guessType(message) });
    }

    window.showPopup = showPopup;
    window.showConfirm = showConfirm;
    window.showAlert = showAlert;

    // Override alert() thô của trình duyệt -> popup đẹp (không chặn luồng).
    // Giữ lại bản gốc ở window._nativeAlert phòng khi cần.
    window._nativeAlert = window.alert;
    window.alert = function (message) { showPopup({ message: String(message), type: guessType(message) }); };
})();

/**
 * order-success-popup.js — Simple version
 */
(function () {
    'use strict';

    var OVERLAY_ID = 'order-success-overlay';

    function ensurePopup() {
        if (document.getElementById(OVERLAY_ID)) return;

        var overlay = document.createElement('div');
        overlay.id = OVERLAY_ID;
        overlay.className = 'order-success-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');

        overlay.innerHTML =
            '<div class="order-success-popup">' +
                '<button class="order-success-close" id="order-success-close" aria-label="Đóng">✕</button>' +
                '<h2 class="order-success-title">Đặt hàng thành công!</h2>' +
                '<p class="order-success-sub">' +
                    'Cảm ơn bạn đã tin tưởng <strong>Chônlibi</strong>!<br>' +
                    'Đơn hàng của bạn đang được xử lý.' +
                '</p>' +
                '<button class="order-success-btn" id="order-success-ok-btn">Đóng lại</button>' +
            '</div>';

        document.body.appendChild(overlay);

        document.getElementById('order-success-close').addEventListener('click', closeOrderSuccess);
        document.getElementById('order-success-ok-btn').addEventListener('click', closeOrderSuccess);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) closeOrderSuccess();
        });
    }

    function closeOrderSuccess() {
        var overlay = document.getElementById(OVERLAY_ID);
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    window.showOrderSuccessPopup = function () {
        ensurePopup();

        var overlay = document.getElementById(OVERLAY_ID);
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        setTimeout(function () {
            var btn = document.getElementById('order-success-ok-btn');
            if (btn) btn.focus();
        }, 350);
    };

})();

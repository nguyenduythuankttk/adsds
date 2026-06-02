/**
 * Order Success Animated Popup for Chônlibi
 */

function showOrderSuccessPopup() {
    // 1. Clean up any existing instances of the success popup
    var existing = document.getElementById('order-success-overlay');
    if (existing) {
        if (existing.parentNode) {
            existing.parentNode.removeChild(existing);
        }
    }

    // Helper function for localizing popup strings
    function getTranslation(key, defaultValue) {
        if (window.i18n && typeof window.i18n.t === 'function') {
            var translated = window.i18n.t(key);
            if (translated !== key) {
                return translated;
            }
        }
        return defaultValue;
    }

    var title = getTranslation('order_success_title', 'Đặt Hàng Thành Công!');
    var desc = getTranslation('order_success_desc', 'Cảm ơn bạn đã tin tưởng Chônlibi!<br>Đơn hàng của bạn đang được chuẩn bị và sẽ giao đến bạn trong giây lát.');
    var closeBtnText = getTranslation('btn_close', 'Đóng');

    // 2. Generate the HTML structure for the overlay and modal content
    var htmlContent = 
        '<div class="order-success-box">' +
        '    <button class="order-success-close-x" id="order-success-close-x" aria-label="Close">&times;</button>' +
        '    ' +
        '    <div class="success-checkmark-wrap">' +
        '        <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">' +
        '            <circle class="checkmark__circle" cx="26" cy="26" r="25" fill="none"/>' +
        '            <path class="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>' +
        '        </svg>' +
        '    </div>' +
        '    ' +
        '    <h3 class="order-success-title">' + title + '</h3>' +
        '    <p class="order-success-desc">' + desc + '</p>' +
        '    ' +
        '    <div class="delivery-anim-container">' +
        '        <!-- Sky elements -->' +
        '        <div class="cloud cloud-1"></div>' +
        '        <div class="cloud cloud-2"></div>' +
        '        ' +
        '        <!-- Smoke puff particles -->' +
        '        <div class="smoke-particle smoke-1"></div>' +
        '        <div class="smoke-particle smoke-2"></div>' +
        '        <div class="smoke-particle smoke-3"></div>' +
        '        ' +
        '        <!-- The animated Chicken riding scooter -->' +
        '        <div class="chicken-scooter-wrapper">' +
        '            <svg viewBox="0 0 120 90" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">' +
        '                <!-- Scooter Wheel Back -->' +
        '                <g class="wheel-spin">' +
        '                    <circle cx="25" cy="71" r="11" fill="#2c3e50" stroke="#1a252f" stroke-width="1.5" />' +
        '                    <circle cx="25" cy="71" r="6" fill="#bdc3c7" />' +
        '                    <line x1="25" y1="60" x2="25" y2="82" stroke="#7f8c8d" stroke-width="1.5" />' +
        '                    <line x1="14" y1="71" x2="36" y2="71" stroke="#7f8c8d" stroke-width="1.5" />' +
        '                </g>' +
        '                ' +
        '                <!-- Scooter Wheel Front -->' +
        '                <g class="wheel-spin-front">' +
        '                    <circle cx="95" cy="71" r="11" fill="#2c3e50" stroke="#1a252f" stroke-width="1.5" />' +
        '                    <circle cx="95" cy="71" r="6" fill="#bdc3c7" />' +
        '                    <line x1="95" y1="60" x2="95" y2="82" stroke="#7f8c8d" stroke-width="1.5" />' +
        '                    <line x1="84" y1="71" x2="106" y2="71" stroke="#7f8c8d" stroke-width="1.5" />' +
        '                </g>' +
        '                ' +
        '                <!-- Scooter Chassis & Deck -->' +
        '                <path d="M 25 71 L 95 71 C 97 71, 98 69, 98 65 L 96 61 L 28 61 Z" fill="#95a5a6" />' +
        '                ' +
        '                <!-- Scooter Engine Cover (Back red guard) -->' +
        '                <path d="M 25 71 C 25 54, 45 49, 58 49 C 67 49, 71 54, 71 71 Z" fill="#e74c3c" />' +
        '                ' +
        '                <!-- Scooter Seat -->' +
        '                <path d="M 42 49 C 42 44, 70 44, 70 49 Z" fill="#2c3e50" />' +
        '                ' +
        '                <!-- Delivery Box Rack & Delivery Box -->' +
        '                <path d="M 25 61 L 16 61 L 16 48 L 25 48" stroke="#7f8c8d" stroke-width="2.5" fill="none" stroke-linecap="round" />' +
        '                <rect x="5" y="24" width="25" height="25" rx="3" fill="#f39c12" stroke="#d35400" stroke-width="1" />' +
        '                <text x="17.5" y="34" font-size="5" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">DELIVERY</text>' +
        '                <text x="17.5" y="42" font-size="4" font-weight="900" fill="#ffffff" text-anchor="middle" font-family="sans-serif">CHÔNLIBI</text>' +
        '                ' +
        '                <!-- Front Fork & Handlebar Column -->' +
        '                <path d="M 95 71 L 89 36 L 82 17" stroke="#7f8c8d" stroke-width="2.5" fill="none" stroke-linecap="round" />' +
        '                <path d="M 77 17 L 89 19" stroke="#34495e" stroke-width="3" stroke-linecap="round" />' +
        '                ' +
        '                <!-- Front Shield -->' +
        '                <path d="M 94 71 L 87 36 C 85 32, 92 28, 95 28 C 98 28, 100 31, 98 36 L 102 71 Z" fill="#e74c3c" />' +
        '                <!-- Headlight & Beam -->' +
        '                <circle cx="94" cy="28" r="4.5" fill="#f1c40f" stroke="#ffffff" stroke-width="1" />' +
        '                <polygon points="94,28 120,20 120,38" fill="rgba(241, 196, 15, 0.15)" />' +
        '                ' +
        '                <!-- Chicken Driver -->' +
        '                <!-- Orange Legs -->' +
        '                <line x1="58" y1="49" x2="65" y2="61" stroke="#f39c12" stroke-width="2.5" stroke-linecap="round" />' +
        '                <!-- Yellow Body -->' +
        '                <circle cx="56" cy="35" r="14" fill="#f1c40f" />' +
        '                <!-- Orange Wing -->' +
        '                <path class="chicken-wing" d="M 48 35 C 48 42, 58 42, 58 35 Z" fill="#e67e22" />' +
        '                <!-- Yellow Head -->' +
        '                <circle cx="66" cy="20" r="9" fill="#f1c40f" />' +
        '                <!-- Eye -->' +
        '                <circle cx="68" cy="18" r="1.2" fill="#2c3e50" />' +
        '                <!-- Orange Beak -->' +
        '                <polygon points="75,18 80,20 75,22" fill="#e67e22" />' +
        '                ' +
        '                <!-- Red Helmet & Blue Visor -->' +
        '                <path d="M 58 18 C 58 9, 74 9, 74 18 Z" fill="#e74c3c" />' +
        '                <path d="M 70 15 C 73 15, 76 17, 75 21 C 73 21, 71 18, 70 15 Z" fill="rgba(52, 152, 219, 0.5)" />' +
        '                ' +
        '                <!-- Helmet Crests / Red Comb -->' +
        '                <circle cx="55" cy="11" r="3.5" fill="#e74c3c" />' +
        '                <circle cx="60" cy="8" r="3.5" fill="#e74c3c" />' +
        '                <circle cx="66" cy="7" r="3.5" fill="#e74c3c" />' +
        '                ' +
        '                <!-- Arm holding handle -->' +
        '                <path d="M 61 35 Q 77 31 82 23" fill="none" stroke="#f1c40f" stroke-width="4.5" stroke-linecap="round" />' +
        '            </svg>' +
        '        </div>' +
        '        ' +
        '        <!-- Road and dashes -->' +
        '        <div class="delivery-road">' +
        '            <div class="road-dashes"></div>' +
        '        </div>' +
        '    </div>' +
        '    ' +
        '    <button class="order-success-btn" id="order-success-btn">' + closeBtnText + '</button>' +
        '</div>';

    // 3. Create overlay element and insert HTML content
    var overlay = document.createElement('div');
    overlay.className = 'order-success-overlay';
    overlay.id = 'order-success-overlay';
    overlay.innerHTML = htmlContent;

    document.body.appendChild(overlay);

    // 4. Trigger transition with a minor delay so animation applies
    setTimeout(function () {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }, 40);

    // 5. Function to close and clean up
    function closeSuccessPopup() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        
        // Wait for CSS fadeout transition before removing from DOM
        setTimeout(function () {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        }, 400);
    }

    // 6. Bind events
    document.getElementById('order-success-close-x').addEventListener('click', closeSuccessPopup);
    document.getElementById('order-success-btn').addEventListener('click', closeSuccessPopup);
}

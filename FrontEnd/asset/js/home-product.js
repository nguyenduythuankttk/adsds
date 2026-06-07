// Home page: featured products + search + full delivery cart flow
(function () {
    var CART_KEY = 'chonlibi_cart';

    // ── State ─────────────────────────────────────────────────────────────────
    var cart             = [];
    var allAddresses     = [];
    var selectedAddress  = null;
    var addrDropdownOpen = false;
    var allStores        = [];
    var selectedStore    = null;
    var homeLastProducts = [];                          // cache để vẽ lại khi đổi store
    var storeDropdownOpen = false;
    var userPickedStore  = false;
    var selectedTicket   = null;
    var MAX_DELIVERY_KM  = 50;
    var notFarNotifiedKey = null;   // tránh hiện popup "ngoài khu vực" lặp lại cho cùng địa chỉ/cửa hàng

    // ── Helpers ───────────────────────────────────────────────────────────────
    function formatPrice(n) { return Number(n).toLocaleString('vi-VN') + ' đ'; }
    function isLoggedIn()   { return !!localStorage.getItem('fullName'); }

    function fetchShippingFee(addressID, storeID) {
        var url = '/store/shipping-fee/' + addressID;
        if (storeID != null) url += '?storeID=' + storeID;
        return apiGet(url)
            .then(function (r) { return r.ok ? r.json() : null; })
            .catch(function () { return null; });
    }

    function haversineKm(lat1, lon1, lat2, lon2) {
        var R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.sin(dLat/2)*Math.sin(dLat/2) + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    }

    function storeAddressText(store) {
        var a = store.address || store.Address || {};
        var parts = [];
        if (a.streetAddress) parts.push(a.streetAddress);
        if (a.district)      parts.push(a.district);
        if (a.province)      parts.push(a.province);
        return parts.join(', ');
    }

    function nearestStore(addr) {
        if (!allStores.length) return null;
        if (!addr || addr.latitude == null || addr.longitude == null) return allStores[0];
        var best = null, bestDist = Infinity;
        allStores.forEach(function (s) {
            var sa = s.address || s.Address || {};
            if (sa.latitude == null || sa.longitude == null) return;
            var d = haversineKm(addr.latitude, addr.longitude, sa.latitude, sa.longitude);
            if (d < bestDist) { bestDist = d; best = s; }
        });
        return best || allStores[0];
    }

    function renderStoreSelected() {
        var el        = document.getElementById('cq-store-selected');
        var expandBtn = document.getElementById('cq-store-expand-btn');
        if (!el) return;
        if (!allStores.length) {
            el.innerHTML = '<span class="cq-store-loading">Không tải được danh sách cửa hàng.</span>';
            if (expandBtn) expandBtn.style.display = 'none';
            return;
        }
        var s = selectedStore || allStores[0];
        var isNearest = !userPickedStore;
        el.innerHTML =
            '<div class="cq-store-name">' + (s.storeName || s.StoreName || 'Cửa hàng') +
            (isNearest ? '<span class="cq-store-badge">Gần nhất</span>' : '') + '</div>' +
            '<div class="cq-store-addr">' + storeAddressText(s) + '</div>';
        var others = allStores.filter(function (x) { return (x.storeID || x.StoreID) !== (s.storeID || s.StoreID); });
        if (expandBtn) expandBtn.style.display = others.length ? 'flex' : 'none';
    }

    function renderStoreList() {
        var listEl = document.getElementById('cq-store-list');
        if (!listEl) return;
        var curID = selectedStore ? (selectedStore.storeID || selectedStore.StoreID) : null;
        listEl.innerHTML = '';
        allStores.filter(function (s) { return (s.storeID || s.StoreID) !== curID; }).forEach(function (s) {
            var item = document.createElement('div');
            item.className = 'cq-store-item';
            item.innerHTML =
                '<div class="cq-store-item-name">' + (s.storeName || s.StoreName || 'Cửa hàng') + '</div>' +
                '<div class="cq-store-item-addr">' + storeAddressText(s) + '</div>';
            item.addEventListener('click', function () {
                selectedStore = s;
                userPickedStore = true;
                storeDropdownOpen = false;
                listEl.classList.remove('open');
                var arrow = document.getElementById('cq-store-arrow');
                if (arrow) arrow.classList.remove('open');
                renderStoreSelected(); renderStoreList(); updateCQShipping();
            });
            listEl.appendChild(item);
        });
    }

    function loadStores() {
        var el = document.getElementById('cq-store-selected');
        var expandBtn = document.getElementById('cq-store-expand-btn');
        if (!el) return;
        el.innerHTML = '<span class="cq-store-loading">Đang tải cửa hàng...</span>';
        if (expandBtn) expandBtn.style.display = 'none';
        apiGet('/store/get-all')
            .then(function (r) { return r.ok ? r.json() : []; })
            .then(function (data) {
                allStores = Array.isArray(data) ? data : [];
                userPickedStore = false;
                selectedStore = nearestStore(selectedAddress);
                storeDropdownOpen = false;
                var listEl = document.getElementById('cq-store-list');
                var arrow  = document.getElementById('cq-store-arrow');
                if (listEl) listEl.classList.remove('open');
                if (arrow)  arrow.classList.remove('open');
                renderStoreSelected(); renderStoreList();
            })
            .catch(function () {
                if (el) el.innerHTML = '<span class="cq-store-loading">Không thể tải cửa hàng.</span>';
            });
    }

    function applyTicketDiscount(subtotal) {
        if (!selectedTicket) return 0;
        return Math.round(subtotal * (selectedTicket.discount || 0));
    }

    function setCheckoutBlocked(blocked, message) {
        var btn = document.getElementById('cq-checkout-btn');
        if (btn) {
            btn.disabled = blocked;
            btn.style.opacity = blocked ? '0.45' : '';
            btn.title = blocked ? message : '';
        }
        var warningEl = document.getElementById('cq-delivery-warning');
        if (!warningEl) return;
        if (blocked) {
            warningEl.textContent = message;
            warningEl.style.display = 'flex';
        } else {
            warningEl.style.display = 'none';
        }
    }

    function updateCQShipping() {
        var shippingEl   = document.getElementById('cq-shipping');
        var grandTotalEl = document.getElementById('cq-grand-total');
        var distanceEl   = document.getElementById('cq-distance');
        var discountRow  = document.getElementById('cq-discount-row');
        var discountEl   = document.getElementById('cq-discount');
        var subtotal = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);

        var discountAmt = applyTicketDiscount(subtotal);
        if (discountAmt > 0 && discountRow && discountEl) {
            discountRow.style.display = '';
            discountEl.textContent    = '-' + formatPrice(discountAmt);
        } else if (discountRow) {
            discountRow.style.display = 'none';
        }

        if (!userPickedStore && allStores.length) {
            selectedStore = nearestStore(selectedAddress);
            renderStoreSelected(); renderStoreList();
        }

        if (!selectedAddress) {
            if (shippingEl)   shippingEl.textContent   = '0 đ';
            if (grandTotalEl) grandTotalEl.textContent = formatPrice(subtotal - discountAmt);
            if (distanceEl)   distanceEl.textContent   = '';
            notFarNotifiedKey = null;
            setCheckoutBlocked(false, '');
            return;
        }
        if (shippingEl) shippingEl.textContent = '...';
        if (distanceEl) distanceEl.textContent = '';
        var currentStoreID = selectedStore ? (selectedStore.storeID || selectedStore.StoreID) : null;
        fetchShippingFee(selectedAddress.addressID, currentStoreID).then(function (data) {
            if (!data) {
                var errMsg = 'Không tính được phí giao hàng đến địa chỉ này. Vui lòng chọn cửa hàng khác hoặc thử lại.';
                if (shippingEl)   shippingEl.textContent   = 'Không hỗ trợ';
                if (grandTotalEl) grandTotalEl.textContent = formatPrice(subtotal - discountAmt);
                if (distanceEl)   distanceEl.textContent   = '';
                setCheckoutBlocked(true, errMsg);
                var errKey = 'err|' + selectedAddress.addressID + '|' + currentStoreID;
                if (notFarNotifiedKey !== errKey && typeof showPopup === 'function') {
                    notFarNotifiedKey = errKey;
                    showPopup({ type: 'warning', title: 'Không thể giao đến khu vực này', message: errMsg });
                }
                return;
            }
            if (!data.isDeliverable) {
                var msg = 'Địa chỉ của bạn cách cửa hàng gần nhất ' + data.distanceKm.toFixed(1) +
                          ' km (tối đa ' + MAX_DELIVERY_KM + ' km). Chúng tôi không thể giao hàng đến khu vực này.';
                if (shippingEl)   shippingEl.textContent   = 'Không hỗ trợ';
                if (grandTotalEl) grandTotalEl.textContent = formatPrice(subtotal - discountAmt);
                if (distanceEl)   distanceEl.textContent   = '(' + data.distanceKm.toFixed(1) + ' km)';
                setCheckoutBlocked(true, msg);
                var key = selectedAddress.addressID + '|' + currentStoreID;
                if (notFarNotifiedKey !== key && typeof showPopup === 'function') {
                    notFarNotifiedKey = key;
                    showPopup({ type: 'warning', title: 'Ngoài khu vực giao hàng', message: msg });
                }
                return;
            }
            notFarNotifiedKey = null;
            var fee = data ? data.shippingFee : 0;
            var km  = data ? data.distanceKm  : null;
            if (shippingEl)   shippingEl.textContent   = formatPrice(fee);
            if (grandTotalEl) grandTotalEl.textContent = formatPrice(subtotal - discountAmt + fee);
            if (distanceEl)   distanceEl.textContent   = km != null ? '(' + km.toFixed(1) + ' km)' : '';
            setCheckoutBlocked(false, '');
        });
    }

    // ── Ticket / Voucher ───────────────────────────────────────────────────────
    function loadTickets() {
        var sel = document.getElementById('cq-ticket-select');
        if (!sel) return;
        selectedTicket = null;
        sel.innerHTML = '<option value="">-- Không dùng mã --</option>';
        if (!isLoggedIn()) return;
        apiGet('/ticket/my-tickets')
            .then(function (r) { return r.ok ? r.json() : []; })
            .then(function (data) {
                var now = vnTodayISO();
                (Array.isArray(data) ? data : []).filter(function (tk) {
                    return !tk.usedAt && !tk.deletedAt &&
                           (tk.startDate || '') <= now &&
                           (tk.endDate   || '') >= now;
                }).forEach(function (tk) {
                    var code    = (tk.ticketID || '').toString().slice(0, 8).toUpperCase();
                    var discPct = Math.round((tk.discount || 0) * 100);
                    var opt     = document.createElement('option');
                    opt.value   = JSON.stringify(tk);
                    opt.textContent = code + ' – Giảm ' + discPct + '% (HSD: ' + (tk.endDate ? fmtVnDate(tk.endDate) : '') + ')';
                    sel.appendChild(opt);
                });
            })
            .catch(function () {});
    }

    // ── Scheduled delivery ──────────────────────────────────────────────────────
    var SCHEDULE_MAX_HOURS = 10;
    function toLocalInputValue(date) {
        var pad = function (n) { return (n < 10 ? '0' : '') + n; };
        return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate())
            + 'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
    }
    function refreshScheduleBounds() {
        var t = document.getElementById('cq-schedule-time');
        if (!t) return;
        var now = new Date();
        t.min = toLocalInputValue(now);
        t.max = toLocalInputValue(new Date(now.getTime() + SCHEDULE_MAX_HOURS * 3600 * 1000));
    }
    function readScheduledAt() {
        var chk = document.getElementById('cq-schedule-check');
        var t   = document.getElementById('cq-schedule-time');
        if (!chk || !chk.checked) return { ok: true };
        var v = t && t.value;
        if (!v) return { ok: false, msg: 'Vui lòng chọn giờ hẹn giao hàng.' };
        var picked = new Date(v), now = new Date();
        if (isNaN(picked.getTime()) || picked <= now)
            return { ok: false, msg: 'Giờ hẹn giao hàng phải ở thời điểm trong tương lai.' };
        if (picked.getTime() > now.getTime() + SCHEDULE_MAX_HOURS * 3600 * 1000)
            return { ok: false, msg: 'Chỉ được hẹn giao trong vòng ' + SCHEDULE_MAX_HOURS + ' giờ tới.' };
        return { ok: true, scheduledAt: picked.toISOString() };
    }
    function resetSchedule() {
        var chk = document.getElementById('cq-schedule-check');
        var t   = document.getElementById('cq-schedule-time');
        var b   = document.getElementById('cq-schedule-body');
        if (chk) chk.checked = false;
        if (t)   t.value = '';
        if (b)   b.style.display = 'none';
    }

    function saveCart() {
        try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    }

    function loadCart() {
        try {
            var raw = localStorage.getItem(CART_KEY);
            if (raw) { var parsed = JSON.parse(raw); if (Array.isArray(parsed)) cart = parsed; }
        } catch (e) {}
    }

    // ── Toast ─────────────────────────────────────────────────────────────────
    function showToast(msg) {
        var t = document.getElementById('home-cart-toast');
        if (!t) return;
        t.textContent = msg;
        t.style.display = 'block';
        t.classList.add('visible');
        clearTimeout(t._tid);
        t._tid = setTimeout(function () {
            t.classList.remove('visible');
            setTimeout(function () { t.style.display = 'none'; }, 300);
        }, 2000);
    }

    // ── Cart badge ────────────────────────────────────────────────────────────
    function updateCartBadge() {
        var total   = cart.reduce(function (s, i) { return s + i.qty; }, 0);
        var countEl = document.getElementById('cart-count');
        if (!countEl) return;
        countEl.textContent = total;
        total > 0 ? countEl.classList.add('visible') : countEl.classList.remove('visible');
    }

    // ── Cart sidebar ──────────────────────────────────────────────────────────
    function renderCart() {
        var list    = document.getElementById('cart-items-list');
        var empty   = document.getElementById('cart-empty');
        var footer  = document.getElementById('cart-footer');
        var totalEl = document.getElementById('cart-total');
        if (!list) return;

        list.querySelectorAll('.cart-item').forEach(function (el) { el.remove(); });

        if (cart.length === 0) {
            if (empty)  empty.style.display  = 'flex';
            if (footer) footer.style.display = 'none';
            return;
        }
        if (empty)  empty.style.display  = 'none';
        if (footer) footer.style.display = 'block';

        cart.forEach(function (item, idx) {
            var el = document.createElement('div');
            el.className = 'cart-item';
            el.innerHTML =
                '<div class="cart-item-qty">' +
                '<button class="qty-btn" data-action="minus" data-idx="' + idx + '" aria-label="Giảm">−</button>' +
                '<span class="qty-number">' + item.qty + '</span>' +
                '<button class="qty-btn" data-action="plus" data-idx="' + idx + '" aria-label="Tăng">+</button>' +
                '</div>' +
                '<span class="cart-item-name">' + item.name + '</span>' +
                '<span class="cart-item-price">' + formatPrice(item.price * item.qty) + '</span>';
            list.appendChild(el);
        });

        if (totalEl) {
            var total = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
            totalEl.textContent = formatPrice(total);
        }
    }

    function openCart() {
        var sidebar  = document.getElementById('cart-sidebar');
        var overlay  = document.getElementById('cart-overlay');
        if (sidebar) sidebar.classList.add('open');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        renderCart();
    }

    function closeCart() {
        var sidebar  = document.getElementById('cart-sidebar');
        var overlay  = document.getElementById('cart-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function initCartSidebar() {
        var list = document.getElementById('cart-items-list');
        if (list) {
            list.addEventListener('click', function (e) {
                var btn = e.target.closest('.qty-btn');
                if (!btn) return;
                var idx    = parseInt(btn.dataset.idx, 10);
                var action = btn.dataset.action;
                if (action === 'plus') { cart[idx].qty++; }
                else { cart[idx].qty--; if (cart[idx].qty <= 0) cart.splice(idx, 1); }
                saveCart(); updateCartBadge(); renderCart();
            });
        }

        var cartFab      = document.getElementById('cart-fab');
        var closeBtn     = document.getElementById('cart-close-btn');
        var overlay      = document.getElementById('cart-overlay');
        var cartOrderBtn = document.getElementById('cart-order-btn');

        if (cartFab) cartFab.addEventListener('click', function () {
            if (cart.length === 0) { openEmptyCartPopup(); return; }
            renderCQModal(); openCQModal();
        });
        if (closeBtn) closeBtn.addEventListener('click', closeCart);
        if (overlay)  overlay.addEventListener('click', closeCart);
        if (cartOrderBtn) cartOrderBtn.addEventListener('click', function () {
            if (cart.length === 0) { openEmptyCartPopup(); return; }
            closeCart(); renderCQModal(); openCQModal();
        });
    }

    // ── CQ (order confirmation) modal ─────────────────────────────────────────
    function renderCQModal() {
        var wrap      = document.getElementById('cq-items-wrap');
        var itemCount = document.getElementById('cq-item-count');
        var subtotalEl  = document.getElementById('cq-subtotal');
        var shippingEl  = document.getElementById('cq-shipping');
        var grandTotalEl = document.getElementById('cq-grand-total');
        if (!wrap) return;

        wrap.innerHTML = '';
        cart.forEach(function (item, idx) {
            var el = document.createElement('div');
            el.className = 'cq-item';
            el.innerHTML =
                '<div class="cq-item-qty-ctrl">' +
                '<button class="cq-qty-btn" data-action="minus" data-idx="' + idx + '" aria-label="Giảm">−</button>' +
                '<span class="cq-qty-num">' + item.qty + '</span>' +
                '<button class="cq-qty-btn" data-action="plus" data-idx="' + idx + '" aria-label="Tăng">+</button>' +
                '</div>' +
                '<span class="cq-item-name">' + item.name + '</span>' +
                '<span class="cq-item-price">' + formatPrice(item.price * item.qty) + '</span>';
            wrap.appendChild(el);
        });

        var totalItems = cart.reduce(function (s, i) { return s + i.qty; }, 0);
        var subtotal   = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
        if (itemCount)    itemCount.textContent    = totalItems + ' món';
        if (subtotalEl)   subtotalEl.textContent   = formatPrice(subtotal);
        updateCQShipping();
    }

    function openCQModal() {
        var modal    = document.getElementById('cq-modal');
        var backdrop = document.getElementById('cq-backdrop');
        if (modal)    modal.classList.add('open');
        if (backdrop) backdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
        loadAddresses();
        loadStores();
        loadTickets();
    }

    function closeCQModal() {
        var modal      = document.getElementById('cq-modal');
        var backdrop   = document.getElementById('cq-backdrop');
        if (modal)    modal.classList.remove('open');
        if (backdrop) backdrop.classList.remove('active');
        document.body.style.overflow = '';
        addrDropdownOpen  = false;
        storeDropdownOpen = false;
        notFarNotifiedKey = null;
        selectedTicket    = null;
        var ts = document.getElementById('cq-ticket-select'); if (ts) ts.value = '';
        var ti = document.getElementById('cq-ticket-info');   if (ti) ti.style.display = 'none';
        resetSchedule();
        ['cq-addr-list','cq-store-list'].forEach(function (id) { var el = document.getElementById(id); if (el) el.classList.remove('open'); });
        ['cq-addr-arrow','cq-store-arrow'].forEach(function (id) { var el = document.getElementById(id); if (el) el.classList.remove('open'); });
    }

    function initCQModal() {
        var wrap        = document.getElementById('cq-items-wrap');
        var closeBtn    = document.getElementById('cq-close-btn');
        var backdrop    = document.getElementById('cq-backdrop');
        var addrExpand  = document.getElementById('cq-addr-expand-btn');
        var storeExpand = document.getElementById('cq-store-expand-btn');
        var checkoutBtn = document.getElementById('cq-checkout-btn');

        if (wrap) {
            wrap.addEventListener('click', function (e) {
                var btn = e.target.closest('.cq-qty-btn');
                if (!btn) return;
                var idx = parseInt(btn.dataset.idx, 10);
                if (btn.dataset.action === 'plus') { cart[idx].qty++; }
                else { cart[idx].qty--; if (cart[idx].qty <= 0) cart.splice(idx, 1); }
                saveCart(); updateCartBadge(); renderCart(); renderCQModal();
                if (cart.length === 0) closeCQModal();
            });
        }

        if (closeBtn) closeBtn.addEventListener('click', closeCQModal);
        if (backdrop) backdrop.addEventListener('click', closeCQModal);

        if (addrExpand) {
            addrExpand.addEventListener('click', function () {
                var addrList  = document.getElementById('cq-addr-list');
                var addrArrow = document.getElementById('cq-addr-arrow');
                addrDropdownOpen = !addrDropdownOpen;
                if (addrDropdownOpen) {
                    if (addrList)  addrList.classList.add('open');
                    if (addrArrow) addrArrow.classList.add('open');
                } else {
                    if (addrList)  addrList.classList.remove('open');
                    if (addrArrow) addrArrow.classList.remove('open');
                }
            });
        }

        if (storeExpand) {
            storeExpand.addEventListener('click', function () {
                var storeList  = document.getElementById('cq-store-list');
                var storeArrow = document.getElementById('cq-store-arrow');
                storeDropdownOpen = !storeDropdownOpen;
                if (storeDropdownOpen) {
                    if (storeList)  storeList.classList.add('open');
                    if (storeArrow) storeArrow.classList.add('open');
                } else {
                    if (storeList)  storeList.classList.remove('open');
                    if (storeArrow) storeArrow.classList.remove('open');
                }
            });
        }

        var ticketSelect = document.getElementById('cq-ticket-select');
        if (ticketSelect) {
            ticketSelect.addEventListener('change', function () {
                var info = document.getElementById('cq-ticket-info');
                if (!this.value) {
                    selectedTicket = null;
                    if (info) info.style.display = 'none';
                } else {
                    try { selectedTicket = JSON.parse(this.value); } catch (e) { selectedTicket = null; }
                    if (selectedTicket && info) {
                        var discPct = Math.round((selectedTicket.discount || 0) * 100);
                        info.textContent = 'Giảm ' + discPct + '% — HSD: ' + (selectedTicket.endDate ? fmtVnDate(selectedTicket.endDate) : '');
                        info.style.display = 'block';
                    }
                }
                updateCQShipping();
            });
        }

        var scheduleCheck = document.getElementById('cq-schedule-check');
        if (scheduleCheck) {
            scheduleCheck.addEventListener('change', function () {
                var body = document.getElementById('cq-schedule-body');
                var t    = document.getElementById('cq-schedule-time');
                if (scheduleCheck.checked) {
                    refreshScheduleBounds();
                    if (body) body.style.display = '';
                    if (t && !t.value) t.value = toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000));
                } else {
                    if (body) body.style.display = 'none';
                }
            });
        }

        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', function () {
                if (cart.length === 0) return;
                if (checkoutBtn.disabled) return;
                if (!isLoggedIn()) {
                    closeCQModal();
                    var modal = document.getElementById('login-modal');
                    if (modal) modal.classList.add('active');
                    return;
                }
                if (!selectedAddress) {
                    showPopup({ type: 'warning', title: 'Chưa có địa chỉ giao hàng', message: 'Bạn chưa có địa chỉ giao hàng. Vui lòng thêm địa chỉ trong trang tài khoản.' })
                        .then(function () { window.location.href = 'user.html'; });
                    return;
                }

                var schedule = readScheduledAt();
                if (!schedule.ok) { alert(schedule.msg); return; }

                var userId        = localStorage.getItem('userId');
                var products      = cart.map(function (i) { return { ProductVarientID: i.varientId, qty: i.qty }; });
                var storeID       = selectedStore ? (selectedStore.storeID || selectedStore.StoreID) : null;
                var paymentRadio  = document.querySelector('input[name="cq-payment"]:checked');
                var paymentMethod = paymentRadio ? paymentRadio.value : 'Cash';
                var ticketID      = selectedTicket ? (selectedTicket.ticketID || selectedTicket.TicketID || null) : null;

                var body = {
                    UserID:         userId,
                    StoreID:        storeID,
                    AddressID:      selectedAddress.addressID,
                    PaymentMethods: paymentMethod,
                    products:       products
                };
                if (ticketID) body.TicketID = ticketID;
                if (schedule.scheduledAt) body.ScheduledAt = schedule.scheduledAt;

                apiPost('/bill/create-delivery', body)
                .then(function (res) {
                    if (!res.ok) return res.text().then(function (t) {
                        var msg = t;
                        try { var j = JSON.parse(t); if (j && j.message) msg = j.message; } catch (e) {}
                        throw new Error(msg || 'Đặt hàng thất bại. Vui lòng thử lại.');
                    });
                    return res.json();
                })
                .then(function (data) {
                    closeCQModal();
                    cart.length = 0;
                    saveCart(); updateCartBadge(); renderCart();
                    if (data && data.paymentMethods === 'BankTransfer' && data.qrUrl) {
                        showSePayQrModal(data, function () {
                            alert('Thanh toán thành công!\nCảm ơn bạn đã tin tưởng Chônlibi!');
                        });
                    } else {
                        alert('Đặt hàng thành công!\nCảm ơn bạn đã tin tưởng Chônlibi!');
                    }
                })
                .catch(function (err) {
                    // Cửa hàng thiếu nguyên liệu (BE trả 400 + message) → báo khách chọn cửa hàng khác.
                    if (typeof showPopup === 'function') {
                        showPopup({ type: 'warning', title: 'Không thể đặt hàng', message: err.message || 'Đặt hàng thất bại. Vui lòng thử lại.' });
                    } else {
                        alert('Đặt hàng thất bại. Vui lòng thử lại.\n' + err.message);
                    }
                });
            });
        }
    }

    // ── Address picker ────────────────────────────────────────────────────────
    function formatAddress(a) {
        var parts = [];
        if (a.streetAddress) parts.push(a.streetAddress);
        if (a.district)      parts.push(a.district);
        if (a.province)      parts.push(a.province);
        return parts.join(', ');
    }

    function renderAddrSelected() {
        var selected  = document.getElementById('cq-addr-selected');
        var expandBtn = document.getElementById('cq-addr-expand-btn');
        if (!selected) return;

        if (!allAddresses.length) {
            selected.innerHTML =
                '<span class="cq-addr-none">Bạn chưa có địa chỉ giao hàng. ' +
                '<a id="cq-addr-add-link" style="cursor:pointer">Thêm ngay</a></span>';
            var addLink = document.getElementById('cq-addr-add-link');
            if (addLink) addLink.addEventListener('click', openAddrPopup);
            if (expandBtn) expandBtn.style.display = 'none';
            return;
        }

        var a = selectedAddress;
        selected.innerHTML =
            '<div class="cq-addr-name">Địa chỉ ' + (a.isDefault ? 'mặc định' : 'đã chọn') + '</div>' +
            '<div class="cq-addr-text">' + formatAddress(a) + '</div>';

        var others = allAddresses.filter(function (x) { return x.addressID !== a.addressID; });
        if (expandBtn) expandBtn.style.display = others.length ? 'flex' : 'none';
    }

    function renderAddrList() {
        var addrList  = document.getElementById('cq-addr-list');
        var addrArrow = document.getElementById('cq-addr-arrow');
        if (!addrList) return;

        var others = allAddresses.filter(function (x) {
            return x.addressID !== (selectedAddress && selectedAddress.addressID);
        });
        addrList.innerHTML = '';

        others.forEach(function (a) {
            var item = document.createElement('div');
            item.className = 'cq-addr-item';
            item.innerHTML =
                '<div class="cq-addr-item-text">' + formatAddress(a) + '</div>' +
                '<button class="cq-addr-set-default" data-id="' + a.addressID + '">Mặc định</button>';

            item.querySelector('.cq-addr-item-text').addEventListener('click', function () {
                selectedAddress  = a;
                addrDropdownOpen = false;
                addrList.classList.remove('open');
                if (addrArrow) addrArrow.classList.remove('open');
                renderAddrSelected(); renderAddrList(); updateCQShipping();
            });

            item.querySelector('.cq-addr-set-default').addEventListener('click', function (e) {
                e.stopPropagation();
                var btn = this;
                btn.disabled = true; btn.textContent = '...';
                apiPut('/address/set-default/' + a.addressID)
                    .then(function (res) {
                        if (!res.ok) throw new Error();
                        allAddresses.forEach(function (x) { x.isDefault = (x.addressID === a.addressID); });
                        selectedAddress  = a;
                        addrDropdownOpen = false;
                        addrList.classList.remove('open');
                        if (addrArrow) addrArrow.classList.remove('open');
                        renderAddrSelected(); renderAddrList(); updateCQShipping();
                    })
                    .catch(function () {
                        btn.disabled = false; btn.textContent = 'Mặc định';
                        alert('Không thể đặt địa chỉ mặc định. Vui lòng thử lại.');
                    });
            });

            addrList.appendChild(item);
        });
    }

    function loadAddresses() {
        var selected  = document.getElementById('cq-addr-selected');
        var expandBtn = document.getElementById('cq-addr-expand-btn');
        if (!selected) return;

        selected.innerHTML = '<span class="cq-addr-loading">Đang tải địa chỉ...</span>';
        if (expandBtn) expandBtn.style.display = 'none';
        allAddresses = []; selectedAddress = null;

        if (!isLoggedIn()) {
            selected.innerHTML = '<span class="cq-addr-none">Vui lòng đăng nhập để chọn địa chỉ giao hàng.</span>';
            return;
        }

        apiGet('/address/my-addresses')
            .then(function (res) { return res.ok ? res.json() : []; })
            .then(function (data) {
                allAddresses = Array.isArray(data) ? data : [];
                var def = allAddresses.find(function (a) { return a.isDefault; });
                selectedAddress  = def || allAddresses[0] || null;
                addrDropdownOpen = false;
                var addrList  = document.getElementById('cq-addr-list');
                var addrArrow = document.getElementById('cq-addr-arrow');
                if (addrList)  addrList.classList.remove('open');
                if (addrArrow) addrArrow.classList.remove('open');
                renderAddrSelected(); renderAddrList(); updateCQShipping();
            })
            .catch(function () {
                selected.innerHTML = '<span class="cq-addr-none">Không thể tải địa chỉ. Vui lòng thử lại.</span>';
            });
    }

    // ── Add address popup ─────────────────────────────────────────────────────
    function openAddrPopup() {
        ['addr-street-address','addr-district','addr-province']
            .forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
        var errEl = document.getElementById('addr-form-error');
        if (errEl) errEl.textContent = '';
        var overlay = document.getElementById('addr-popup-overlay');
        var popup   = document.getElementById('addr-popup');
        if (overlay) overlay.classList.add('active');
        if (popup)   popup.classList.add('open');
        document.body.style.overflow = 'hidden';
        var first = document.getElementById('addr-street-address');
        if (first) setTimeout(function () { first.focus(); }, 250);
    }

    function closeAddrPopup() {
        var overlay = document.getElementById('addr-popup-overlay');
        var popup   = document.getElementById('addr-popup');
        if (overlay) overlay.classList.remove('active');
        if (popup)   popup.classList.remove('open');
        document.body.style.overflow = 'hidden'; // CQ modal vẫn mở
    }

    function initAddrPopup() {
        var closeBtn  = document.getElementById('addr-popup-close');
        var cancelBtn = document.getElementById('addr-cancel-btn');
        var overlay   = document.getElementById('addr-popup-overlay');
        var addBtn    = document.getElementById('cq-addr-add-btn');
        var submitBtn = document.getElementById('addr-submit-btn');

        if (closeBtn)  closeBtn.addEventListener('click', closeAddrPopup);
        if (cancelBtn) cancelBtn.addEventListener('click', closeAddrPopup);
        if (overlay)   overlay.addEventListener('click', closeAddrPopup);
        if (addBtn)    addBtn.addEventListener('click', openAddrPopup);

        if (submitBtn) {
            submitBtn.addEventListener('click', function () {
                var errEl        = document.getElementById('addr-form-error');
                var streetAddress = document.getElementById('addr-street-address').value.trim();
                var district      = document.getElementById('addr-district').value.trim();
                var province      = document.getElementById('addr-province').value.trim();

                if (!streetAddress || !district || !province) {
                    if (errEl) errEl.textContent = 'Vui lòng điền đầy đủ các trường bắt buộc.';
                    return;
                }
                if (errEl) errEl.textContent = '';
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="ti-reload"></i> Đang lưu...';

                var body = { StreetAddress: streetAddress, District: district, Province: province };

                apiPost('/address/add', body)
                    .then(function (res) {
                        if (!res.ok) return res.text().then(function (t) { throw new Error(t || 'Lỗi khi thêm địa chỉ.'); });
                        closeAddrPopup();
                        loadAddresses();
                    })
                    .catch(function (err) {
                        if (errEl) errEl.textContent = err.message || 'Không thể thêm địa chỉ. Vui lòng thử lại.';
                    })
                    .finally(function () {
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="ti-check"></i> Lưu địa chỉ';
                    });
            });
        }
    }

    // ── Empty cart popup ──────────────────────────────────────────────────────
    function openEmptyCartPopup() {
        var overlay = document.getElementById('empty-cart-overlay');
        var popup   = document.getElementById('empty-cart-popup');
        if (overlay) overlay.classList.add('active');
        if (popup)   popup.classList.add('open');
    }

    function closeEmptyCartPopup() {
        var overlay = document.getElementById('empty-cart-overlay');
        var popup   = document.getElementById('empty-cart-popup');
        if (overlay) overlay.classList.remove('active');
        if (popup)   popup.classList.remove('open');
    }

    function initEmptyCartPopup() {
        var closeBtn = document.getElementById('empty-cart-close-btn');
        var overlay  = document.getElementById('empty-cart-overlay');
        if (closeBtn) closeBtn.addEventListener('click', closeEmptyCartPopup);
        if (overlay)  overlay.addEventListener('click', closeEmptyCartPopup);
    }

    // ── Add to cart ───────────────────────────────────────────────────────────
    window.homeAddToCart = function (varientId, name, price) {
        if (!isLoggedIn()) {
            var modal = document.getElementById('login-modal');
            if (modal) modal.classList.add('active');
            return;
        }
        var existing = cart.find(function (i) { return i.varientId === varientId; });
        if (existing) { existing.qty++; }
        else { cart.push({ varientId: varientId, name: name, price: price, qty: 1 }); }
        saveCart(); updateCartBadge(); renderCart();
        showToast('Đã thêm "' + name + '" vào giỏ hàng!');
    };

    // ── Products ──────────────────────────────────────────────────────────────
    var RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

    // Thứ tự size: Default < S < M < L < XL → giá đại diện lấy theo size nhỏ nhất
    var SIZE_RANK  = { Default: 0, S: 1, M: 2, L: 3, XL: 4 };
    var SIZE_SHORT = { Default: 'Mặc định', S: 'S', M: 'M', L: 'L', XL: 'XL' };
    function sizeRank(v) {
        var s = v ? (v.size != null ? v.size : v.Size) : null;
        return (s != null && SIZE_RANK[s] != null) ? SIZE_RANK[s] : 99;
    }

    function renderProductCard(p, rank) {
        var raw = (p.productVarient || p.ProductVarient || []).filter(function (v) {
            return (v.isActive !== false && v.IsActive !== false) && !(v.deletedAt || v.DeletedAt);
        });
        if (!raw.length) raw = p.productVarient || p.ProductVarient || [];
        if (!raw.length) return '';

        // Chỉ hiện chip khi món có nhiều size khác nhau thật sự.
        // Combo (cùng size, khác số người) giữ nguyên thứ tự sẵn có (modal đã sắp theo số người).
        var sizeSet = {};
        raw.forEach(function (v) { sizeSet[(v.size != null ? v.size : v.Size) || 'Default'] = true; });
        var multiSize = raw.length > 1 && Object.keys(sizeSet).length > 1;

        var variants = multiSize
            ? raw.slice().sort(function (a, b) {
                  var r = sizeRank(a) - sizeRank(b);
                  return r !== 0 ? r : ((a.price || a.Price || 0) - (b.price || b.Price || 0));
              })
            : raw;
        var defaultV = variants[0];

        var vid    = defaultV.productVarientID || defaultV.ProductVarientID;
        var price  = defaultV.price || defaultV.Price || 0;
        var name   = p.productName || p.ProductName || '';
        var attrNm = name.replace(/"/g, '&quot;');
        var img    = p.image || p.Image || '';
        var sold   = p.soldCount || p.SoldCount || 0;

        var rankColor = rank <= 3 ? RANK_COLORS[rank - 1] : '#555';
        var rankBadge = rank
            ? '<span class="product-rank-badge" style="background:' + rankColor + '">#' + rank + '</span>'
            : '';

        var sizeHTML = '';
        if (multiSize) {
            sizeHTML = '<div class="card-size-list">';
            variants.forEach(function (v, i) {
                var cvid   = v.productVarientID || v.ProductVarientID;
                var csize  = (v.size != null ? v.size : v.Size) || '';
                sizeHTML += '<button type="button" class="card-size-chip' + (i === 0 ? ' selected' : '') + '"' +
                    ' data-vid="' + cvid + '" data-price="' + (v.price || v.Price || 0) + '">' +
                    (SIZE_SHORT[csize] || csize || 'Mặc định') + '</button>';
            });
            sizeHTML += '</div>';
        }

        return '<div class="product-card home-prod-card">' +
            '<div class="product-image-wrapper">' +
            rankBadge +
            (img ? '<img src="' + img + '" alt="' + attrNm + '" loading="lazy">'
                 : '<div class="img-placeholder">🍗</div>') +
            (sold > 0 ? '<span class="product-badge">BÁN CHẠY</span>' : '') +
            '</div>' +
            '<div class="product-info">' +
            '<h3 class="product-name">' + name + '</h3>' +
            '<p class="product-price">' + formatPrice(price) + '</p>' +
            (sold > 0 ? '<p class="product-sold-count">Đã bán: ' + sold + '</p>' : '') +
            sizeHTML +
            '<button type="button" class="add-to-cart-btn-static home-add-btn"' +
            ' data-vid="' + vid + '" data-price="' + price + '" data-name="' + attrNm + '">' +
            '<i class="ti-shopping-cart"></i> THÊM VÀO GIỎ</button>' +
            '</div></div>';
    }

    // Chọn size trên card → cập nhật giá hiển thị + biến thể sẽ thêm vào giỏ
    document.addEventListener('click', function (e) {
        var chip = e.target.closest('.card-size-chip');
        if (!chip) return;
        var card = chip.closest('.home-prod-card');
        if (!card) return;
        e.stopPropagation();

        card.querySelectorAll('.card-size-chip').forEach(function (c) { c.classList.remove('selected'); });
        chip.classList.add('selected');

        var price = parseFloat(chip.dataset.price) || 0;
        var vid   = parseInt(chip.dataset.vid, 10);

        var priceEl = card.querySelector('.product-price');
        if (priceEl) priceEl.textContent = formatPrice(price);

        var addBtn = card.querySelector('.home-add-btn');
        if (addBtn) {
            addBtn.dataset.vid   = vid;
            addBtn.dataset.price = price;
        }
    });

    // Nút "Thêm vào giỏ" trên card (đọc biến thể đang chọn từ data-*)
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.home-add-btn');
        if (!btn) return;
        e.stopPropagation();
        var vid   = parseInt(btn.dataset.vid, 10);
        var price = parseFloat(btn.dataset.price) || 0;
        var name  = btn.dataset.name || '';
        if (!vid) return;
        window.homeAddToCart(vid, name, price);
    });

    function renderProducts(products) {
        homeLastProducts = products || [];
        var container = document.getElementById('home-product-container');
        if (!container) return;
        if (!products || products.length === 0) {
            container.innerHTML = '<p style="color:#aaa;padding:20px;text-align:center">Không tìm thấy sản phẩm nào.</p>';
            return;
        }
        container.innerHTML = products.map(function (p, i) { return renderProductCard(p, i + 1); }).join('');
    }

    function loadFeatured() {
        apiGet('/product/featured')
            .then(function (r) { return r.json(); })
            .then(function (data) { renderProducts(Array.isArray(data) ? data : (data.data || [])); })
            .catch(function () {
                var c = document.getElementById('home-product-container');
                if (c) c.innerHTML = '<p style="color:#aaa;padding:20px;text-align:center">Không thể tải sản phẩm.</p>';
            });
    }

    window.homeSearch = function () {
        var name = (document.getElementById('hs-name') || {}).value || '';
        var type = (document.getElementById('hs-type') || {}).value || '';
        var minP = (document.getElementById('hs-min')  || {}).value || '';
        var maxP = (document.getElementById('hs-max')  || {}).value || '';

        var body = {};
        if (name.trim())  body.Name     = name.trim();
        if (type)         body.Type     = type;
        if (minP !== '')  body.MinPrice = parseFloat(minP);
        if (maxP !== '')  body.MaxPrice = parseFloat(maxP);

        var container = document.getElementById('home-product-container');
        if (container) container.innerHTML = '<p style="color:#aaa;padding:20px;text-align:center">Đang tìm kiếm...</p>';

        apiPost('/product/search', body)
            .then(function (r) { return r.json(); })
            .then(function (data) { renderProducts(Array.isArray(data) ? data : (data.data || [])); })
            .catch(function () {
                if (container) container.innerHTML = '<p style="color:#aaa;padding:20px">Lỗi tìm kiếm.</p>';
            });
    };

    window.homeReset = function () {
        ['hs-name', 'hs-min', 'hs-max'].forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
        var sel = document.getElementById('hs-type'); if (sel) sel.value = '';
        loadFeatured();
    };

    // Thanh tìm kiếm header: chuyển sang trang menu để hiển thị kết quả
    // (hoạt động kể cả khi chưa đăng nhập, thống nhất với user.html)
    var headerSearch = document.getElementById('hs-name');
    if (headerSearch) {
        headerSearch.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter') return;
            var q = headerSearch.value.trim();
            if (!q) return;
            window.location.href = 'menu.html?search=' + encodeURIComponent(q);
        });
    }

    // ── Combo Modal ───────────────────────────────────────────────────────────
    function openComboModal(people, title, comboKey) {
        var modal   = document.getElementById('combo-modal-overlay');
        var grid    = document.getElementById('combo-modal-grid');
        var titleEl = document.getElementById('combo-modal-title');
        var viewAll = document.getElementById('combo-modal-viewall');

        if (titleEl) titleEl.textContent = title;
        if (viewAll) viewAll.href = 'menu.html?category=' + comboKey;
        if (grid) grid.innerHTML = '<p style="text-align:center;padding:30px;color:#aaa">Đang tải...</p>';
        if (modal) modal.classList.add('active');

        apiPost('/product/search', { Type: 'Combo' })
            .then(function (res) { return res.ok ? res.json() : []; })
            .then(function (data) {
                var all = Array.isArray(data) ? data : [];
                var filtered = all
                    .filter(function (p) {
                        return (p.productVarient || []).some(function (v) {
                            return Number(v.forPeople) === people && v.isActive !== false && !v.deletedAt;
                        });
                    })
                    .map(function (p) {
                        var mv = (p.productVarient || []).find(function (v) { return Number(v.forPeople) === people; });
                        if (!mv) return p;
                        var rest = (p.productVarient || []).filter(function (v) { return v !== mv; });
                        return Object.assign({}, p, { productVarient: [mv].concat(rest) });
                    });

                if (!grid) return;
                if (!filtered.length) {
                    grid.innerHTML = '<p style="text-align:center;padding:30px;color:#aaa">Chưa có combo phù hợp.</p>';
                    return;
                }
                grid.innerHTML = filtered.map(function (p) { return renderProductCard(p, 0); }).join('');
            })
            .catch(function () {
                if (grid) grid.innerHTML = '<p style="text-align:center;color:red;padding:20px">Không thể tải dữ liệu.</p>';
            });
    }

    function closeComboModal() {
        var modal = document.getElementById('combo-modal-overlay');
        if (modal) modal.classList.remove('active');
    }

    function initComboModal() {
        var overlay  = document.getElementById('combo-modal-overlay');
        var closeBtn = document.getElementById('combo-modal-close');
        if (overlay)  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeComboModal(); });
        if (closeBtn) closeBtn.addEventListener('click', closeComboModal);
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeComboModal(); });

        var COMBO_MAP = {
            'cat-combo1':  { people: 1, title: 'Combo 1 Người',      key: 'combo1' },
            'cat-combo2':  { people: 2, title: 'Combo Cặp Đôi',      key: 'combo2' },
            'cat-combo3':  { people: 3, title: 'Combo Hội Bạn Thân', key: 'combo3' },
            'cat-giadinh': { people: 4, title: 'Combo Gia Đình',      key: 'combo4' }
        };
        Object.keys(COMBO_MAP).forEach(function (id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('click', function (e) {
                e.preventDefault();
                var cfg = COMBO_MAP[id];
                openComboModal(cfg.people, cfg.title, cfg.key);
            });
        });
    }

    // ── Init ──────────────────────────────────────────────────────────────────
    loadCart();
    updateCartBadge();
    renderCart();
    initCartSidebar();
    initCQModal();
    initAddrPopup();
    initEmptyCartPopup();
    initComboModal();
    loadFeatured();
})();

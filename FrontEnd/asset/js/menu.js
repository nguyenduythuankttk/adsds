(function () {
    'use strict';

    // ── DOM refs ─────────────────────────────────────────────────────────────
    var pdBackdrop  = document.getElementById('pd-backdrop');
    var pdModal     = document.getElementById('pd-modal');
    var pdCloseBtn  = document.getElementById('pd-close-btn');
    var pdImg       = document.getElementById('pd-img');
    var pdImgPlaceholder = document.getElementById('pd-img-placeholder');
    var pdTypeBadge = document.getElementById('pd-type-badge');
    var pdName      = document.getElementById('pd-name');
    var pdDesc      = document.getElementById('pd-desc');
    var pdSizeSection = document.getElementById('pd-size-section');
    var pdSizeList  = document.getElementById('pd-size-list');
    var pdPrice     = document.getElementById('pd-price');
    var pdAddBtn    = document.getElementById('pd-add-btn');
    var pdPeople     = document.getElementById('pd-people');
    var pdPeopleText = document.getElementById('pd-people-text');

    // section grids (vertical scroll layout)
    var gridAll   = document.getElementById('grid-all');
    var gridFood  = document.getElementById('grid-food');
    var gridCombo = document.getElementById('grid-combo');
    var gridAddon = document.getElementById('grid-addon');
    var gridDrink = document.getElementById('grid-drink');

    var cartFab       = document.getElementById('cart-fab');
    var cartCount     = document.getElementById('cart-count');
    var cartSidebar   = document.getElementById('cart-sidebar');
    var cartOverlay   = document.getElementById('cart-overlay');
    var cartCloseBtn  = document.getElementById('cart-close-btn');
    var cartItemsList = document.getElementById('cart-items-list');
    var cartEmpty     = document.getElementById('cart-empty');
    var cartTotal     = document.getElementById('cart-total');
    var cartOrderBtn  = document.getElementById('cart-order-btn');
    var cartToast     = document.getElementById('cart-toast');
    var searchInput   = document.getElementById('hs-name');
    var catTabs       = document.querySelectorAll('.cat-tab');
    var sortSelect    = document.getElementById('bs-sort-select');

    var cqBackdrop      = document.getElementById('cq-backdrop');
    var cqModal         = document.getElementById('cq-modal');
    var cqCloseBtn      = document.getElementById('cq-close-btn');
    var cqItemsWrap     = document.getElementById('cq-items-wrap');
    var cqItemCount     = document.getElementById('cq-item-count');
    var cqSubtotal      = document.getElementById('cq-subtotal');
    var cqShipping      = document.getElementById('cq-shipping');
    var cqGrandTotal    = document.getElementById('cq-grand-total');
    var cqCheckoutBtn   = document.getElementById('cq-checkout-btn');
    var cqUpsellPrev    = document.getElementById('cq-upsell-prev');
    var cqUpsellNext    = document.getElementById('cq-upsell-next');
    var cqUpsellImg     = document.getElementById('cq-upsell-img');
    var cqUpsellName    = document.getElementById('cq-upsell-name');
    var cqUpsellPrice   = document.getElementById('cq-upsell-price');
    var cqUpsellAdd     = document.getElementById('cq-upsell-add');
    var cqAddrSelected  = document.getElementById('cq-addr-selected');
    var cqAddrExpandBtn = document.getElementById('cq-addr-expand-btn');
    var cqAddrArrow     = document.getElementById('cq-addr-arrow');
    var cqAddrList      = document.getElementById('cq-addr-list');
    var cqStoreSelected  = document.getElementById('cq-store-selected');
    var cqStoreExpandBtn = document.getElementById('cq-store-expand-btn');
    var cqStoreArrow     = document.getElementById('cq-store-arrow');
    var cqStoreList      = document.getElementById('cq-store-list');
    var cqTicketSelect   = document.getElementById('cq-ticket-select');
    var cqTicketInfo     = document.getElementById('cq-ticket-info');

    // ── State ────────────────────────────────────────────────────────────────
    // cart item: { varientId, name, price, qty }
    var cart              = [];
    var pendingItem       = null;
    var allProducts       = [];
    var allProductsByType = { food: [], combo: [], addon: [], drink: [] };
    var upsellItems       = [];
    var upsellIdx         = 0;
    var allAddresses      = [];
    var selectedAddress   = null;
    var addrDropdownOpen  = false;
    var allStores         = [];
    var selectedStore     = null;
    var storeDropdownOpen = false;
    var userPickedStore   = false;
    var selectedTicket    = null;
    var currentSearchResults = null;

    var CART_KEY = 'chonlibi_cart';

    // ── Helpers ──────────────────────────────────────────────────────────────
    function formatPrice(num) { return num.toLocaleString('vi-VN') + ' đ'; }

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

    function storeDistanceKm(store) {
        if (!selectedAddress) return null;
        var ua = selectedAddress.address || selectedAddress.Address || selectedAddress;
        if (ua.latitude == null || ua.longitude == null) return null;
        var sa = store.address || store.Address || {};
        if (sa.latitude == null || sa.longitude == null) return null;
        return haversineKm(ua.latitude, ua.longitude, sa.latitude, sa.longitude);
    }

    function storeDirectionsUrl(store) {
        var sa = store.address || store.Address || {};
        if (sa.latitude == null || sa.longitude == null) return null;
        return 'https://www.google.com/maps/dir/?api=1&destination=' + sa.latitude + ',' + sa.longitude + '&travelmode=driving';
    }

    function renderStoreSelected() {
        if (!cqStoreSelected) return;
        if (!allStores.length) {
            cqStoreSelected.innerHTML = '<span class="cq-store-loading">Không tải được danh sách cửa hàng.</span>';
            if (cqStoreExpandBtn) cqStoreExpandBtn.style.display = 'none';
            return;
        }
        var s = selectedStore || allStores[0];
        var isNearest = !userPickedStore;
        var dist = storeDistanceKm(s);
        var mapsUrl = storeDirectionsUrl(s);
        cqStoreSelected.innerHTML =
            '<div class="cq-store-name">' + (s.storeName || s.StoreName || 'Cửa hàng') +
            (isNearest ? '<span class="cq-store-badge">Gần nhất</span>' : '') + '</div>' +
            '<div class="cq-store-addr">' + storeAddressText(s) + '</div>' +
            (dist !== null ? '<div class="cq-store-dist"><i class="ti-map"></i> ' + dist.toFixed(1) + ' km</div>' : '') +
            (mapsUrl ? '<a class="cq-store-map-link" href="' + mapsUrl + '" target="_blank" onclick="event.stopPropagation()">🗺️ Chỉ đường Google Maps</a>' : '');
        var others = allStores.filter(function (x) { return (x.storeID || x.StoreID) !== (s.storeID || s.StoreID); });
        if (cqStoreExpandBtn) cqStoreExpandBtn.style.display = others.length ? 'flex' : 'none';
    }

    function renderStoreList() {
        if (!cqStoreList) return;
        var curID = selectedStore ? (selectedStore.storeID || selectedStore.StoreID) : null;
        var others = allStores.filter(function (s) { return (s.storeID || s.StoreID) !== curID; });

        others.sort(function (a, b) {
            var da = storeDistanceKm(a);
            var db = storeDistanceKm(b);
            if (da === null && db === null) return 0;
            if (da === null) return 1;
            if (db === null) return -1;
            return da - db;
        });

        cqStoreList.innerHTML = '';
        others.forEach(function (s) {
            var dist = storeDistanceKm(s);
            var mapsUrl = storeDirectionsUrl(s);
            var item = document.createElement('div');
            item.className = 'cq-store-item';
            item.innerHTML =
                '<div class="cq-store-item-name">' + (s.storeName || s.StoreName || 'Cửa hàng') + '</div>' +
                '<div class="cq-store-item-addr">' + storeAddressText(s) + '</div>' +
                (dist !== null ? '<div class="cq-store-item-dist"><i class="ti-map"></i> ' + dist.toFixed(1) + ' km</div>' : '') +
                (mapsUrl ? '<a class="cq-store-item-map-link" href="' + mapsUrl + '" target="_blank" onclick="event.stopPropagation()">🗺️ Chỉ đường</a>' : '');
            item.addEventListener('click', function () {
                selectedStore = s;
                userPickedStore = true;
                storeDropdownOpen = false;
                cqStoreList.classList.remove('open');
                if (cqStoreArrow) cqStoreArrow.classList.remove('open');
                renderStoreSelected();
                renderStoreList();
                updateCQShipping();
            });
            cqStoreList.appendChild(item);
        });
    }

    function loadStores() {
        if (!cqStoreSelected) return;
        cqStoreSelected.innerHTML = '<span class="cq-store-loading">Đang tải cửa hàng...</span>';
        if (cqStoreExpandBtn) cqStoreExpandBtn.style.display = 'none';
        apiGet('/store/get-all')
            .then(function (r) { return r.ok ? r.json() : []; })
            .then(function (data) {
                allStores = Array.isArray(data) ? data : [];
                userPickedStore = false;
                selectedStore = nearestStore(selectedAddress);
                storeDropdownOpen = false;
                if (cqStoreList) cqStoreList.classList.remove('open');
                if (cqStoreArrow) cqStoreArrow.classList.remove('open');
                renderStoreSelected();
                renderStoreList();
            })
            .catch(function () {
                if (cqStoreSelected) cqStoreSelected.innerHTML = '<span class="cq-store-loading">Không thể tải cửa hàng.</span>';
            });
    }

    if (cqStoreExpandBtn) {
        cqStoreExpandBtn.addEventListener('click', function () {
            storeDropdownOpen = !storeDropdownOpen;
            if (storeDropdownOpen) {
                cqStoreList.classList.add('open');
                if (cqStoreArrow) cqStoreArrow.classList.add('open');
            } else {
                cqStoreList.classList.remove('open');
                if (cqStoreArrow) cqStoreArrow.classList.remove('open');
            }
        });
    }

    // ── Ticket ───────────────────────────────────────────────────────────────
    function loadTickets() {
        if (!cqTicketSelect) return;
        selectedTicket = null;
        cqTicketSelect.innerHTML = '<option value="">-- Không dùng mã giảm giá --</option>';
        if (!isLoggedIn()) return;
        apiGet('/ticket/my-tickets')
            .then(function (r) { return r.ok ? r.json() : []; })
            .then(function (data) {
                var now = vnTodayISO();
                var valid = (Array.isArray(data) ? data : []).filter(function (tk) {
                    return !tk.usedAt && !tk.deletedAt &&
                           (tk.startDate || '') <= now &&
                           (tk.endDate   || '') >= now;
                });
                valid.forEach(function (tk) {
                    var code    = (tk.ticketID || '').toString().slice(0, 8).toUpperCase();
                    var discPct = Math.round((tk.discount || 0) * 100);
                    var opt     = document.createElement('option');
                    opt.value   = JSON.stringify(tk);
                    opt.textContent = code + ' – Giảm ' + discPct + '% (HSD: ' + (tk.endDate || '') + ')';
                    cqTicketSelect.appendChild(opt);
                });
            })
            .catch(function () {});
    }

    function applyTicketDiscount(subtotal) {
        if (!selectedTicket) return 0;
        return Math.round(subtotal * (selectedTicket.discount || 0));
    }

    if (cqTicketSelect) {
        cqTicketSelect.addEventListener('change', function () {
            if (!this.value) {
                selectedTicket = null;
                if (cqTicketInfo) cqTicketInfo.style.display = 'none';
            } else {
                try { selectedTicket = JSON.parse(this.value); } catch (e) { selectedTicket = null; }
                if (selectedTicket && cqTicketInfo) {
                    var discPct  = Math.round((selectedTicket.discount || 0) * 100);
                    cqTicketInfo.textContent = 'Giảm ' + discPct + '% — HSD: ' + (selectedTicket.endDate || '');
                    cqTicketInfo.style.display = 'block';
                }
            }
            updateCQShipping();
        });
    }

    function isLoggedIn()     { return !!localStorage.getItem('fullName'); }

    function saveCart() {
        try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    }

    function loadCart() {
        try {
            var raw = localStorage.getItem(CART_KEY);
            if (raw) { var parsed = JSON.parse(raw); if (Array.isArray(parsed)) cart = parsed; }
        } catch (e) {}
    }

    // ── Load & render Best Seller ─────────────────────────────────────────────
    var SIZE_SHORT = { Default: 'Mặc định', S: 'S', M: 'M', L: 'L', XL: 'XL' };

    function activeVariants(p) {
        var list = (p.productVarient || []).filter(function (v) {
            return v.isActive !== false && v.deletedAt == null;
        });
        if (!list.length) list = p.productVarient || [];
        list.sort(function (a, b) { return a.price - b.price; });
        return list;
    }

    // Số lượt bán của sản phẩm (robust với cả camelCase & PascalCase từ API)
    function soldOf(p) {
        var s = (p && p.soldCount != null) ? p.soldCount : (p ? p.SoldCount : 0);
        return Number(s) || 0;
    }

    // Thứ tự size: Default < S < M < L < XL
    var SIZE_RANK = { Default: 0, S: 1, M: 2, L: 3, XL: 4 };
    function sizeRank(v) {
        var s = v ? (v.size != null ? v.size : v.Size) : null;
        return (s != null && SIZE_RANK[s] != null) ? SIZE_RANK[s] : 99;
    }
    // Biến thể sắp theo size nhỏ→lớn (cùng size thì rẻ hơn đứng trước)
    function variantsBySize(p) {
        return activeVariants(p).slice().sort(function (a, b) {
            var r = sizeRank(a) - sizeRank(b);
            return r !== 0 ? r : (a.price - b.price);
        });
    }
    // Biến thể đại diện cho hiển thị card = size nhỏ nhất
    function smallestVariant(p) {
        return variantsBySize(p)[0];
    }
    // Biến thể có giá thấp nhất (dùng cho sắp xếp & lọc giá)
    function cheapestVariant(p) {
        var list = activeVariants(p);
        if (!list.length) return null;
        return list.reduce(function (min, v) { return v.price < min.price ? v : min; }, list[0]);
    }

    function makeCardHTML(p) {
        var variants    = variantsBySize(p);   // size nhỏ → lớn
        var defaultV    = variants[0];          // mặc định = size nhỏ nhất
        var escapedName = p.productName.replace(/"/g, '&quot;');

        var sizeHTML = '';
        if (variants.length > 1) {
            sizeHTML = '<div class="card-size-list">';
            variants.forEach(function (v, i) {
                sizeHTML += '<button class="card-size-chip' + (i === 0 ? ' selected' : '') + '"' +
                    ' data-vid="' + v.productVarientID + '" data-price="' + v.price + '"' +
                    ' data-size="' + (v.size || '') + '" data-for-people="' + (v.forPeople || '') + '">' +
                    (SIZE_SHORT[v.size] || v.size) + '</button>';
            });
            sizeHTML += '</div>';
        }

        return '<div class="menu-card" data-category="' + p.productType.toLowerCase() +
               '" data-name="' + escapedName + '" data-product-id="' + p.productID + '">' +
               '<div class="menu-card-img-wrap">' +
               (p.image ? '<img src="' + p.image + '" alt="' + escapedName + '" loading="lazy">' :
                          '<div class="menu-card-img-placeholder">🍗</div>') +
               '</div>' +
               '<div class="menu-card-body">' +
               '<h3 class="menu-card-name">' + p.productName + '</h3>' +
               '<p class="menu-card-desc">' + (p.description || '') + '</p>' +
               sizeHTML +
               '<div class="menu-card-footer">' +
               '<span class="menu-card-price">' + formatPrice(defaultV.price) + '</span>' +
               '<button class="menu-add-btn" data-varient-id="' + defaultV.productVarientID +
               '" data-price="' + defaultV.price + '" data-name="' + escapedName +
               '" data-size="' + (defaultV.size || '') + '" data-for-people="' + (defaultV.forPeople || '') +
               '" aria-label="Thêm ' + escapedName + ' vào giỏ"><i class="ti-plus"></i></button>' +
               '</div></div></div>';
    }

    function renderSection(products, gridEl) {
        if (!gridEl) return;
        gridEl.innerHTML = '';
        if (!products.length) {
            gridEl.innerHTML = '<p class="bs-empty">Chưa có sản phẩm.</p>';
            return;
        }
        products.forEach(function (p, i) {
            var tmp = document.createElement('div');
            tmp.innerHTML = makeCardHTML(p);
            var card = tmp.firstChild;
            card.style.opacity    = '0';
            card.style.transform  = 'translateY(20px)';
            card.style.transition = 'opacity 0.4s ease ' + (i * 40) + 'ms, transform 0.4s ease ' + (i * 40) + 'ms, box-shadow 0.28s ease';
            gridEl.appendChild(card);
            setTimeout(function () {
                card.style.opacity   = '1';
                card.style.transform = 'translateY(0)';
            }, 60 + i * 40);
        });
    }

    // ── URL param: ?category=combo1|combo2|combo3|combo4 ─────────────────────
    var COMBO_PEOPLE_MAP = { combo1: 1, combo2: 2, combo3: 3, combo4: 4 };
    var initCombo = COMBO_PEOPLE_MAP[(new URLSearchParams(window.location.search)).get('category')] || 0;

    // ── Filter state ─────────────────────────────────────────────────────────
    var filterState = {
        types:     { food: true, combo: true, addon: true, drink: true },
        minPrice:  0,
        maxPrice:  Infinity,
        forPeople: 0
    };

    function activeFilterCount() {
        var typeOff   = Object.values(filterState.types).filter(function (v) { return !v; }).length;
        var priceOn   = (filterState.minPrice > 0 || filterState.maxPrice < Infinity) ? 1 : 0;
        var peopleOn  = filterState.forPeople > 0 ? 1 : 0;
        return typeOff + priceOn + peopleOn;
    }

    function updateFilterBadge() {
        var badge = document.getElementById('bs-filter-badge');
        var btn   = document.getElementById('bs-filter-btn');
        var n = activeFilterCount();
        if (!badge) return;
        if (n > 0) { badge.textContent = n; badge.classList.add('visible'); if (btn) btn.classList.add('active'); }
        else        { badge.textContent = '';  badge.classList.remove('visible'); if (btn) btn.classList.remove('active'); }
    }

    function applyPriceFilter(products) {
        return products.filter(function (p) {
            var minV = cheapestVariant(p);
            if (!minV) return false;
            return minV.price >= filterState.minPrice && minV.price <= filterState.maxPrice;
        });
    }

    function applyPeopleFilter(products) {
        if (!filterState.forPeople) return products;
        var n = filterState.forPeople;
        return products.filter(function (p) {
            return (p.productVarient || []).some(function (v) {
                if (v.forPeople == null) return false;
                return n >= 5 ? v.forPeople >= 5 : v.forPeople === n;
            });
        });
    }

    function applyAllFilters(products) {
        return applyPeopleFilter(applyPriceFilter(products));
    }

    function applyFilterAndSort() {
        var sortKey = sortSelect ? sortSelect.value : 'bestseller';

        if (currentSearchResults !== null) {
            // Nếu đang trong chế độ tìm kiếm, chỉ lọc và sắp xếp trên kết quả tìm kiếm
            var filteredSearch = applyAllFilters(currentSearchResults);
            var sortedSearch = applySort(filteredSearch, sortKey);
            renderSection(sortedSearch, gridSearch);
            updateFilterBadge();
            return;
        }

        // "Tất cả" section — tổng hợp từ các loại còn bật
        var visibleAll = [];
        TYPE_KEYS.forEach(function (key) {
            if (filterState.types[key]) visibleAll = visibleAll.concat(allProductsByType[key]);
        });
        
        var filteredAll = applyAllFilters(visibleAll);
        var sortedAll = applySort(filteredAll, sortKey);
        renderSection(sortedAll.slice(0, 10), gridAll);

        // Cập nhật tiêu đề của section Tất cả cho phù hợp với cách sắp xếp
        var titleEl = document.querySelector('#section-all .menu-section-title');
        if (titleEl) {
            if (sortKey === 'price-asc') {
                titleEl.innerHTML = '<span class="cat-section-icon">🏆</span> Tất Cả (Giá Thấp → Cao)';
            } else if (sortKey === 'price-desc') {
                titleEl.innerHTML = '<span class="cat-section-icon">🏆</span> Tất Cả (Giá Cao → Thấp)';
            } else if (sortKey === 'name-az') {
                titleEl.innerHTML = '<span class="cat-section-icon">🏆</span> Tất Cả (Tên A → Z)';
            } else {
                titleEl.innerHTML = '<span class="cat-section-icon">🏆</span> Bán Chạy Nhất';
            }
        }

        // Các section theo loại
        TYPE_KEYS.forEach(function (key) {
            var section = document.getElementById('section-' + key);
            var grid    = document.getElementById('grid-' + key);
            if (!section) return;
            if (!filterState.types[key]) {
                section.style.display = 'none';
            } else {
                section.style.display = '';
                renderSection(applySort(applyAllFilters(allProductsByType[key]), sortKey), grid);
            }
        });

        updateFilterBadge();
    }

    // ── Sort ─────────────────────────────────────────────────────────────────
    function applySort(products, sortKey) {
        var list = products.slice();
        if (sortKey === 'price-asc') {
            // Sắp xếp theo giá thấp nhất của sản phẩm (chọn phân loại rẻ nhất)
            list.sort(function (a, b) {
                var va = cheapestVariant(a);
                var vb = cheapestVariant(b);
                var pa = va ? va.price : Infinity;
                var pb = vb ? vb.price : Infinity;
                return pa - pb;
            });
        } else if (sortKey === 'price-desc') {
            // Sắp xếp theo giá cao nhất của sản phẩm (chọn phân loại rẻ nhất để so sánh)
            list.sort(function (a, b) {
                var va = cheapestVariant(a);
                var vb = cheapestVariant(b);
                var pa = va ? va.price : -Infinity;
                var pb = vb ? vb.price : -Infinity;
                return pb - pa;
            });
        } else if (sortKey === 'name-az') {
            list.sort(function (a, b) { return a.productName.localeCompare(b.productName, 'vi'); });
        } else {
            // bestseller: sắp xếp theo số lượt bán (cao → thấp)
            list.sort(function (a, b) { return soldOf(b) - soldOf(a); });
        }
        return list;
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            if (allProducts.length) applyFilterAndSort();
        });
    }

    // ── Filter panel UI ──────────────────────────────────────────────────────
    var PRICE_MAX = 1000000;

    var bsFilterBtn      = document.getElementById('bs-filter-btn');
    var bsFilterPanel    = document.getElementById('bs-filter-panel');
    var bsFilterApplyBtn = document.getElementById('bs-filter-apply-btn');
    var bsFilterResetBtn = document.getElementById('bs-filter-reset-btn');
    var bsRangeMin       = document.getElementById('bs-price-min');
    var bsRangeMax       = document.getElementById('bs-price-max');
    var bsSliderFill     = document.getElementById('bs-slider-fill');
    var bsLabelMin       = document.getElementById('bs-label-min');
    var bsLabelMax       = document.getElementById('bs-label-max');

    function updateSliderFill() {
        if (!bsRangeMin || !bsSliderFill) return;
        var lo = parseInt(bsRangeMin.value, 10);
        var hi = parseInt(bsRangeMax.value, 10);
        var pctLo = (lo / PRICE_MAX) * 100;
        var pctHi = (hi / PRICE_MAX) * 100;
        bsSliderFill.style.left  = pctLo + '%';
        bsSliderFill.style.width = (pctHi - pctLo) + '%';
        if (bsLabelMin) bsLabelMin.textContent = lo.toLocaleString('vi-VN') + ' đ';
        if (bsLabelMax) bsLabelMax.textContent = (hi >= PRICE_MAX ? PRICE_MAX.toLocaleString('vi-VN') + '+ đ' : hi.toLocaleString('vi-VN') + ' đ');
    }

    function onRangeChange(changedEl) {
        var lo = parseInt(bsRangeMin.value, 10);
        var hi = parseInt(bsRangeMax.value, 10);
        if (lo > hi) {
            if (changedEl === bsRangeMin) {
                bsRangeMin.value = hi;
            } else {
                bsRangeMax.value = lo;
            }
        }
        // z-index: khi cả hai về 0, thumb min nằm trên để có thể kéo phải
        bsRangeMin.style.zIndex = (parseInt(bsRangeMin.value, 10) === PRICE_MAX) ? 2 : 1;
        updateSliderFill();
    }

    if (bsRangeMin) {
        bsRangeMin.addEventListener('input', function () { onRangeChange(bsRangeMin); });
    }
    if (bsRangeMax) {
        bsRangeMax.addEventListener('input', function () { onRangeChange(bsRangeMax); });
    }

    updateSliderFill();

    if (bsFilterBtn) {
        bsFilterBtn.addEventListener('click', function () {
            var open = bsFilterPanel.classList.toggle('open');
            bsFilterBtn.setAttribute('aria-expanded', open);
            bsFilterPanel.setAttribute('aria-hidden', !open);
        });
    }

    if (bsFilterApplyBtn) {
        bsFilterApplyBtn.addEventListener('click', function () {
            document.querySelectorAll('input[name="bs-type"]').forEach(function (cb) {
                filterState.types[cb.value] = cb.checked;
            });
            var lo = parseInt(bsRangeMin.value, 10);
            var hi = parseInt(bsRangeMax.value, 10);
            filterState.minPrice = lo;
            filterState.maxPrice = (hi >= PRICE_MAX) ? Infinity : hi;
            var peopleRadio = document.querySelector('input[name="bs-people"]:checked');
            filterState.forPeople = peopleRadio ? parseInt(peopleRadio.value, 10) : 0;
            if (allProducts.length) applyFilterAndSort();
            bsFilterPanel.classList.remove('open');
            bsFilterBtn.setAttribute('aria-expanded', 'false');
        });
    }

    if (bsFilterResetBtn) {
        bsFilterResetBtn.addEventListener('click', function () {
            document.querySelectorAll('input[name="bs-type"]').forEach(function (cb) { cb.checked = true; });
            var allPeople = document.querySelector('input[name="bs-people"][value="0"]');
            if (allPeople) allPeople.checked = true;
            if (bsRangeMin) bsRangeMin.value = 0;
            if (bsRangeMax) bsRangeMax.value = PRICE_MAX;
            updateSliderFill();
            filterState = { types: { food: true, combo: true, addon: true, drink: true }, minPrice: 0, maxPrice: Infinity, forPeople: 0 };
            if (allProducts.length) applyFilterAndSort();
            bsFilterPanel.classList.remove('open');
            bsFilterBtn.setAttribute('aria-expanded', 'false');
            updateFilterBadge();
        });
    }

    var TYPE_MAP  = { food: 'Food', combo: 'Combo', addon: 'Addon', drink: 'Drink' };
    var TYPE_KEYS = ['food', 'combo', 'addon', 'drink'];

    function fetchByType(type) {
        return apiPost('/product/search', { Type: type })
            .then(function (res) { return res.ok ? res.json() : []; })
            .then(function (data) { return Array.isArray(data) ? data : []; })
            .catch(function () { return []; });
    }

    function loadAllProducts() {
        allProducts = [];
        TYPE_KEYS.forEach(function (key) {
            allProductsByType[key] = [];
            var grid = document.getElementById('grid-' + key);
            if (grid) grid.innerHTML = '<p class="bs-loading"><span class="bs-spinner"></span> Đang tải...</p>';
        });

        Promise.all(TYPE_KEYS.map(function (key) {
            return fetchByType(TYPE_MAP[key]).then(function (data) { return { key: key, data: data }; });
        }))
        .then(function (results) {
            results.forEach(function (r) {
                var valid = r.data.filter(function (p) { return p.productVarient && p.productVarient.length; });
                allProductsByType[r.key] = valid;
                allProducts = allProducts.concat(valid);
            });

            upsellItems = allProducts.slice(0, 3).map(function (p) {
                var v = smallestVariant(p);
                return { varientId: v.productVarientID, name: p.productName, price: v.price, img: p.image || '', variantLabel: buildVariantLabel(v.size, v.forPeople) };
            });
            if (!upsellItems.length) upsellItems = [{ varientId: null, name: 'Đang cập nhật...', price: 0, img: '' }];
            upsellIdx = 0;
            renderUpsell();

            applyFilterAndSort();

            initScrollSpy();

            if (initCombo) {
                setActiveTab('combo');
                setTimeout(function () {
                    var section = document.getElementById('section-combo');
                    if (section) {
                        var top = section.getBoundingClientRect().top + window.scrollY - 115;
                        window.scrollTo({ top: top, behavior: 'smooth' });
                    }
                }, 80);
            }
        })
        .catch(function () {
            TYPE_KEYS.forEach(function (key) {
                var grid = document.getElementById('grid-' + key);
                if (grid) grid.innerHTML = '<p class="bs-empty">Không thể tải sản phẩm.</p>';
            });
        });
    }

    // ── Scroll Spy ───────────────────────────────────────────────────────────
    function setActiveTab(category) {
        catTabs.forEach(function (t) { t.classList.remove('active'); });
        var target = document.querySelector('.cat-tab[data-category="' + category + '"]');
        if (target) target.classList.add('active');
    }

    function initScrollSpy() {
        var sections = document.querySelectorAll('.menu-cat-section');
        if (!sections.length || !('IntersectionObserver' in window)) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    setActiveTab(entry.target.dataset.category);
                }
            });
        }, { rootMargin: '-110px 0px -60% 0px', threshold: 0 });

        sections.forEach(function (s) { observer.observe(s); });
    }

    // ── Upsell ───────────────────────────────────────────────────────────────
    function renderUpsell() {
        if (!upsellItems.length) return;
        var u = upsellItems[upsellIdx];
        if (cqUpsellImg) { cqUpsellImg.src = u.img; cqUpsellImg.alt = u.name; }
        if (cqUpsellName)  cqUpsellName.textContent  = u.name;
        if (cqUpsellPrice) cqUpsellPrice.textContent = formatPrice(u.price);
        if (cqUpsellAdd) {
            cqUpsellAdd.onclick = function () {
                if (u.varientId) addToCart(u.name, u.price, u.varientId, u.variantLabel);
            };
        }
    }

    if (cqUpsellPrev) cqUpsellPrev.addEventListener('click', function () {
        upsellIdx = (upsellIdx - 1 + upsellItems.length) % upsellItems.length;
        renderUpsell();
    });
    if (cqUpsellNext) cqUpsellNext.addEventListener('click', function () {
        upsellIdx = (upsellIdx + 1) % upsellItems.length;
        renderUpsell();
    });

    // ── Product Detail Modal ─────────────────────────────────────────────────
    var pdCurrentProduct = null;
    var pdSelectedVariant = null;

    var TYPE_LABEL_VN = { Food: 'Đồ Ăn', Combo: 'Combo', Addon: 'Món Phụ', Drink: 'Đồ Uống' };
    var SIZE_LABEL    = { Default: 'Tiêu chuẩn', S: 'Nhỏ (S)', M: 'Vừa (M)', L: 'Lớn (L)', XL: 'Cỡ XL' };
    var PEOPLE_LABEL  = { 1: '1 người', 2: '2 người (cặp đôi)', 3: '3 người (hội bạn)', 4: '4 người (gia đình)' };

    function buildVariantLabel(size, forPeople) {
        var parts = [];
        if (forPeople) parts.push(forPeople + ' người');
        if (size && size !== 'Default') parts.push(SIZE_LABEL[size] || size);
        return parts.join(' · ');
    }

    function renderPdPeople(variant) {
        if (!pdPeople || !pdPeopleText) return;
        var n = variant && variant.forPeople;
        if (n) {
            pdPeopleText.textContent = 'Phù hợp cho ' + (PEOPLE_LABEL[n] || n + ' người');
            pdPeople.style.display = '';
        } else {
            pdPeople.style.display = 'none';
        }
    }

    function openProductDetail(product) {
        pdCurrentProduct = product;

        // Image
        if (product.image) {
            pdImg.src = product.image;
            pdImg.onload = function () { pdImg.classList.add('loaded'); pdImgPlaceholder.style.display = 'none'; };
            pdImg.onerror = function () { pdImg.classList.remove('loaded'); pdImgPlaceholder.style.display = 'flex'; };
            pdImg.classList.remove('loaded');
            pdImgPlaceholder.style.display = 'flex';
        } else {
            pdImg.classList.remove('loaded');
            pdImgPlaceholder.style.display = 'flex';
        }

        // Meta
        pdTypeBadge.textContent = TYPE_LABEL_VN[product.productType] || product.productType;
        pdName.textContent = product.productName;
        pdDesc.textContent = product.description || 'Chưa có mô tả cho món này.';

        // Variants — lọc active
        var variants = (product.productVarient || []).filter(function (v) {
            return v.isActive !== false && v.deletedAt == null;
        });
        if (!variants.length) variants = product.productVarient || [];

        // Sắp xếp theo size nhỏ → lớn (cùng size thì giá tăng dần)
        variants.sort(function (a, b) {
            var r = sizeRank(a) - sizeRank(b);
            return r !== 0 ? r : (a.price - b.price);
        });

        // Nếu đang lọc theo số người, ưu tiên variant khớp forPeople; fallback về size nhỏ nhất
        var targetPeople = filterState.forPeople || initCombo;
        var matched = targetPeople
            ? variants.find(function (v) { return v.forPeople === targetPeople; })
            : null;
        pdSelectedVariant = matched || variants[0];

        if (variants.length > 1) {
            pdSizeSection.classList.add('visible');
            pdSizeList.innerHTML = '';
            variants.forEach(function (v) {
                var btn = document.createElement('button');
                btn.className = 'pd-size-btn' + (v === pdSelectedVariant ? ' selected' : '');
                var peopleHtml = v.forPeople
                    ? '<span class="pd-size-people"><i class="ti-user"></i> ' + v.forPeople + ' người</span>'
                    : '';
                btn.innerHTML =
                    '<span class="pd-size-name">' + (SIZE_LABEL[v.size] || v.size) + '</span>' +
                    peopleHtml +
                    '<span class="pd-size-price">' + formatPrice(v.price) + '</span>';
                btn.addEventListener('click', function () {
                    pdSelectedVariant = v;
                    pdSizeList.querySelectorAll('.pd-size-btn').forEach(function (b) { b.classList.remove('selected'); });
                    btn.classList.add('selected');
                    pdPrice.textContent = formatPrice(v.price);
                    renderPdPeople(v);
                });
                pdSizeList.appendChild(btn);
            });
        } else {
            pdSizeSection.classList.remove('visible');
        }

        pdPrice.textContent = formatPrice(pdSelectedVariant.price);
        renderPdPeople(pdSelectedVariant);

        // Add-to-cart button
        pdAddBtn.onclick = function () {
            if (!pdSelectedVariant) return;
            var label = buildVariantLabel(pdSelectedVariant.size, pdSelectedVariant.forPeople);
            addToCart(product.productName, pdSelectedVariant.price, pdSelectedVariant.productVarientID, label);
            closePDModal();
        };

        // Open
        pdBackdrop.classList.add('active');
        pdModal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closePDModal() {
        pdBackdrop.classList.remove('active');
        pdModal.classList.remove('open');
        document.body.style.overflow = '';
        pdImg.classList.remove('loaded');
        pdCurrentProduct = null;
    }

    pdCloseBtn.addEventListener('click', closePDModal);
    pdBackdrop.addEventListener('click', closePDModal);

    // Click card → mở detail (không kích hoạt khi click nút "+" hoặc size chip)
    document.addEventListener('click', function (e) {
        if (e.target.closest('.menu-add-btn')) return;
        if (e.target.closest('.card-size-chip')) return;
        var card = e.target.closest('.menu-card');
        if (!card) return;
        var productId = parseInt(card.dataset.productId, 10);
        if (!productId) return;
        var product = allProducts.find(function (p) { return p.productID === productId; });
        if (product) openProductDetail(product);
    });

    // ── Auth modal ───────────────────────────────────────────────────────────
    var menuLoginModal    = document.getElementById('menu-login-modal');
    var menuCloseLoginBtn = document.getElementById('menu-closeLoginBtn');
    var menuBtnLogin      = document.getElementById('menu-btn-login');
    var menuBtnRegister   = document.getElementById('menu-btn-register');
    var menuLoginErr      = document.getElementById('menu-login-error');
    var menuRegErr        = document.getElementById('menu-register-error');

    function openAuthModal(itemName) {
        var existingHint = menuLoginModal.querySelector('.menu-auth-pending-hint');
        if (existingHint) existingHint.remove();
        if (itemName) {
            var hint = document.createElement('div');
            hint.className = 'menu-auth-pending-hint';
            hint.innerHTML = '<span class="pending-icon">🍗</span><div>Thêm <span class="menu-auth-pending-item-name">' +
                             itemName + '</span> vào giỏ hàng sau khi đăng nhập</div>';
            var tabs = menuLoginModal.querySelector('.modal-tabs');
            tabs.parentNode.insertBefore(hint, tabs);
        }
        menuLoginModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        menuLoginModal.querySelector('[data-tab="login"]').click();
        setTimeout(function () {
            var inp = document.getElementById('menu-login-username');
            if (inp) inp.focus();
        }, 300);
    }

    function closeAuthModal() {
        menuLoginModal.classList.remove('active');
        document.body.style.overflow = '';
        if (menuLoginErr) menuLoginErr.textContent = '';
        if (menuRegErr)   menuRegErr.textContent   = '';
    }

    // Nút đăng nhập trên header mở auth modal
    var headerLoginBtn = document.getElementById('openLoginBtn');
    if (headerLoginBtn) {
        headerLoginBtn.addEventListener('click', function () { openAuthModal(null); });
    }

    // Header Nav Toggle (Home / User)
    (function () {
        var homeBtn = document.getElementById('nav-toggle-home');
        var userBtn = document.getElementById('nav-toggle-user');
        var thumb   = document.getElementById('nav-toggle-thumb');
        if (!homeBtn || !userBtn) return;

        homeBtn.classList.add('active');
        userBtn.classList.remove('active');
        if (thumb) thumb.classList.remove('on-user');

        homeBtn.addEventListener('click', function () {
            var role = localStorage.getItem('role');
            if ((role === 'admin' || role === 'employee') && !isTokenExpired()) {
                window.location.href = role === 'admin' ? 'admin.html' : 'employee.html';
            } else {
                window.location.href = 'index.html';
            }
        });

        userBtn.addEventListener('click', function () {
            var fullName = localStorage.getItem('fullName');
            var role     = localStorage.getItem('role');
            if (fullName && !isTokenExpired()) {
                if (role === 'admin') {
                    window.location.href = 'admin.html';
                } else if (role === 'employee') {
                    window.location.href = 'employee.html';
                } else {
                    window.location.href = 'user.html';
                }
            } else {
                if (menuLoginModal) menuLoginModal.classList.add('active');
            }
        });
    })();

    menuCloseLoginBtn.addEventListener('click', function () { pendingItem = null; closeAuthModal(); });
    menuLoginModal.addEventListener('click', function (e) {
        if (e.target === menuLoginModal) { pendingItem = null; closeAuthModal(); }
    });

    menuLoginModal.querySelectorAll('.modal-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            menuLoginModal.querySelectorAll('.modal-tab').forEach(function (t) { t.classList.remove('active'); });
            menuLoginModal.querySelectorAll('.modal-panel').forEach(function (p) { p.classList.remove('active'); });
            this.classList.add('active');
            document.getElementById('menu-panel-' + this.dataset.tab).classList.add('active');
        });
    });

    function onAuthSuccess(fullName) {
        closeAuthModal();
        updateMenuHeader(fullName);
        if (pendingItem) {
            var item = pendingItem;
            pendingItem = null;
            addToCart(item.name, item.price, item.varientId, item.variantLabel);
        }
    }

    function updateMenuHeader(fullName) {
        // Hiện nút Giỏ Hàng
        var cartFab = document.getElementById('cart-fab');
        if (cartFab) cartFab.style.display = '';
    }

    // Đăng nhập
    menuBtnLogin.addEventListener('click', function () {
        var username = document.getElementById('menu-login-username').value.trim();
        var password = document.getElementById('menu-login-password').value;
        menuLoginErr.textContent = '';
        if (!username || !password) { menuLoginErr.textContent = 'Vui lòng nhập tên đăng nhập và mật khẩu.'; return; }

        var body = { UserName: username, HashPassword: password };
        apiPost('/auth/customer_login', body)
            .then(function (res) {
                if (res.ok) return res.json().then(function (d) { return { ok: true, data: d.data }; });
                return apiPost('/auth/employee_login', body)
                    .then(function (r2) {
                        if (r2.ok) return r2.json().then(function (d) { return { ok: true, data: d.data, emp: true }; });
                        return r2.json().then(function (d) { return { ok: false, msg: d.message || 'Sai tên đăng nhập hoặc mật khẩu.' }; });
                    });
            })
            .then(function (result) {
                if (!result.ok) { menuLoginErr.textContent = result.msg; return; }
                if (result.emp) {
                    luuThongTinNhanVien(result.data);
                } else {
                    luuThongTinKhachHang(result.data);
                }
                onAuthSuccess(result.data.fullName || result.data.FullName);
            })
            .catch(function () { menuLoginErr.textContent = 'Lỗi kết nối máy chủ.'; });
    });

    document.getElementById('menu-login-password').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') menuBtnLogin.click();
    });

    // Đăng ký
    menuBtnRegister.addEventListener('click', function () {
        var fullName  = document.getElementById('menu-reg-fullname').value.trim();
        var username  = document.getElementById('menu-reg-username').value.trim();
        var phone     = document.getElementById('menu-reg-phone').value.trim();
        var email     = document.getElementById('menu-reg-email').value.trim();
        var birthdate = document.getElementById('menu-reg-birthdate').value;
        var gender    = document.getElementById('menu-reg-gender').value;
        var password  = document.getElementById('menu-reg-password').value;
        menuRegErr.textContent = '';

        if (!fullName || !username || !phone || !email || !birthdate || !password) {
            menuRegErr.textContent = 'Vui lòng điền đầy đủ các trường.'; return;
        }
        if (password.length < 6) { menuRegErr.textContent = 'Mật khẩu phải có ít nhất 6 ký tự.'; return; }

        apiPost('/auth/register', {
            UserName: username, HashPassword: password, FullName: fullName,
            BirthDate: birthdate, Phone: phone, Email: email, Gender: gender
        })
        .then(function (res) { return res.json().then(function (d) { return { status: res.status, data: d }; }); })
        .then(function (r) {
            if (r.status === 200) {
                alert('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản trước khi đăng nhập.');
                menuLoginModal.querySelector('[data-tab="login"]').click();
                document.getElementById('menu-login-username').value = username;
            } else {
                menuRegErr.textContent = r.data.message || 'Đăng ký thất bại.';
            }
        })
        .catch(function () { menuRegErr.textContent = 'Lỗi kết nối máy chủ.'; });
    });

    (function () {
        var name = localStorage.getItem('fullName');
        if (name) updateMenuHeader(name);
    })();

    // ── Cart ─────────────────────────────────────────────────────────────────
    var toastTimer;
    function showToast() {
        cartToast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { cartToast.classList.remove('show'); }, 2000);
    }

    function updateCartBadge() {
        var total = cart.reduce(function (s, i) { return s + i.qty; }, 0);
        cartCount.textContent = total;
        total > 0 ? cartCount.classList.add('visible') : cartCount.classList.remove('visible');
    }

    function updateCartTotal() {
        var total = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
        cartTotal.textContent = formatPrice(total);
    }

    function renderCart() {
        cartItemsList.querySelectorAll('.cart-item').forEach(function (el) { el.remove(); });
        if (cart.length === 0) {
            cartEmpty.style.display = 'flex';
            document.getElementById('cart-footer').style.display = 'none';
            return;
        }
        cartEmpty.style.display = 'none';
        document.getElementById('cart-footer').style.display = 'block';
        cart.forEach(function (item, idx) {
            var el = document.createElement('div');
            el.className = 'cart-item';
            el.innerHTML = '<div class="cart-item-qty">' +
                '<button class="qty-btn" data-action="minus" data-idx="' + idx + '" aria-label="Giảm">−</button>' +
                '<span class="qty-number">' + item.qty + '</span>' +
                '<button class="qty-btn" data-action="plus" data-idx="' + idx + '" aria-label="Tăng">+</button>' +
                '</div><span class="cart-item-name">' + item.name + '</span>' +
                '<span class="cart-item-price">' + formatPrice(item.price * item.qty) + '</span>';
            cartItemsList.appendChild(el);
        });
        updateCartTotal();
    }

    function addToCart(name, price, varientId, variantLabel) {
        if (!isLoggedIn()) {
            pendingItem = { name: name, price: price, varientId: varientId, variantLabel: variantLabel || '' };
            openAuthModal(name);
            return;
        }
        var existing = cart.find(function (i) { return i.varientId === varientId; });
        if (existing) { existing.qty++; } else {
            cart.push({ varientId: varientId, name: name, price: price, qty: 1, variantLabel: variantLabel || '' });
        }
        saveCart();
        updateCartBadge();
        renderCart();
        showToast();
    }

    cartItemsList.addEventListener('click', function (e) {
        var btn = e.target.closest('.qty-btn');
        if (!btn) return;
        var idx    = parseInt(btn.dataset.idx, 10);
        var action = btn.dataset.action;
        if (action === 'plus')  { cart[idx].qty++; }
        else if (action === 'minus') {
            cart[idx].qty--;
            if (cart[idx].qty <= 0) cart.splice(idx, 1);
        }
        saveCart();
        updateCartBadge();
        renderCart();
    });

    // Event delegation — size chip trên card
    document.addEventListener('click', function (e) {
        var chip = e.target.closest('.card-size-chip');
        if (!chip) return;
        e.stopPropagation();
        var card = chip.closest('.menu-card');
        if (!card) return;

        // Highlight chip đang chọn
        card.querySelectorAll('.card-size-chip').forEach(function (c) { c.classList.remove('selected'); });
        chip.classList.add('selected');

        // Cập nhật giá hiển thị và data của nút "+"
        var price = parseFloat(chip.dataset.price) || 0;
        var vid   = parseInt(chip.dataset.vid, 10);
        var priceEl = card.querySelector('.menu-card-price');
        if (priceEl) priceEl.textContent = formatPrice(price);
        var addBtn = card.querySelector('.menu-add-btn');
        if (addBtn) {
            addBtn.dataset.varientId = vid;
            addBtn.dataset.price     = price;
            addBtn.dataset.size      = chip.dataset.size || '';
            addBtn.dataset.forPeople = chip.dataset.forPeople || '';
        }
    });

    // Event delegation cho nút "+" trên product cards (dynamic)
    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.menu-add-btn');
        if (!btn) return;
        e.stopPropagation();
        var varientId = btn.dataset.varientId ? parseInt(btn.dataset.varientId, 10) : null;
        var price     = parseFloat(btn.dataset.price) || 0;
        var name      = btn.dataset.name || '';
        if (!varientId) return;
        var label = buildVariantLabel(btn.dataset.size || '', parseInt(btn.dataset.forPeople, 10) || 0);
        addToCart(name, price, varientId, label);
        btn.style.transform = 'scale(1.4) rotate(90deg)';
        setTimeout(function () { btn.style.transform = ''; }, 300);
    });

    // ── Address Picker ───────────────────────────────────────────────────────
    function formatAddress(a) {
        var parts = [];
        if (a.streetAddress) parts.push(a.streetAddress);
        if (a.district)      parts.push(a.district);
        if (a.province)      parts.push(a.province);
        return parts.join(', ');
    }

    function renderAddrSelected() {
        if (!cqAddrSelected) return;
        if (!allAddresses.length) {
            cqAddrSelected.innerHTML =
                '<span class="cq-addr-none">Bạn chưa có địa chỉ giao hàng. ' +
                '<a id="cq-addr-add-link" style="cursor:pointer">Thêm ngay</a></span>';
            var addLink = document.getElementById('cq-addr-add-link');
            if (addLink) addLink.addEventListener('click', openAddrPopup);
            if (cqAddrExpandBtn) cqAddrExpandBtn.style.display = 'none';
            return;
        }
        var a = selectedAddress;
        cqAddrSelected.innerHTML =
            '<div class="cq-addr-name">Địa chỉ ' + (a.isDefault ? 'mặc định' : 'đã chọn') + '</div>' +
            '<div class="cq-addr-text">' + formatAddress(a) + '</div>';

        var others = allAddresses.filter(function (x) { return x.addressID !== a.addressID; });
        if (cqAddrExpandBtn) {
            cqAddrExpandBtn.style.display = others.length ? 'flex' : 'none';
        }
    }

    function renderAddrList() {
        if (!cqAddrList) return;
        var others = allAddresses.filter(function (x) {
            return x.addressID !== (selectedAddress && selectedAddress.addressID);
        });
        cqAddrList.innerHTML = '';
        others.forEach(function (a) {
            var item = document.createElement('div');
            item.className = 'cq-addr-item';
            item.innerHTML =
                '<div class="cq-addr-item-text">' + formatAddress(a) + '</div>' +
                '<button class="cq-addr-set-default" data-id="' + a.addressID + '">Mặc định</button>';

            item.querySelector('.cq-addr-item-text').addEventListener('click', function () {
                selectedAddress = a;
                addrDropdownOpen = false;
                cqAddrList.classList.remove('open');
                if (cqAddrArrow) cqAddrArrow.classList.remove('open');
                renderAddrSelected();
                renderAddrList();
                updateCQShipping();
            });

            item.querySelector('.cq-addr-set-default').addEventListener('click', function (e) {
                e.stopPropagation();
                var btn = this;
                btn.disabled = true;
                btn.textContent = '...';
                apiPut('/address/set-default/' + a.addressID)
                    .then(function (res) {
                        if (!res.ok) throw new Error();
                        allAddresses.forEach(function (x) { x.isDefault = (x.addressID === a.addressID); });
                        selectedAddress = a;
                        addrDropdownOpen = false;
                        cqAddrList.classList.remove('open');
                        if (cqAddrArrow) cqAddrArrow.classList.remove('open');
                        renderAddrSelected();
                        renderAddrList();
                        updateCQShipping();
                    })
                    .catch(function () {
                        btn.disabled = false;
                        btn.textContent = 'Mặc định';
                        alert('Không thể đặt địa chỉ mặc định. Vui lòng thử lại.');
                    });
            });

            cqAddrList.appendChild(item);
        });
    }

    function loadAddresses() {
        if (!cqAddrSelected) return;
        cqAddrSelected.innerHTML = '<span class="cq-addr-loading">Đang tải địa chỉ...</span>';
        if (cqAddrExpandBtn) cqAddrExpandBtn.style.display = 'none';
        allAddresses = [];
        selectedAddress = null;

        if (!isLoggedIn()) {
            cqAddrSelected.innerHTML =
                '<span class="cq-addr-none">Vui lòng đăng nhập để chọn địa chỉ giao hàng.</span>';
            return;
        }

        apiGet('/address/my-addresses')
            .then(function (res) { return res.ok ? res.json() : []; })
            .then(function (data) {
                allAddresses = Array.isArray(data) ? data : [];
                var def = allAddresses.find(function (a) { return a.isDefault; });
                selectedAddress = def || allAddresses[0] || null;
                addrDropdownOpen = false;
                if (cqAddrList) cqAddrList.classList.remove('open');
                if (cqAddrArrow) cqAddrArrow.classList.remove('open');
                renderAddrSelected();
                renderAddrList();
                updateCQShipping();
            })
            .catch(function () {
                cqAddrSelected.innerHTML =
                    '<span class="cq-addr-none">Không thể tải địa chỉ. Vui lòng thử lại.</span>';
            });
    }

    if (cqAddrExpandBtn) {
        cqAddrExpandBtn.addEventListener('click', function () {
            addrDropdownOpen = !addrDropdownOpen;
            if (addrDropdownOpen) {
                cqAddrList.classList.add('open');
                if (cqAddrArrow) cqAddrArrow.classList.add('open');
            } else {
                cqAddrList.classList.remove('open');
                if (cqAddrArrow) cqAddrArrow.classList.remove('open');
            }
        });
    }

    // ── Add Address Popup ────────────────────────────────────────────────────
    var addrPopupOverlay = document.getElementById('addr-popup-overlay');
    var addrPopup        = document.getElementById('addr-popup');
    var addrPopupClose   = document.getElementById('addr-popup-close');
    var addrCancelBtn    = document.getElementById('addr-cancel-btn');
    var addrSubmitBtn    = document.getElementById('addr-submit-btn');
    var addrFormError    = document.getElementById('addr-form-error');

    function openAddrPopup() {
        ['addr-street-address','addr-district','addr-province']
            .forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
        if (addrFormError) addrFormError.textContent = '';
        addrPopupOverlay.classList.add('active');
        addrPopup.classList.add('open');
        document.body.style.overflow = 'hidden';
        var first = document.getElementById('addr-street-address');
        if (first) setTimeout(function () { first.focus(); }, 250);
    }

    function closeAddrPopup() {
        addrPopupOverlay.classList.remove('active');
        addrPopup.classList.remove('open');
        document.body.style.overflow = 'hidden'; // CQ modal vẫn mở
    }

    if (addrPopupClose)   addrPopupClose.addEventListener('click', closeAddrPopup);
    if (addrCancelBtn)    addrCancelBtn.addEventListener('click', closeAddrPopup);
    if (addrPopupOverlay) addrPopupOverlay.addEventListener('click', closeAddrPopup);

    var cqAddrAddBtn = document.getElementById('cq-addr-add-btn');
    if (cqAddrAddBtn) cqAddrAddBtn.addEventListener('click', openAddrPopup);

    if (addrSubmitBtn) {
        addrSubmitBtn.addEventListener('click', function () {
            var streetAddress = document.getElementById('addr-street-address').value.trim();
            var district      = document.getElementById('addr-district').value.trim();
            var province      = document.getElementById('addr-province').value.trim();

            if (!streetAddress || !district || !province) {
                addrFormError.textContent = 'Vui lòng điền đầy đủ các trường bắt buộc.';
                return;
            }

            addrFormError.textContent = '';
            addrSubmitBtn.disabled = true;
            addrSubmitBtn.innerHTML = '<i class="ti-reload"></i> Đang lưu...';

            var body = { StreetAddress: streetAddress, District: district, Province: province };

            apiPost('/address/add', body)
                .then(function (res) {
                    if (!res.ok) return res.text().then(function (t) { throw new Error(t || 'Lỗi khi thêm địa chỉ.'); });
                    closeAddrPopup();
                    loadAddresses();
                })
                .catch(function (err) {
                    addrFormError.textContent = err.message || 'Không thể thêm địa chỉ. Vui lòng thử lại.';
                })
                .finally(function () {
                    addrSubmitBtn.disabled = false;
                    addrSubmitBtn.innerHTML = '<i class="ti-check"></i> Lưu địa chỉ';
                });
        });
    }

    // ── CQ Modal ─────────────────────────────────────────────────────────────
    function renderCQModal() {
        cqItemsWrap.innerHTML = '';
        cart.forEach(function (item, idx) {
            var el = document.createElement('div');
            el.className = 'cq-item';
            var variantHtml = item.variantLabel
                ? '<span class="cq-item-variant">' + item.variantLabel + '</span>'
                : '';
            el.innerHTML = '<div class="cq-item-qty-ctrl">' +
                '<button class="cq-qty-btn" data-action="minus" data-idx="' + idx + '" aria-label="Giảm">−</button>' +
                '<span class="cq-qty-num">' + item.qty + '</span>' +
                '<button class="cq-qty-btn" data-action="plus" data-idx="' + idx + '" aria-label="Tăng">+</button>' +
                '</div><div class="cq-item-info"><span class="cq-item-name">' + item.name + '</span>' +
                variantHtml + '</div>' +
                '<span class="cq-item-price">' + formatPrice(item.price * item.qty) + '</span>';
            cqItemsWrap.appendChild(el);
        });
        var totalItems = cart.reduce(function (s, i) { return s + i.qty; }, 0);
        cqItemCount.textContent = totalItems + ' món';
        var subtotal = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
        cqSubtotal.textContent   = formatPrice(subtotal);
        updateCQShipping();
    }

    var MAX_DELIVERY_KM = 50;

    function setCheckoutBlocked(blocked, message) {
        if (!cqCheckoutBtn) return;
        cqCheckoutBtn.disabled = blocked;
        cqCheckoutBtn.style.opacity = blocked ? '0.45' : '';
        cqCheckoutBtn.title = blocked ? message : '';
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
        var subtotal    = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
        var distanceEl  = document.getElementById('cq-distance');
        var discountRow = document.getElementById('cq-discount-row');
        var discountEl  = document.getElementById('cq-discount');

        var discountAmt = applyTicketDiscount(subtotal);
        if (discountAmt > 0 && discountRow && discountEl) {
            discountRow.style.display = '';
            discountEl.textContent    = '-' + formatPrice(discountAmt);
        } else if (discountRow) {
            discountRow.style.display = 'none';
        }

        if (!userPickedStore && allStores.length) {
            selectedStore = nearestStore(selectedAddress);
            renderStoreSelected();
            renderStoreList();
        }

        if (!selectedAddress) {
            cqShipping.textContent   = '0 đ';
            cqGrandTotal.textContent = formatPrice(subtotal - discountAmt);
            if (distanceEl) distanceEl.textContent = '';
            setCheckoutBlocked(false, '');
            return;
        }
        cqShipping.textContent = '...';
        if (distanceEl) distanceEl.textContent = '';
        var currentStoreID = selectedStore ? (selectedStore.storeID || selectedStore.StoreID) : null;
        fetchShippingFee(selectedAddress.addressID, currentStoreID).then(function (data) {
            if (data && !data.isDeliverable) {
                cqShipping.textContent   = 'Không hỗ trợ';
                cqGrandTotal.textContent = formatPrice(subtotal - discountAmt);
                if (distanceEl) distanceEl.textContent = '(' + data.distanceKm.toFixed(1) + ' km)';
                setCheckoutBlocked(true,
                    'Địa chỉ của bạn cách cửa hàng gần nhất ' + data.distanceKm.toFixed(1) +
                    ' km (tối đa ' + MAX_DELIVERY_KM + ' km). Chúng tôi không thể giao hàng đến khu vực này.');
                return;
            }
            var fee = data ? data.shippingFee : 0;
            var km  = data ? data.distanceKm  : null;
            cqShipping.textContent   = formatPrice(fee);
            cqGrandTotal.textContent = formatPrice(subtotal - discountAmt + fee);
            if (distanceEl) distanceEl.textContent = km != null ? '(' + km.toFixed(1) + ' km)' : '';
            setCheckoutBlocked(false, '');
        });
    }

    cqItemsWrap.addEventListener('click', function (e) {
        var btn = e.target.closest('.cq-qty-btn');
        if (!btn) return;
        var idx = parseInt(btn.dataset.idx, 10);
        if (btn.dataset.action === 'plus')  { cart[idx].qty++; }
        else { cart[idx].qty--; if (cart[idx].qty <= 0) cart.splice(idx, 1); }
        saveCart();
        updateCartBadge();
        renderCart();
        renderCQModal();
        if (cart.length === 0) closeCQModal();
    });

    function openCQModal()  {
        cqModal.classList.add('open');
        cqBackdrop.classList.add('active');
        document.body.style.overflow = 'hidden';
        loadAddresses();
        loadStores();
        loadTickets();
    }
    function closeCQModal() {
        cqModal.classList.remove('open');
        cqBackdrop.classList.remove('active');
        document.body.style.overflow = '';
        addrDropdownOpen = false;
        storeDropdownOpen = false;
        selectedTicket = null;
        if (cqTicketSelect) { cqTicketSelect.value = ''; }
        if (cqTicketInfo)   { cqTicketInfo.style.display = 'none'; }
        if (cqAddrList)   cqAddrList.classList.remove('open');
        if (cqAddrArrow)  cqAddrArrow.classList.remove('open');
        if (cqStoreList)  cqStoreList.classList.remove('open');
        if (cqStoreArrow) cqStoreArrow.classList.remove('open');
    }

    cqCloseBtn.addEventListener('click', closeCQModal);
    cqBackdrop.addEventListener('click', closeCQModal);

    // ── Checkout ─────────────────────────────────────────────────────────────
    cqCheckoutBtn.addEventListener('click', function () {
        if (cart.length === 0) return;
        if (cqCheckoutBtn.disabled) return;
        if (!isLoggedIn()) { openAuthModal(null); return; }

        if (!selectedAddress) {
            alert('Bạn chưa có địa chỉ giao hàng. Vui lòng thêm địa chỉ trong trang tài khoản.');
            window.location.href = 'user.html';
            return;
        }

        var userId   = localStorage.getItem('userId');
        var products = cart.map(function (i) { return { ProductVarientID: i.varientId, qty: i.qty }; });
        var paymentRadio = document.querySelector('input[name="cq-payment"]:checked');
        var paymentMethod = paymentRadio ? paymentRadio.value : 'Cash';

        var storeID   = selectedStore ? (selectedStore.storeID || selectedStore.StoreID) : null;
        var ticketID  = selectedTicket ? (selectedTicket.ticketID || selectedTicket.TicketID || null) : null;
        var body = {
            UserID:         userId,
            StoreID:        storeID,
            AddressID:      selectedAddress.addressID,
            PaymentMethods: paymentMethod,
            products:       products
        };
        if (ticketID) body.TicketID = ticketID;
        apiPost('/bill/create-delivery', body)
        .then(function (res) {
            if (!res.ok) return res.text().then(function (t) { throw new Error(t); });
            return res.json();
        })
        .then(function (data) {
            closeCQModal();
            cart.length = 0;
            saveCart();
            updateCartBadge();
            renderCart();
            // Chuyển khoản SePay: hiện QR + poll trạng thái
            if (data && data.paymentMethods === 'BankTransfer' && data.qrUrl) {
                showSePayQrModal(data, function () {
                    alert('Thanh toán thành công!\nCảm ơn bạn đã tin tưởng Chônlibi!');
                });
            } else {
                alert('Đặt hàng thành công!\nCảm ơn bạn đã tin tưởng Chônlibi!');
            }
        })
        .catch(function (err) {
            alert('Đặt hàng thất bại. Vui lòng thử lại.\n' + err.message);
        });
    });

    // ── Cart sidebar ─────────────────────────────────────────────────────────
    function openCart()  { cartSidebar.classList.add('open');    cartOverlay.classList.add('active');    document.body.style.overflow = 'hidden'; renderCart(); }
    function closeCart() { cartSidebar.classList.remove('open'); cartOverlay.classList.remove('active'); document.body.style.overflow = ''; }

    // ── Empty-cart popup ─────────────────────────────────────────────────────
    var emptyCartOverlay  = document.getElementById('empty-cart-overlay');
    var emptyCartPopup    = document.getElementById('empty-cart-popup');
    var emptyCartCloseBtn = document.getElementById('empty-cart-close-btn');

    function openEmptyCartPopup() {
        emptyCartOverlay.classList.add('active');
        emptyCartPopup.classList.add('open');
    }
    function closeEmptyCartPopup() {
        emptyCartOverlay.classList.remove('active');
        emptyCartPopup.classList.remove('open');
    }
    emptyCartCloseBtn.addEventListener('click', closeEmptyCartPopup);
    emptyCartOverlay.addEventListener('click', closeEmptyCartPopup);

    cartFab.addEventListener('click', function () {
        if (cart.length === 0) { openEmptyCartPopup(); return; }
        renderCQModal(); openCQModal();
    });
    cartCloseBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    cartOrderBtn.addEventListener('click', function () {
        if (cart.length === 0) { openEmptyCartPopup(); return; }
        closeCart();
        renderCQModal();
        openCQModal();
    });

    // ── Category tabs ────────────────────────────────────────────────────────
    function resetFilterState() {
        filterState = { types: { food: true, combo: true, addon: true, drink: true }, minPrice: 0, maxPrice: Infinity, forPeople: 0 };
        document.querySelectorAll('input[name="bs-type"]').forEach(function (cb) { cb.checked = true; });
        var allPeople = document.querySelector('input[name="bs-people"][value="0"]');
        if (allPeople) allPeople.checked = true;
        if (bsRangeMin) bsRangeMin.value = 0;
        if (bsRangeMax) bsRangeMax.value = PRICE_MAX;
        updateSliderFill();
        if (bsFilterPanel) { bsFilterPanel.classList.remove('open'); bsFilterBtn.setAttribute('aria-expanded', 'false'); }
        updateFilterBadge();
    }

    catTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            var category = this.dataset.category;
            if (searchInput) searchInput.value = '';
            setActiveTab(category);
            restoreNormalView();

            resetFilterState();
            if (allProducts.length) applyFilterAndSort();

            if (category === 'all') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                var section = document.getElementById('section-' + category);
                if (section) {
                    var top = section.getBoundingClientRect().top + window.scrollY - 115;
                    window.scrollTo({ top: top, behavior: 'smooth' });
                }
            }
        });
    });

    // ── Search ──────────────────────────────────────────────────────────────
    var searchDebounce;
    var sectionSearch = document.getElementById('section-search');
    var gridSearch    = document.getElementById('grid-search');

    function showSearchResults(products) {
        currentSearchResults = products;
        // Ẩn tất cả section bình thường, hiện section search
        document.querySelectorAll('.menu-cat-section:not(#section-search)').forEach(function (s) {
            s.style.display = 'none';
        });
        sectionSearch.style.display = '';

        if (!products.length) {
            gridSearch.innerHTML = '<p class="bs-empty">Không tìm thấy món nào phù hợp.</p>';
            return;
        }
        applyFilterAndSort();
    }

    function restoreNormalView() {
        currentSearchResults = null;
        sectionSearch.style.display = 'none';
        document.querySelectorAll('.menu-cat-section:not(#section-search)').forEach(function (s) {
            s.style.display = '';
        });
        applyFilterAndSort();
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(searchDebounce);
            var q = searchInput.value.trim();
            if (!q) { restoreNormalView(); return; }

            searchDebounce = setTimeout(function () {
                gridSearch.innerHTML = '<p class="bs-loading"><span class="bs-spinner"></span> Đang tìm...</p>';
                sectionSearch.style.display = '';
                document.querySelectorAll('.menu-cat-section:not(#section-search)').forEach(function (s) {
                    s.style.display = 'none';
                });

                apiPost('/product/search', { Name: q })
                    .then(function (res) { return res.ok ? res.json() : []; })
                    .then(function (data) {
                        var results = Array.isArray(data) ? data : [];
                        // Lọc chỉ sản phẩm có variant
                        results = results.filter(function (p) { return p.productVarient && p.productVarient.length; });
                        showSearchResults(results);
                    })
                    .catch(function () {
                        // Fallback: lọc client-side từ allProducts
                        var ql = q.toLowerCase();
                        var results = allProducts.filter(function (p) {
                            return (p.productName || '').toLowerCase().includes(ql);
                        });
                        showSearchResults(results);
                    });
            }, 300);
        });
    }

    // ── Init ─────────────────────────────────────────────────────────────────
    if (initCombo) {
        // Chỉ filter theo type Combo (không filter forPeople vì data có thể chưa set)
        filterState.types = { food: false, combo: true, addon: false, drink: false };
        document.querySelectorAll('input[name="bs-type"]').forEach(function (cb) {
            cb.checked = (cb.value === 'combo');
        });
        // Highlight chip số người để gợi ý, nhưng không apply vào filterState
        var initPeopleRadio = document.querySelector('input[name="bs-people"][value="' + initCombo + '"]');
        if (initPeopleRadio) initPeopleRadio.checked = true;
        var allPeopleRadio = document.querySelector('input[name="bs-people"][value="0"]');
        if (allPeopleRadio) allPeopleRadio.checked = false;
    }

    loadCart();
    updateCartBadge();
    renderCart();
    loadAllProducts();

})();

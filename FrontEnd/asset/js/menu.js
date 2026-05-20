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

    var bsTrack   = document.getElementById('bs-track');
    var bsPrev    = document.getElementById('bs-prev');
    var bsNext    = document.getElementById('bs-next');
    var bsDots    = document.getElementById('bs-dots');
    var bsCounter = document.getElementById('bs-counter');

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
    var searchInput   = document.getElementById('menu-search-input');
    var catTabs       = document.querySelectorAll('.cat-tab');
    var sortSelect    = document.getElementById('bs-sort-select');

    var cqBackdrop    = document.getElementById('cq-backdrop');
    var cqModal       = document.getElementById('cq-modal');
    var cqCloseBtn    = document.getElementById('cq-close-btn');
    var cqItemsWrap   = document.getElementById('cq-items-wrap');
    var cqItemCount   = document.getElementById('cq-item-count');
    var cqSubtotal    = document.getElementById('cq-subtotal');
    var cqShipping    = document.getElementById('cq-shipping');
    var cqGrandTotal  = document.getElementById('cq-grand-total');
    var cqCheckoutBtn = document.getElementById('cq-checkout-btn');
    var cqUpsellPrev  = document.getElementById('cq-upsell-prev');
    var cqUpsellNext  = document.getElementById('cq-upsell-next');
    var cqUpsellImg   = document.getElementById('cq-upsell-img');
    var cqUpsellName  = document.getElementById('cq-upsell-name');
    var cqUpsellPrice = document.getElementById('cq-upsell-price');
    var cqUpsellAdd   = document.getElementById('cq-upsell-add');

    // ── State ────────────────────────────────────────────────────────────────
    // cart item: { varientId, name, price, qty }
    var cart        = [];
    var pendingItem = null;
    var allProducts = [];   // products loaded from API
    var upsellItems = [];
    var upsellIdx   = 0;

    // ── Helpers ──────────────────────────────────────────────────────────────
    function formatPrice(num) { return num.toLocaleString('vi-VN') + ' đ'; }
    function isLoggedIn()     { return !!localStorage.getItem('fullName'); }

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

    function makeCardHTML(p) {
        var variants    = activeVariants(p);
        var defaultV    = variants[0];
        var escapedName = p.productName.replace(/"/g, '&quot;');

        var sizeHTML = '';
        if (variants.length > 1) {
            sizeHTML = '<div class="card-size-list">';
            variants.forEach(function (v, i) {
                sizeHTML += '<button class="card-size-chip' + (i === 0 ? ' selected' : '') + '"' +
                    ' data-vid="' + v.productVarientID + '" data-price="' + v.price + '">' +
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
               '" aria-label="Thêm ' + escapedName + ' vào giỏ"><i class="ti-plus"></i></button>' +
               '</div></div></div>';
    }

    function renderBestseller(products) {
        if (!bsTrack) return;
        bsTrack.innerHTML = '';

        var valid = products.filter(function (p) { return p.productVarient && p.productVarient.length; });

        if (valid.length === 0) {
            bsTrack.innerHTML = '<p class="bs-empty">Chưa có dữ liệu sản phẩm.</p>';
            return;
        }

        if (bsCounter) bsCounter.textContent = valid.length + ' món';

        valid.forEach(function (p, i) {
            var tmp = document.createElement('div');
            tmp.innerHTML = makeCardHTML(p);
            var card = tmp.firstChild;
            card.style.opacity   = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.4s ease ' + (i * 60) + 'ms, transform 0.4s ease ' + (i * 60) + 'ms, box-shadow 0.28s ease';
            bsTrack.appendChild(card);
            setTimeout(function () {
                card.style.opacity   = '1';
                card.style.transform = 'translateY(0)';
            }, 60 + i * 60);
        });

        // upsell
        upsellItems = valid.slice(0, 3).map(function (p) {
            var v = activeVariants(p)[0];
            return { varientId: v.productVarientID, name: p.productName, price: v.price, img: p.image || '' };
        });
        if (!upsellItems.length) upsellItems = [{ varientId: null, name: 'Đang cập nhật...', price: 0, img: '' }];
        upsellIdx = 0;
        renderUpsell();

        buildDots(valid.length);
        updateSliderArrows();
    }

    // ── Sort ─────────────────────────────────────────────────────────────────
    function applySort(products, sortKey) {
        var list = products.slice();
        if (sortKey === 'price-asc') {
            list.sort(function (a, b) {
                return activeVariants(a)[0].price - activeVariants(b)[0].price;
            });
        } else if (sortKey === 'price-desc') {
            list.sort(function (a, b) {
                return activeVariants(b)[0].price - activeVariants(a)[0].price;
            });
        } else if (sortKey === 'name-az') {
            list.sort(function (a, b) {
                return a.productName.localeCompare(b.productName, 'vi');
            });
        } else {
            // bestseller — giữ thứ tự SoldCount từ API
            list.sort(function (a, b) { return (b.soldCount || 0) - (a.soldCount || 0); });
        }
        return list;
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', function () {
            renderBestseller(applySort(allProducts, this.value));
        });
    }

    var TYPE_MAP   = { food: 'Food', combo: 'Combo', addon: 'Addon', drink: 'Drink' };
    var ALL_TYPES  = ['Food', 'Combo', 'Addon', 'Drink'];

    function fetchByType(type) {
        return apiPost('/product/search', { Type: type })
            .then(function (res) { return res.ok ? res.json() : []; })
            .then(function (data) { return Array.isArray(data) ? data : []; })
            .catch(function () { return []; });
    }

    function loadProducts(category) {
        if (bsTrack) bsTrack.innerHTML = '<p class="bs-loading"><span class="bs-spinner"></span> Đang tải...</p>';

        var promise = (!category || category === 'all')
            ? Promise.all(ALL_TYPES.map(fetchByType))
                .then(function (results) { return [].concat.apply([], results); })
            : fetchByType(TYPE_MAP[category]);

        promise
            .then(function (list) {
                allProducts = list.filter(function (p) {
                    return p.productVarient && p.productVarient.length;
                });
                var sortKey = sortSelect ? sortSelect.value : 'bestseller';
                renderBestseller(applySort(allProducts, sortKey));
            })
            .catch(function () {
                if (bsTrack) bsTrack.innerHTML = '<p class="bs-empty">Không thể tải sản phẩm. Vui lòng thử lại.</p>';
            });
    }

    // ── Slider ───────────────────────────────────────────────────────────────
    var CARD_WIDTH = 252; // card 230px + gap 22px

    function updateSliderArrows() {
        if (!bsTrack || !bsPrev || !bsNext) return;
        var atStart = bsTrack.scrollLeft <= 4;
        var atEnd   = bsTrack.scrollLeft + bsTrack.clientWidth >= bsTrack.scrollWidth - 4;
        bsPrev.disabled = atStart;
        bsNext.disabled = atEnd;
        bsPrev.classList.toggle('bs-arrow-hidden', atStart);
        bsNext.classList.toggle('bs-arrow-hidden', atEnd);
        updateDots();
    }

    function buildDots(count) {
        if (!bsDots) return;
        bsDots.innerHTML = '';
        if (!bsTrack) return;
        var visible = Math.round(bsTrack.clientWidth / CARD_WIDTH) || 1;
        var pages   = Math.ceil(count / visible);
        if (pages <= 1) { bsDots.style.display = 'none'; return; }
        bsDots.style.display = 'flex';
        for (var i = 0; i < pages; i++) {
            var d = document.createElement('span');
            d.className = 'bs-dot' + (i === 0 ? ' active' : '');
            d.dataset.page = i;
            (function (page) {
                d.addEventListener('click', function () {
                    bsTrack.scrollTo({ left: page * bsTrack.clientWidth, behavior: 'smooth' });
                });
            })(i);
            bsDots.appendChild(d);
        }
    }

    function updateDots() {
        if (!bsDots || !bsTrack) return;
        var visible = Math.round(bsTrack.clientWidth / CARD_WIDTH) || 1;
        var page = Math.round(bsTrack.scrollLeft / bsTrack.clientWidth);
        bsDots.querySelectorAll('.bs-dot').forEach(function (d, i) {
            d.classList.toggle('active', i === page);
        });
    }

    if (bsPrev) bsPrev.addEventListener('click', function () {
        bsTrack.scrollBy({ left: -bsTrack.clientWidth, behavior: 'smooth' });
    });
    if (bsNext) bsNext.addEventListener('click', function () {
        bsTrack.scrollBy({ left: bsTrack.clientWidth, behavior: 'smooth' });
    });
    if (bsTrack) bsTrack.addEventListener('scroll', updateSliderArrows, { passive: true });

    // ── Upsell ───────────────────────────────────────────────────────────────
    function renderUpsell() {
        if (!upsellItems.length) return;
        var u = upsellItems[upsellIdx];
        if (cqUpsellImg) { cqUpsellImg.src = u.img; cqUpsellImg.alt = u.name; }
        if (cqUpsellName)  cqUpsellName.textContent  = u.name;
        if (cqUpsellPrice) cqUpsellPrice.textContent = formatPrice(u.price);
        if (cqUpsellAdd) {
            cqUpsellAdd.onclick = function () {
                if (u.varientId) addToCart(u.name, u.price, u.varientId);
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

        // Sắp xếp theo giá tăng dần, chọn mặc định giá thấp nhất
        variants.sort(function (a, b) { return a.price - b.price; });
        pdSelectedVariant = variants[0];

        if (variants.length > 1) {
            pdSizeSection.classList.add('visible');
            pdSizeList.innerHTML = '';
            variants.forEach(function (v) {
                var btn = document.createElement('button');
                btn.className = 'pd-size-btn' + (v === pdSelectedVariant ? ' selected' : '');
                btn.innerHTML =
                    '<span class="pd-size-name">' + (SIZE_LABEL[v.size] || v.size) + '</span>' +
                    '<span class="pd-size-price">' + formatPrice(v.price) + '</span>';
                btn.addEventListener('click', function () {
                    pdSelectedVariant = v;
                    pdSizeList.querySelectorAll('.pd-size-btn').forEach(function (b) { b.classList.remove('selected'); });
                    btn.classList.add('selected');
                    pdPrice.textContent = formatPrice(v.price);
                });
                pdSizeList.appendChild(btn);
            });
        } else {
            pdSizeSection.classList.remove('visible');
        }

        pdPrice.textContent = formatPrice(pdSelectedVariant.price);

        // Add-to-cart button
        pdAddBtn.onclick = function () {
            if (!pdSelectedVariant) return;
            addToCart(product.productName, pdSelectedVariant.price, pdSelectedVariant.productVarientID);
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
            addToCart(item.name, item.price, item.varientId);
        }
    }

    function updateMenuHeader(fullName) {
        var badge = document.getElementById('menu-user-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'menu-user-badge';
            badge.className = 'menu-user-avatar-badge';
            badge.title = 'Tài khoản của bạn';
            badge.onclick = function () { window.location.href = 'user.html'; };
            var header = document.getElementById('header');
            if (header) header.appendChild(badge);
        }
        var initial   = fullName.charAt(0).toUpperCase();
        var shortName = fullName.split(' ').pop();
        badge.innerHTML = '<span class="menu-user-initial">' + initial + '</span>' + shortName;
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
                onAuthSuccess(result.data.FullName);
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

    function addToCart(name, price, varientId) {
        if (!isLoggedIn()) {
            pendingItem = { name: name, price: price, varientId: varientId };
            openAuthModal(name);
            return;
        }
        var existing = cart.find(function (i) { return i.varientId === varientId; });
        if (existing) {
            existing.qty++;
        } else {
            cart.push({ varientId: varientId, name: name, price: price, qty: 1 });
        }
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
        addToCart(name, price, varientId);
        btn.style.transform = 'scale(1.4) rotate(90deg)';
        setTimeout(function () { btn.style.transform = ''; }, 300);
    });

    // ── CQ Modal ─────────────────────────────────────────────────────────────
    function renderCQModal() {
        cqItemsWrap.innerHTML = '';
        cart.forEach(function (item, idx) {
            var el = document.createElement('div');
            el.className = 'cq-item';
            el.innerHTML = '<div class="cq-item-qty-ctrl">' +
                '<button class="cq-qty-btn" data-action="minus" data-idx="' + idx + '" aria-label="Giảm">−</button>' +
                '<span class="cq-qty-num">' + item.qty + '</span>' +
                '<button class="cq-qty-btn" data-action="plus" data-idx="' + idx + '" aria-label="Tăng">+</button>' +
                '</div><span class="cq-item-name">' + item.name + '</span>' +
                '<span class="cq-item-price">' + formatPrice(item.price * item.qty) + '</span>';
            cqItemsWrap.appendChild(el);
        });
        var totalItems = cart.reduce(function (s, i) { return s + i.qty; }, 0);
        cqItemCount.textContent = totalItems + ' món';
        var subtotal = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
        cqSubtotal.textContent   = formatPrice(subtotal);
        cqShipping.textContent   = '0 đ';
        cqGrandTotal.textContent = formatPrice(subtotal);
    }

    cqItemsWrap.addEventListener('click', function (e) {
        var btn = e.target.closest('.cq-qty-btn');
        if (!btn) return;
        var idx = parseInt(btn.dataset.idx, 10);
        if (btn.dataset.action === 'plus')  { cart[idx].qty++; }
        else { cart[idx].qty--; if (cart[idx].qty <= 0) cart.splice(idx, 1); }
        updateCartBadge();
        renderCart();
        renderCQModal();
        if (cart.length === 0) closeCQModal();
    });

    function openCQModal()  { cqModal.classList.add('open');    cqBackdrop.classList.add('active');    document.body.style.overflow = 'hidden'; }
    function closeCQModal() { cqModal.classList.remove('open'); cqBackdrop.classList.remove('active'); document.body.style.overflow = ''; }

    cqCloseBtn.addEventListener('click', closeCQModal);
    cqBackdrop.addEventListener('click', closeCQModal);

    // ── Checkout ─────────────────────────────────────────────────────────────
    cqCheckoutBtn.addEventListener('click', function () {
        if (cart.length === 0) return;
        if (!isLoggedIn()) { openAuthModal(null); return; }

        var userId = localStorage.getItem('userId');
        var products = cart.map(function (i) { return { ProductVarientID: i.varientId, qty: i.qty }; });
        var total    = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);

        // Lấy địa chỉ mặc định của user
        apiGet('/address/my-addresses')
            .then(function (res) {
                if (!res.ok) throw new Error('no_address');
                return res.json();
            })
            .then(function (addresses) {
                if (!addresses || addresses.length === 0) throw new Error('no_address');
                var def = addresses.find(function (a) { return a.isDefault; }) || addresses[0];
                return apiPost('/bill/create-delivery', {
                    UserID:          userId,
                    StoreID:         1,
                    AddressID:       def.addressID,
                    PaymentMethods:  'Cash',
                    MoneyReceived:   total,
                    MoneyGiveBack:   0,
                    products:        products
                });
            })
            .then(function (res) {
                if (!res.ok) return res.text().then(function (t) { throw new Error(t); });
                closeCQModal();
                alert('Đặt hàng thành công!\nCảm ơn bạn đã tin tưởng Chônlibi!');
                cart.length = 0;
                updateCartBadge();
                renderCart();
            })
            .catch(function (err) {
                if (err.message === 'no_address') {
                    alert('Bạn chưa có địa chỉ giao hàng. Vui lòng thêm địa chỉ trong trang tài khoản.');
                    window.location.href = 'user.html';
                } else {
                    alert('Đặt hàng thất bại. Vui lòng thử lại.\n' + err.message);
                }
            });
    });

    // ── Cart sidebar ─────────────────────────────────────────────────────────
    function openCart()  { cartSidebar.classList.add('open');    cartOverlay.classList.add('active');    document.body.style.overflow = 'hidden'; renderCart(); }
    function closeCart() { cartSidebar.classList.remove('open'); cartOverlay.classList.remove('active'); document.body.style.overflow = ''; }

    cartFab.addEventListener('click', function () { renderCQModal(); openCQModal(); });
    cartCloseBtn.addEventListener('click', closeCart);
    cartOverlay.addEventListener('click', closeCart);

    cartOrderBtn.addEventListener('click', function () {
        if (cart.length === 0) return;
        closeCart();
        renderCQModal();
        openCQModal();
    });

    // ── Category tabs ────────────────────────────────────────────────────────
    catTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            catTabs.forEach(function (t) { t.classList.remove('active'); });
            this.classList.add('active');
            if (searchInput) searchInput.value = '';
            if (sortSelect) sortSelect.value = 'bestseller';
            loadProducts(this.dataset.category);
        });
    });

    // ── Search trong slider ──────────────────────────────────────────────────
    var searchDebounce;
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(function () {
                var q = searchInput.value.trim().toLowerCase();
                document.querySelectorAll('#bs-track .menu-card').forEach(function (card) {
                    var name  = (card.dataset.name || '').toLowerCase();
                    var match = !q || name.includes(q);
                    card.classList.toggle('card-hidden', !match);
                });
            }, 200);
        });
    }

    // ── Init ─────────────────────────────────────────────────────────────────
    renderCart();
    loadProducts();

})();

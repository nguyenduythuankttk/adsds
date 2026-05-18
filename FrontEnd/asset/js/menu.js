(function () {
    'use strict';

    // ── DOM refs ─────────────────────────────────────────────────────────────
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

    // ── Load & render products ────────────────────────────────────────────────
    var GRID_MAP = {
        Food:  'grid-bestseller',
        Combo: 'grid-combo',
        Addon: 'grid-addon',
        Drink: 'grid-drink'
    };

    function makeCardHTML(p, varient) {
        return '<div class="menu-card" data-category="' + p.productType.toLowerCase() +
               '" data-name="' + p.productName + '">' +
               '<div class="menu-card-img-wrap">' +
               (p.image ? '<img src="' + p.image + '" alt="' + p.productName + '" loading="lazy">' :
                          '<div class="menu-card-img-placeholder"></div>') +
               '</div>' +
               '<div class="menu-card-body">' +
               '<h3 class="menu-card-name">' + p.productName + '</h3>' +
               '<p class="menu-card-desc"></p>' +
               '<div class="menu-card-footer">' +
               '<span class="menu-card-price">' + formatPrice(varient.price) + '</span>' +
               '<button class="menu-add-btn" data-varient-id="' + varient.productVarientID +
               '" data-price="' + varient.price + '" data-name="' + p.productName +
               '" aria-label="Thêm ' + p.productName + ' vào giỏ"><i class="ti-plus"></i></button>' +
               '</div></div></div>';
    }

    function renderProducts(products) {
        // clear all grids
        Object.values(GRID_MAP).forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.innerHTML = '';
        });

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.style.opacity   = '1';
                    entry.target.style.transform = 'translateY(0)';
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        var cardIndex = 0;
        products.forEach(function (p) {
            if (!p.productVarient || p.productVarient.length === 0) return;
            var varient  = p.productVarient[0];
            var gridId   = GRID_MAP[p.productType] || GRID_MAP['Food'];
            var grid     = document.getElementById(gridId);
            if (!grid) return;

            var tmp = document.createElement('div');
            tmp.innerHTML = makeCardHTML(p, varient);
            var card = tmp.firstChild;

            var delay = (cardIndex % 6) * 60;
            card.style.opacity    = '0';
            card.style.transform  = 'translateY(24px)';
            card.style.transition = 'opacity 0.4s ease ' + delay + 'ms, transform 0.4s ease ' + delay + 'ms, box-shadow 0.28s ease';
            grid.appendChild(card);
            observer.observe(card);
            cardIndex++;
        });

        // Build upsell from first few Addon/Drink products
        upsellItems = products.filter(function (p) {
            return p.productType === 'Addon' || p.productType === 'Drink';
        }).slice(0, 3).map(function (p) {
            var v = p.productVarient[0];
            return { varientId: v.productVarientID, name: p.productName, price: v.price, img: p.image || '' };
        });
        if (upsellItems.length === 0) {
            upsellItems = [{ varientId: null, name: 'Đang cập nhật...', price: 0, img: '' }];
        }
        upsellIdx = 0;
        renderUpsell();
    }

    function loadProducts() {
        apiGet('/product/get-all')
            .then(function (res) { return res.json(); })
            .then(function (data) {
                allProducts = data || [];
                renderProducts(allProducts);
            })
            .catch(function () {
                // Nếu API lỗi, hiện thông báo
                Object.values(GRID_MAP).forEach(function (id) {
                    var el = document.getElementById(id);
                    if (el) el.innerHTML = '<p style="padding:1rem;color:#999">Không thể tải thực đơn.</p>';
                });
            });
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

    // ── Filter / search ──────────────────────────────────────────────────────
    function getAllCards() { return document.querySelectorAll('.menu-card'); }

    function filterByCategory(category) {
        getAllCards().forEach(function (card) {
            var cats  = card.dataset.category || '';
            var match = category === 'all' || cats.includes(category);
            card.style.display = match ? '' : 'none';
        });
        document.querySelectorAll('.menu-section').forEach(function (section) {
            var visible = section.querySelectorAll('.menu-card:not([style*="display: none"])');
            section.style.display = visible.length === 0 ? 'none' : '';
        });
    }

    catTabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            catTabs.forEach(function (t) { t.classList.remove('active'); });
            this.classList.add('active');
            filterByCategory(this.dataset.category);
            var target = document.getElementById('section-' + this.dataset.category);
            if (target && this.dataset.category !== 'all') {
                var offset = 55 + 58;
                var top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    });

    var searchDebounce;
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(searchDebounce);
            searchDebounce = setTimeout(function () {
                var q = searchInput.value.trim().toLowerCase();
                if (!q) {
                    getAllCards().forEach(function (c) { c.style.display = ''; });
                    document.querySelectorAll('.menu-section').forEach(function (s) { s.style.display = ''; });
                    return;
                }
                catTabs.forEach(function (t) { t.classList.remove('active'); });
                var tabAll = document.getElementById('tab-all');
                if (tabAll) tabAll.classList.add('active');
                getAllCards().forEach(function (card) {
                    var name = (card.dataset.name || '').toLowerCase();
                    var desc = (card.querySelector('.menu-card-desc') ? card.querySelector('.menu-card-desc').textContent : '').toLowerCase();
                    card.style.display = (name.includes(q) || desc.includes(q)) ? '' : 'none';
                });
                document.querySelectorAll('.menu-section').forEach(function (section) {
                    var visible = section.querySelectorAll('.menu-card:not([style*="display: none"])');
                    section.style.display = visible.length === 0 ? 'none' : '';
                });
            }, 200);
        });
    }

    // ── Scroll spy ───────────────────────────────────────────────────────────
    window.addEventListener('scroll', function () {
        var scrollY = window.scrollY + 55 + 58 + 20;
        var current = null;
        document.querySelectorAll('.menu-section').forEach(function (sec) {
            if (sec.offsetTop <= scrollY) current = sec.dataset.section;
        });
        if (current) {
            catTabs.forEach(function (tab) {
                tab.classList.toggle('active', tab.dataset.category === current);
            });
        }
    }, { passive: true });

    // ── Init ─────────────────────────────────────────────────────────────────
    renderCart();
    loadProducts();

    var params   = new URLSearchParams(window.location.search);
    var paramCat = params.get('category');
    if (paramCat) {
        setTimeout(function () {
            var targetTab = document.querySelector('.cat-tab[data-category="' + paramCat + '"]');
            if (targetTab) targetTab.click();
        }, 600);
    }

})();

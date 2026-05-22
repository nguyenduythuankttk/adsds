// Home page: featured products + search + mini cart
(function () {
    var CART_KEY = 'chonlibi_cart';

    function formatPrice(n) { return Number(n).toLocaleString('vi-VN') + ' đ'; }

    function isLoggedIn() { return !!localStorage.getItem('fullName'); }

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

    function showLoginModal() {
        var modal = document.getElementById('login-modal');
        if (modal) modal.classList.add('active');
    }

    function addHomeCartItem(varientId, name, price) {
        var cart = [];
        try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch (e) {}
        var existing = cart.find(function (i) { return i.varientId === varientId; });
        if (existing) {
            existing.qty += 1;
        } else {
            cart.push({ varientId: varientId, name: name, price: price, qty: 1 });
        }
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        showToast('Đã thêm "' + name + '" vào giỏ hàng!');
    }

    var RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

    function renderProductCard(p, rank) {
        var variants = p.productVarient || p.ProductVarient || [];
        // Ưu tiên variant active, fallback sang bất kỳ variant nào
        var varient = variants.find(function (v) {
            return (v.isActive !== false && v.IsActive !== false) && !(v.deletedAt || v.DeletedAt);
        }) || variants[0];
        if (!varient) return '';

        var vid   = varient.productVarientID || varient.ProductVarientID;
        var price = varient.price || varient.Price || 0;
        var name  = p.productName || p.ProductName || '';
        var img   = p.image || p.Image || '';
        var sold  = p.soldCount || p.SoldCount || 0;

        var rankColor = rank <= 3 ? RANK_COLORS[rank - 1] : '#555';
        var rankBadge = rank
            ? '<span class="product-rank-badge" style="background:' + rankColor + '">#' + rank + '</span>'
            : '';

        return '<div class="product-card home-prod-card">' +
            '<div class="product-image-wrapper">' +
            rankBadge +
            (img ? '<img src="' + img + '" alt="' + name + '" loading="lazy">'
                 : '<div class="img-placeholder">🍗</div>') +
            (sold > 0 ? '<span class="product-badge">BÁN CHẠY</span>' : '') +
            '</div>' +
            '<div class="product-info">' +
            '<h3 class="product-name">' + name + '</h3>' +
            '<p class="product-price">' + formatPrice(price) + '</p>' +
            (sold > 0 ? '<p class="product-sold-count">Đã bán: ' + sold + '</p>' : '') +
            '<button class="add-to-cart-btn-static" ' +
            'onclick="homeAddToCart(' + vid + ',\'' + name.replace(/'/g, "\\'") + '\',' + price + ')">' +
            '<i class="ti-shopping-cart"></i> THÊM VÀO GIỎ</button>' +
            '</div></div>';
    }

    function renderProducts(products) {
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

    window.homeAddToCart = function (varientId, name, price) {
        if (!isLoggedIn()) {
            showLoginModal();
            return;
        }
        addHomeCartItem(varientId, name, price);
    };

    window.homeSearch = function () {
        var name    = (document.getElementById('hs-name') || {}).value || '';
        var type    = (document.getElementById('hs-type') || {}).value || '';
        var minP    = (document.getElementById('hs-min') || {}).value || '';
        var maxP    = (document.getElementById('hs-max') || {}).value || '';

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
        var fields = ['hs-name', 'hs-min', 'hs-max'];
        fields.forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
        var sel = document.getElementById('hs-type'); if (sel) sel.value = '';
        loadFeatured();
    };

    // Also support pressing Enter in search inputs
    ['hs-name', 'hs-min', 'hs-max'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('keydown', function (e) { if (e.key === 'Enter') window.homeSearch(); });
    });

    loadFeatured();
})();

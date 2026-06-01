var allStores = [];
var userLat = null;
var userLng = null;
var storesLoaded = false;
var selectedRegion = 'all';

function filterStoresByRegion(region) {
    selectedRegion = region;
    renderStoreCards(allStores);
}

function getRegion(province) {
    if (!province) return 'other';
    var p = province.toLowerCase();
    if (p.match(/hà nội|hải phòng|bắc ninh|quảng ninh|hà giang|cao bằng|bắc kạn|tuyên quang|lào cai|điện biên|lai châu|sơn la|yên bái|hoà bình|thái nguyên|lạng sơn|bắc giang|phú thọ|vĩnh phúc|hải dương|hưng yên|thái bình|hà nam|nam định|ninh bình/)) return 'north';
    if (p.match(/hồ chí minh|cần thơ|đồng nai|bình dương|bà rịa|bình phước|tây ninh|long an|tiền giang|bến tre|trà vinh|vĩnh long|đồng tháp|an giang|kiên giang|hậu giang|sóc trăng|bạc liêu|cà mau/)) return 'south';
    if (p.match(/đà nẵng|huế|quảng nam|nha trang|khánh hòa|thanh hóa|nghệ an|hà tĩnh|quảng bình|quảng trị|quảng ngãi|bình định|phú yên|ninh thuận|bình thuận|kon tum|gia lai|đắk lắk|đắk nông|lâm đồng/)) return 'central';
    return 'other';
}
// ── Helpers ───────────────────────────────────────────────────────────────────
function haversineDistance(lat1, lng1, lat2, lng2) {
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLng = (lng2 - lng1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getDirectionsUrl(lat, lng) {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng + '&travelmode=driving';
}

function formatAddress(addr) {
    if (!addr) return '';
    return [addr.streetAddress || addr.street || addr.houseNumber, addr.ward, addr.district, addr.province]
        .filter(Boolean).join(', ');
}

// ── Render một card cửa hàng ──────────────────────────────────────────────────
function makeStoreCardHTML(store, isNearest) {
    var addr  = store.address || store.Address;
    var id    = store.storeID || store.StoreID;
    var name  = store.storeName || store.StoreName;
    var addrText = formatAddress(addr);
    var hasCoords = addr && addr.latitude != null && addr.longitude != null;

    var distHtml = '';
    if (userLat !== null && userLng !== null && hasCoords) {
        var dist = haversineDistance(userLat, userLng, addr.latitude, addr.longitude);
        distHtml = '<div class="store-card-info store-card-distance">' +
            '<i class="ti-map"></i><span>' + dist.toFixed(1) + ' km từ vị trí của bạn</span></div>';
    }

    var rankBadge = '';
    if (isNearest) {
        rankBadge = '<span class="store-nearest-rank" style="font-size:11px; padding:3px 8px; border-radius:12px; background:var(--primary,#ff6b00); color:#fff; margin-right:8px; display:inline-block; vertical-align:middle; line-height:1;">📍 Gần nhất</span>';
    }

    var totalReviews = store.totalReviews || store.TotalReviews || 0;
    var totalPoints  = store.totalPoints  || store.TotalPoints  || 0;
    var avgRating    = totalReviews > 0 ? (totalPoints / totalReviews) : 0;
    var safeName = (name || '').replace(/"/g, '&quot;');
    var safeNameJs = safeName.replace(/\'/g, "\\\'");
    var ratingHtml = '<div class="store-card-info store-card-rating" title="Click để xem đánh giá" onclick="event.stopPropagation();openStoreReviewModal(' + id + ', \'' + safeNameJs + '\')" style="color:#f5a623;font-weight:600;cursor:pointer">' +
        '<i class="ti-star"></i><span>' +
        (totalReviews > 0 ? (avgRating.toFixed(1) + ' / 5 (' + totalReviews + ' đánh giá)') : 'Chưa có đánh giá') +
        '</span></div>';

    return '<div class="store-card" id="store-card-' + id + '" data-store-id="' + id + '" data-store-name="' + safeName + '" style="cursor:pointer" onclick="openStoreReviewModal(' + id + ', \'' + safeNameJs + '\')">' +
        '<div class="store-card-name">' + rankBadge + '<i class="ti-home"></i> ' + name + '</div>' +
        (addrText ? '<div class="store-card-info"><i class="ti-location-pin"></i><span>' + addrText + '</span></div>' : '') +
        distHtml +
        ratingHtml +
        '<div class="store-card-info"><i class="ti-headphone-alt"></i><span>' + (store.phone || store.Phone || '') + '</span></div>' +
        '<div class="store-card-info"><i class="ti-email"></i><span>' + (store.email || store.Email || '') + '</span></div>' +
        '<div class="store-card-info"><i class="ti-agenda"></i><span>Sức chứa: ' + (store.seatingCapacity || store.SeatingCapacity || '?') + ' người</span></div>' +
        '<div class="store-card-cta" style="display:grid;grid-template-columns:1fr;gap:8px;margin-top:8px">' +
            (hasCoords
                ? '<a class="store-directions-btn" href="' + getDirectionsUrl(addr.latitude, addr.longitude) +
                  '" target="_blank" onclick="event.stopPropagation()" style="display:flex;align-items:center;justify-content:center;text-align:center;padding:8px 12px;border:1px solid rgb(220,77,11);border-radius:6px;font-weight:600;font-size:13px;line-height:1.2;box-sizing:border-box;min-width:0;height:36px">🗺️ Chỉ đường</a>'
                : '') +
        '</div>' +
        '</div>';
}

// ── Render danh sách cửa hàng ─────────────────────────────────────────────────
function renderStoreCards(stores) {
    var wrapper = document.getElementById('store-list-wrapper');
    var nearestSection = document.getElementById('store-nearest-section');

    if (!stores || stores.length === 0) {
        if (!storesLoaded) return;
        if (wrapper) wrapper.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px">Chưa có cửa hàng nào.</p>';
        if (nearestSection) nearestSection.style.display = 'none';
        return;
    }

    var label = document.getElementById('nearest-store-label');
    if (nearestSection) nearestSection.style.display = 'none';

    var displayList = stores.slice();

    if (selectedRegion && selectedRegion !== 'all') {
        displayList = displayList.filter(function (s) {
            var addr = s.address || s.Address || {};
            return getRegion(addr.province || '') === selectedRegion;
        });
    }

    if (userLat !== null && userLng !== null) {
        displayList.sort(function (a, b) {
            var aa = a.address || a.Address || {};
            var ba = b.address || b.Address || {};
            var da = aa.latitude != null ? haversineDistance(userLat, userLng, aa.latitude, aa.longitude) : Infinity;
            var db = ba.latitude != null ? haversineDistance(userLat, userLng, ba.latitude, ba.longitude) : Infinity;
            return da - db;
        });
        if (label) {
            label.style.display = 'block';
            label.textContent = '📍 Đã sắp xếp cửa hàng theo khoảng cách gần nhất';
        }
    }

    if (wrapper) {
        if (displayList.length === 0) {
            wrapper.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px">Không có cửa hàng nào trong khu vực này.</p>';
        } else {
            wrapper.innerHTML = '<div class="store-list">' + displayList.map(function (s, index) {
                var aa = s.address || s.Address || {};
                var isNearest = (userLat !== null && userLng !== null) && (index < 3) && (aa.latitude != null);
                return makeStoreCardHTML(s, isNearest);
            }).join('') + '</div>';
        }
    }
}

// ── Tải danh sách cửa hàng ───────────────────────────────────────────────────
function loadStores() {
    var wrapper = document.getElementById('store-list-wrapper');
    if (wrapper) wrapper.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px;grid-column:1/-1">Đang tải...</p>';

    apiGet('/store/get-all')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            allStores = Array.isArray(data) ? data : (data.data || []);
            storesLoaded = true;
            renderStoreCards(allStores);
        })
        .catch(function () {
            if (wrapper) wrapper.innerHTML =
                '<p style="color:#aaa;text-align:center;padding:20px">Không thể tải danh sách cửa hàng.</p>';
        });
}

// ── Tìm vị trí người dùng ────────────────────────────────────────────────────
function findNearestStore() {
    if (!navigator.geolocation) { alert('Trình duyệt không hỗ trợ định vị.'); return; }
    var btn   = document.getElementById('find-nearest-btn');
    var label = document.getElementById('nearest-store-label');
    btn.disabled = true;
    btn.innerHTML = '<i class="ti-location-pin"></i> Đang xác định vị trí...';

    navigator.geolocation.getCurrentPosition(
        function (position) {
            userLat = position.coords.latitude;
            userLng = position.coords.longitude;

            renderStoreCards(allStores);

            var wrapper = document.getElementById('store-list-wrapper');
            if (wrapper) wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });

            btn.disabled = false;
            btn.innerHTML = '<i class="ti-location-pin"></i> Vị trí hiện tại';
        },
        function () {
            alert('Không thể lấy vị trí. Vui lòng cho phép truy cập vị trí trong trình duyệt.');
            btn.disabled = false;
            btn.innerHTML = '<i class="ti-location-pin"></i> Vị trí hiện tại';
        }
    );
}

// ── Xử lý địa chỉ thủ công ──────────────────────────────────────────────────
var vnProvincesLoaded = false;
var vnData = [];

function toggleManualAddr() {
    var container = document.getElementById('manual-addr-container');
    if (!container) return;
    
    if (container.style.display === 'none' || container.style.display === '') {
        container.style.display = 'block';
        if (!vnProvincesLoaded) loadVNProvinces();
    } else {
        container.style.display = 'none';
    }
}

function loadVNProvinces() {
    fetch('https://provinces.open-api.vn/api/?depth=2')
        .then(function(res) { return res.json(); })
        .then(function(data) {
            vnData = data;
            vnProvincesLoaded = true;
            var pSelect = document.getElementById('manual-province');
            if (!pSelect) return;
            pSelect.innerHTML = '<option value="">Chọn Tỉnh/Thành</option>';
            data.forEach(function(p) {
                var opt = document.createElement('option');
                opt.value = p.code;
                opt.text = p.name;
                pSelect.add(opt);
            });
        })
        .catch(function(err) {
            console.error('Lỗi tải danh sách tỉnh thành:', err);
            alert('Không thể tải danh sách tỉnh thành.');
        });
}

function onProvinceChange(selectElem) {
    var code = parseInt(selectElem.value);
    var dSelect = document.getElementById('manual-district');
    if (!dSelect) return;
    
    dSelect.innerHTML = '<option value="">Chọn Quận/Huyện</option>';
    if (!code) return;
    
    var province = vnData.find(function(p) { return p.code === code; });
    if (province && province.districts) {
        province.districts.forEach(function(d) {
            var opt = document.createElement('option');
            opt.value = d.code;
            opt.text = d.name;
            dSelect.add(opt);
        });
    }
}

function findStoreByManualAddress() {
    var pSelect = document.getElementById('manual-province');
    var dSelect = document.getElementById('manual-district');
    var streetInput = document.getElementById('manual-street');
    
    if (!pSelect || !dSelect || !streetInput) return;

    if (!pSelect.value) { alert('Vui lòng chọn Tỉnh/Thành phố'); return; }
    if (!dSelect.value) { alert('Vui lòng chọn Quận/Huyện'); return; }

    var pText = pSelect.options[pSelect.selectedIndex].text;
    var dText = dSelect.options[dSelect.selectedIndex].text;
    var street = streetInput.value.trim();

    var addressParts = [];
    if (street) addressParts.push(street);
    addressParts.push(dText);
    addressParts.push(pText);
    addressParts.push('Việt Nam');

    var addressQuery = addressParts.join(', ');

    var btn = document.querySelector('#manual-addr-container button');
    var oldText = btn.innerHTML;
    btn.innerHTML = 'Đang tìm...';
    btn.disabled = true;

    fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(addressQuery))
        .then(function(res) { return res.json(); })
        .then(function(data) {
            btn.innerHTML = oldText;
            btn.disabled = false;
            
            if (data && data.length > 0) {
                userLat = parseFloat(data[0].lat);
                userLng = parseFloat(data[0].lon);
                renderStoreCards(allStores);
                
                var wrapper = document.getElementById('store-list-wrapper');
                if (wrapper) wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
            } else {
                alert('Không thể xác định tọa độ từ địa chỉ này. Vui lòng nhập chi tiết hơn (ví dụ: thêm số nhà).');
            }
        })
        .catch(function(err) {
            btn.innerHTML = oldText;
            btn.disabled = false;
            console.error('Lỗi Nominatim:', err);
            alert('Lỗi kết nối khi tìm kiếm địa chỉ.');
        });
}

// ── Panel open/close ─────────────────────────────────────────────────────────
(function () {
    var panel    = document.getElementById('store-panel');
    var backdrop = document.getElementById('store-panel-backdrop');
    var storeBtn = document.getElementById('nav-store-btn');
    var closeBtn = document.getElementById('store-panel-close');

    function openPanel() {
        panel.classList.add('open');
        backdrop.classList.add('open');
    }

    function closePanel() {
        panel.classList.remove('open');
        backdrop.classList.remove('open');
    }

    if (storeBtn) {
        storeBtn.addEventListener('click', function (e) {
            e.preventDefault();
            if (panel.classList.contains('open')) closePanel();
            else openPanel();
        });
    }
    if (closeBtn)   closeBtn.addEventListener('click', closePanel);
    if (backdrop)   backdrop.addEventListener('click', closePanel);

    // Gọi API ngay khi trang load
    loadStores();
})();

// ── Store review modal ──────────────────────────────────────────────────────
function escapeHtml(s) {
    return String(s == null ? '' : s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function ensureStoreReviewModal() {
    if (document.getElementById('store-review-modal')) return;
    var html = ''
        + '<div id="store-review-modal-backdrop" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9998"></div>'
        + '<div id="store-review-modal" style="display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:92%;max-width:560px;max-height:88vh;overflow:hidden;background:#fff;border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.25);z-index:9999;flex-direction:column">'
        +   '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #eee">'
        +     '<h3 style="margin:0;font-size:18px;color:#222;display:flex;align-items:center;gap:8px"><i class="ti-comments-smiley" style="font-size:20px;color:#dc4d0b"></i> Đánh giá: <span id="srm-title" style="font-weight:700"></span></h3>'
        +     '<button id="srm-close" type="button" style="background:none;border:none;font-size:22px;cursor:pointer;color:#666"><i class="ti-close"></i></button>'
        +   '</div>'
        +   '<div id="srm-summary" style="display:flex;align-items:center;gap:8px;padding:12px 18px;background:#fff8f1;border-bottom:1px solid #f1e3d2;font-weight:600;color:#333">Đang tải...</div>'
        +   '<div id="srm-list" style="flex:1;overflow-y:auto;padding:12px 18px"></div>'
        +   '<div id="srm-form-wrap" style="border-top:1px solid #eee;padding:12px 18px;background:#fafafa"></div>'
        + '</div>';
    var wrap = document.createElement('div');
    wrap.innerHTML = html;
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

    var srmCloseBtn = document.getElementById('srm-close');
    srmCloseBtn.addEventListener('click', closeStoreReviewModal);
    srmCloseBtn.addEventListener('mouseenter', function () { this.style.color = '#222'; });
    srmCloseBtn.addEventListener('mouseleave', function () { this.style.color = '#666'; });
    document.getElementById('store-review-modal-backdrop').addEventListener('click', closeStoreReviewModal);
}

function closeStoreReviewModal() {
    var m = document.getElementById('store-review-modal');
    var b = document.getElementById('store-review-modal-backdrop');
    if (m) m.style.display = 'none';
    if (b) b.style.display = 'none';
}

function openStoreReviewModal(storeId, storeName, focusForm) {
    ensureStoreReviewModal();
    document.getElementById('srm-title').textContent = storeName;
    document.getElementById('srm-summary').innerHTML = '<i class="ti-reload" style="color:#dc4d0b"></i> Đang tải đánh giá...';
    document.getElementById('srm-list').innerHTML = '';
    document.getElementById('srm-form-wrap').innerHTML = '';
    document.getElementById('store-review-modal').style.display = 'flex';
    document.getElementById('store-review-modal-backdrop').style.display = 'block';

    loadStoreReviews(storeId);
    renderReviewForm(storeId);

    if (focusForm) {
        setTimeout(function () {
            var wrap = document.getElementById('srm-form-wrap');
            if (wrap && wrap.scrollIntoView) wrap.scrollIntoView({ behavior: 'smooth', block: 'end' });
            var ta = document.getElementById('srm-comment');
            if (ta) ta.focus();
        }, 50);
    }
}

function renderStarsHtml(rating) {
    var n = Math.max(0, Math.min(5, Math.round(rating || 0)));
    var s = '';
    for (var i = 1; i <= 5; i++) s += (i <= n ? '★' : '☆');
    return '<span style="color:#f5a623;letter-spacing:2px">' + s + '</span>';
}

function renderReviewList(storeId, reviews) {
    var total = reviews.length;
    var avg = total > 0
        ? reviews.reduce(function (s, r) { return s + (r.rating || r.Rating || 0); }, 0) / total
        : 0;

    document.getElementById('srm-summary').innerHTML =
        '<i class="ti-star" style="color:#f5a623"></i>' +
        renderStarsHtml(avg) + ' <span style="color:#444">' +
        (total > 0 ? avg.toFixed(1) + ' / 5' : 'Chưa có') +
        '</span> <span style="color:#888;font-weight:400">(' + total + ' đánh giá)</span>';

    var listEl = document.getElementById('srm-list');
    if (!total) {
        listEl.innerHTML = '<div style="text-align:center;padding:30px 16px;color:#888">'
            + '<i class="ti-comments-smiley" style="font-size:42px;color:#ddd;display:block;margin-bottom:10px"></i>'
            + '<p style="margin:0;color:#888">Chưa có đánh giá nào.<br>Hãy là người đầu tiên!</p>'
            + '</div>';
        return;
    }
    listEl.innerHTML = reviews.map(function (rv) {
        var name    = escapeHtml(rv.username || rv.Username || 'Khách');
        var comment = escapeHtml(rv.comment  || rv.Comment  || '');
        var rating  = rv.rating || rv.Rating || 0;
        var created = rv.createdAt || rv.CreatedAt;
        var dt = '';
        if (created) {
            try { dt = new Date(created).toLocaleString('vi-VN'); } catch (e) {}
        }
        return '<div style="background:#fff;border:1px solid #eee;border-radius:14px;padding:12px 14px;margin-bottom:10px">'
            +    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'
            +      '<span style="display:flex;align-items:center;gap:8px;min-width:0">'
            +        '<span style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:#f2f2f2;color:#888;flex-shrink:0"><i class="ti-user"></i></span>'
            +        '<strong style="color:#222;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + name + '</strong>'
            +      '</span>'
            +      '<span style="flex-shrink:0">' + renderStarsHtml(rating) + '</span>'
            +    '</div>'
            +    (dt ? '<div style="font-size:12px;color:#999;margin-bottom:6px;display:flex;align-items:center;gap:5px"><i class="ti-time"></i>' + dt + '</div>' : '')
            +    '<div style="color:#444;white-space:pre-wrap;line-height:1.5">' + comment + '</div>'
            +  '</div>';
    }).join('');
}

function loadStoreReviews(storeId) {
    apiGet('/review/store/' + storeId)
        .then(function (r) {
            if (!r.ok) throw new Error('store endpoint not available (' + r.status + ')');
            return r.json();
        })
        .then(function (data) {
            var reviews = data.reviews || data.Reviews || [];
            renderReviewList(storeId, reviews);
        })
        .catch(function () {
            // Fallback: gọi get-all rồi lọc theo storeID (cho trường hợp backend chưa rebuild)
            apiGet('/review/get-all')
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    var all = Array.isArray(data) ? data : (data.data || []);
                    var filtered = all.filter(function (rv) {
                        var sid = rv.storeID != null ? rv.storeID : rv.StoreID;
                        return sid === storeId || String(sid) === String(storeId);
                    });
                    renderReviewList(storeId, filtered);
                })
                .catch(function () {
                    document.getElementById('srm-summary').textContent = '';
                    document.getElementById('srm-list').innerHTML =
                        '<div style="text-align:center;padding:30px 16px;color:#c0392b">'
                        + '<i class="ti-na" style="font-size:38px;display:block;margin-bottom:10px;opacity:.7"></i>'
                        + '<p style="margin:0">Không tải được đánh giá.</p></div>';
                });
        });
}

function renderReviewForm(storeId) {
    var wrap = document.getElementById('srm-form-wrap');
    var token = (typeof getToken === 'function') ? getToken() : null;
    var isUser = !!token && (localStorage.getItem('role') === 'user');

    if (!isUser) {
        wrap.innerHTML = '<p style="margin:0;color:#888;text-align:center;display:flex;align-items:center;justify-content:center;gap:6px"><i class="ti-user"></i> Vui lòng đăng nhập tài khoản khách hàng để viết đánh giá.</p>';
        return;
    }

    wrap.innerHTML = ''
        + '<div style="font-weight:700;margin-bottom:8px;color:#333;display:flex;align-items:center;gap:6px"><i class="ti-pencil-alt" style="color:#dc4d0b"></i> Viết đánh giá của bạn</div>'
        + '<div id="srm-star-picker" style="font-size:24px;cursor:pointer;letter-spacing:4px;color:#ddd;margin-bottom:8px">'
        +   '<span data-v="1">☆</span><span data-v="2">☆</span><span data-v="3">☆</span><span data-v="4">☆</span><span data-v="5">☆</span>'
        + '</div>'
        + '<textarea id="srm-comment" rows="3" maxlength="1000" placeholder="Cảm nhận của bạn..." style="width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:12px;font-family:inherit;resize:vertical;box-sizing:border-box"></textarea>'
        + '<div style="display:flex;justify-content:flex-end;margin-top:10px">'
        +   '<button type="button" id="srm-submit" style="display:flex;align-items:center;gap:6px;background:var(--primary,#ff6b00);color:#fff;border:none;padding:9px 20px;border-radius:10px;font-weight:700;cursor:pointer;transition:transform .1s"><i class="ti-check"></i> Gửi đánh giá</button>'
        + '</div>';

    var picker = document.getElementById('srm-star-picker');
    var selected = 0;
    function paint(val) {
        Array.prototype.forEach.call(picker.children, function (span) {
            var v = parseInt(span.getAttribute('data-v'), 10);
            span.textContent = v <= val ? '★' : '☆';
            span.style.color = v <= val ? '#f5a623' : '#ddd';
        });
    }
    Array.prototype.forEach.call(picker.children, function (span) {
        span.addEventListener('mouseover', function () { paint(parseInt(span.getAttribute('data-v'), 10)); });
        span.addEventListener('click', function () {
            selected = parseInt(span.getAttribute('data-v'), 10);
            paint(selected);
        });
    });
    picker.addEventListener('mouseleave', function () { paint(selected); });

    var submitBtn = document.getElementById('srm-submit');
    submitBtn.addEventListener('mouseenter', function () { if (!this.disabled) this.style.transform = 'translateY(-2px)'; });
    submitBtn.addEventListener('mouseleave', function () { this.style.transform = 'translateY(0)'; });
    submitBtn.addEventListener('click', function () {
        if (selected < 1 || selected > 5) { alert('Vui lòng chọn số sao (1-5).'); return; }
        var comment = document.getElementById('srm-comment').value.trim();
        if (!comment) { alert('Vui lòng viết nội dung đánh giá.'); return; }

        var btn = this; btn.disabled = true; btn.innerHTML = '<i class="ti-reload"></i> Đang gửi...';
        apiPost('/review/create', { storeID: storeId, rating: selected, comment: comment })
            .then(function (r) {
                if (!r.ok) return r.text().then(function (t) { throw new Error(t || 'Lỗi gửi đánh giá'); });
                return r.text();
            })
            .then(function () {
                btn.disabled = false; btn.innerHTML = '<i class="ti-check"></i> Gửi đánh giá';
                loadStoreReviews(storeId);
                document.getElementById('srm-comment').value = '';
                selected = 0; paint(0);
                if (typeof loadStores === 'function') loadStores();
            })
            .catch(function (e) {
                btn.disabled = false; btn.innerHTML = '<i class="ti-check"></i> Gửi đánh giá';
                alert('Không gửi được đánh giá: ' + (e && e.message ? e.message : ''));
            });
    });
}

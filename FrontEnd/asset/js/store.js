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

    return '<div class="store-card" id="store-card-' + id + '">' +
        '<div class="store-card-name">' + rankBadge + '<i class="ti-home"></i> ' + name + '</div>' +
        (addrText ? '<div class="store-card-info"><i class="ti-location-pin"></i><span>' + addrText + '</span></div>' : '') +
        distHtml +
        '<div class="store-card-info"><i class="ti-headphone-alt"></i><span>' + (store.phone || store.Phone || '') + '</span></div>' +
        '<div class="store-card-info"><i class="ti-email"></i><span>' + (store.email || store.Email || '') + '</span></div>' +
        '<div class="store-card-info"><i class="ti-agenda"></i><span>Sức chứa: ' + (store.seatingCapacity || store.SeatingCapacity || '?') + ' người</span></div>' +
        (hasCoords
            ? '<a class="store-directions-btn" href="' + getDirectionsUrl(addr.latitude, addr.longitude) +
              '" target="_blank" onclick="event.stopPropagation()">🗺️ Chỉ đường Google Maps</a>'
            : '') +
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

            renderStoreCards(allStores);

            var wrapper = document.getElementById('store-list-wrapper');
            if (wrapper) wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });

            btn.disabled = false;
            btn.innerHTML = '<i class="ti-location-pin"></i> Cập nhật vị trí';
        },
        function () {
            alert('Không thể lấy vị trí. Vui lòng cho phép truy cập vị trí trong trình duyệt.');
            btn.disabled = false;
            btn.innerHTML = '<i class="ti-location-pin"></i> Tìm cửa hàng gần tôi nhất';
        }
    );
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

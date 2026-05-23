var storeMap = null;
var storeMarkers = [];
var allStores = [];
var userMarker = null;
var nearestStoreId = null;

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
    return [addr.houseNumber, addr.street, addr.ward, addr.district, addr.province]
        .filter(Boolean).join(', ');
}

function initStoreMap() {
    if (storeMap) return;
    storeMap = L.map('store-map').setView([10.7769, 106.7009], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(storeMap);
    // Fix map size khi panel đang ẩn
    setTimeout(function () { storeMap.invalidateSize(); }, 300);
    loadStoresOnMap();
}

var orangeIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

var redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

var blueIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

function placeStoreMarker(store, isNearest) {
    var addr = store.address || store.Address;
    if (!addr || addr.latitude == null || addr.longitude == null) return null;
    var marker = L.marker([addr.latitude, addr.longitude], {
        icon: isNearest ? redIcon : orangeIcon,
        title: store.storeName || store.StoreName
    }).addTo(storeMap);
    marker.bindPopup(
        '<div style="font-family:sans-serif;min-width:180px">' +
        '<strong style="color:#dc4d0b">' + (store.storeName || store.StoreName) + '</strong><br>' +
        '<span style="font-size:12px;color:#555">' + formatAddress(addr) + '</span><br>' +
        '<a href="' + getDirectionsUrl(addr.latitude, addr.longitude) + '" target="_blank" ' +
        'style="display:inline-block;margin-top:6px;padding:4px 10px;background:#dc4d0b;color:#fff;border-radius:4px;text-decoration:none;font-size:12px">🗺️ Chỉ đường</a>' +
        '</div>'
    );
    return marker;
}

function loadStoresOnMap() {
    apiGet('/store/get-all')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            allStores = Array.isArray(data) ? data : (data.data || []);
            storeMarkers.forEach(function (m) { storeMap.removeLayer(m); });
            storeMarkers = [];

            var validLatLngs = [];
            allStores.forEach(function (s) {
                var m = placeStoreMarker(s, false);
                if (m) {
                    storeMarkers.push(m);
                    var addr = s.address || s.Address;
                    validLatLngs.push([addr.latitude, addr.longitude]);
                }
            });

            if (validLatLngs.length > 0) {
                storeMap.fitBounds(validLatLngs, { padding: [30, 30] });
            }

            renderStoreCards(allStores, null);
        })
        .catch(function () {
            document.getElementById('store-list').innerHTML =
                '<p style="color:#aaa;text-align:center;padding:20px">Không thể tải danh sách cửa hàng.</p>';
        });
}

function renderStoreCards(stores, nearestId) {
    var storeList = document.getElementById('store-list');
    if (!stores || stores.length === 0) {
        storeList.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px">Chưa có cửa hàng nào.</p>';
        return;
    }
    storeList.innerHTML = stores.map(function (s) {
        var addr = s.address || s.Address;
        var addrText = formatAddress(addr);
        var id = s.storeID || s.StoreID;
        var hasCoords = addr && addr.latitude != null && addr.longitude != null;
        var isNearest = id === nearestId;
        return '<div class="store-card' + (isNearest ? ' store-card-nearest' : '') + '" id="store-card-' + id + '">' +
            (isNearest ? '<div class="store-nearest-badge">📍 Gần bạn nhất</div>' : '') +
            '<div class="store-card-name"><i class="ti-home"></i> ' + (s.storeName || s.StoreName) + '</div>' +
            (addrText ? '<div class="store-card-info"><i class="ti-location-pin"></i><span>' + addrText + '</span></div>' : '') +
            '<div class="store-card-info"><i class="ti-headphone-alt"></i><span>' + (s.phone || s.Phone) + '</span></div>' +
            '<div class="store-card-info"><i class="ti-email"></i><span>' + (s.email || s.Email) + '</span></div>' +
            '<div class="store-card-info"><i class="ti-agenda"></i><span>Sức chứa: ' + (s.seatingCapacity || s.SeatingCapacity) + ' người</span></div>' +
            (hasCoords ? '<a class="store-directions-btn" href="' + getDirectionsUrl(addr.latitude, addr.longitude) + '" target="_blank">🗺️ Chỉ đường</a>' : '') +
            '</div>';
    }).join('');
}

function findNearestStore() {
    if (!navigator.geolocation) {
        alert('Trình duyệt không hỗ trợ định vị.');
        return;
    }
    var btn = document.getElementById('find-nearest-btn');
    btn.disabled = true;
    btn.innerHTML = '<i class="ti-location-pin"></i> Đang xác định vị trí...';

    navigator.geolocation.getCurrentPosition(
        function (position) {
            var userLat = position.coords.latitude;
            var userLng = position.coords.longitude;

            if (userMarker) storeMap.removeLayer(userMarker);
            userMarker = L.marker([userLat, userLng], {
                icon: blueIcon,
                title: 'Vị trí của bạn'
            }).addTo(storeMap).bindPopup('<strong>Vị trí của bạn</strong>').openPopup();

            var validStores = allStores.filter(function (s) {
                var addr = s.address || s.Address;
                return addr && addr.latitude != null && addr.longitude != null;
            });

            if (validStores.length === 0) {
                alert('Các cửa hàng chưa có tọa độ.');
                btn.disabled = false;
                btn.innerHTML = '<i class="ti-location-pin"></i> Tìm cửa hàng gần tôi nhất';
                return;
            }

            var nearest = validStores.reduce(function (best, s) {
                var addr = s.address || s.Address;
                var dist = haversineDistance(userLat, userLng, addr.latitude, addr.longitude);
                return dist < best.dist ? { store: s, dist: dist } : best;
            }, { store: validStores[0], dist: Infinity });

            nearestStoreId = nearest.store.storeID || nearest.store.StoreID;
            var nearestAddr = nearest.store.address || nearest.store.Address;

            // Cập nhật lại markers
            storeMarkers.forEach(function (m) { storeMap.removeLayer(m); });
            storeMarkers = [];
            allStores.forEach(function (s) {
                var id = s.storeID || s.StoreID;
                var m = placeStoreMarker(s, id === nearestStoreId);
                if (m) storeMarkers.push(m);
            });

            storeMap.setView([nearestAddr.latitude, nearestAddr.longitude], 15);

            renderStoreCards(allStores, nearestStoreId);

            var label = document.getElementById('nearest-store-label');
            label.textContent = 'Cửa hàng gần bạn nhất: ' +
                (nearest.store.storeName || nearest.store.StoreName) +
                ' (' + nearest.dist.toFixed(1) + ' km)';
            label.style.display = 'block';

            var nearestCard = document.getElementById('store-card-' + nearestStoreId);
            if (nearestCard) nearestCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

            btn.disabled = false;
            btn.innerHTML = '<i class="ti-location-pin"></i> Tìm cửa hàng gần tôi nhất';
        },
        function () {
            alert('Không thể lấy vị trí. Vui lòng cho phép truy cập vị trí trong trình duyệt.');
            btn.disabled = false;
            btn.innerHTML = '<i class="ti-location-pin"></i> Tìm cửa hàng gần tôi nhất';
        }
    );
}

(function () {
    var panel = document.getElementById('store-panel');
    var backdrop = document.getElementById('store-panel-backdrop');
    var storeBtn = document.getElementById('nav-store-btn');
    var closeBtn = document.getElementById('store-panel-close');
    var mapInited = false;

    function openPanel() {
        panel.classList.add('open');
        backdrop.classList.add('open');
        if (!mapInited) {
            mapInited = true;
            // Đợi panel hiển thị xong rồi mới init map để Leaflet tính đúng kích thước
            setTimeout(initStoreMap, 50);
        } else if (storeMap) {
            storeMap.invalidateSize();
        }
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
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    if (backdrop) backdrop.addEventListener('click', closePanel);
})();

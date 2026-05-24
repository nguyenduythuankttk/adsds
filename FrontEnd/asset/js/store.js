var storeMap = null;
var storeMarkerMap = {};
var allStores = [];
var userMarker = null;
var nearestStoreId = null;
var selectedStoreId = null;
var userLat = null;
var userLng = null;
var infoWindow = null;

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

function getMarkerIcon(storeId) {
    if (storeId === selectedStoreId) return 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';
    if (storeId === nearestStoreId) return 'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
    return 'https://maps.google.com/mapfiles/ms/icons/orange-dot.png';
}

function initStoreMap() {
    if (storeMap) return;
    storeMap = new google.maps.Map(document.getElementById('store-map'), {
        center: { lat: 15.88, lng: 108.0 },
        zoom: 6,
        mapTypeControl: false,
        fullscreenControl: false,
        streetViewControl: false
    });
    infoWindow = new google.maps.InfoWindow();
    loadStoresOnMap();
}

function placeStoreMarker(store) {
    var addr = store.address || store.Address;
    if (!addr || addr.latitude == null || addr.longitude == null) return null;
    var id = store.storeID || store.StoreID;
    var marker = new google.maps.Marker({
        position: { lat: addr.latitude, lng: addr.longitude },
        map: storeMap,
        title: store.storeName || store.StoreName,
        icon: getMarkerIcon(id)
    });

    var content =
        '<div style="font-family:sans-serif;min-width:180px;padding:4px 2px">' +
        '<strong style="color:#dc4d0b;font-size:14px">' + (store.storeName || store.StoreName) + '</strong><br>' +
        '<span style="font-size:12px;color:#555">' + formatAddress(addr) + '</span><br>' +
        '<a href="' + getDirectionsUrl(addr.latitude, addr.longitude) + '" target="_blank" ' +
        'style="display:inline-block;margin-top:8px;padding:5px 12px;background:#dc4d0b;color:#fff;border-radius:5px;text-decoration:none;font-size:12px;font-weight:600">🗺️ Chỉ đường Google Maps</a>' +
        '</div>';

    marker.addListener('click', function () {
        infoWindow.setContent(content);
        infoWindow.open(storeMap, marker);
        selectedStoreId = id;
        refreshMarkerIcons();
        renderStoreCards(allStores);
    });

    return marker;
}

function refreshMarkerIcons() {
    allStores.forEach(function (s) {
        var id = s.storeID || s.StoreID;
        var marker = storeMarkerMap[id];
        if (marker) marker.setIcon(getMarkerIcon(id));
    });
}

function loadStoresOnMap() {
    apiGet('/store/get-all')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            allStores = Array.isArray(data) ? data : (data.data || []);
            Object.values(storeMarkerMap).forEach(function (m) { m.setMap(null); });
            storeMarkerMap = {};

            var bounds = new google.maps.LatLngBounds();
            var hasValid = false;

            allStores.forEach(function (s) {
                var id = s.storeID || s.StoreID;
                var m = placeStoreMarker(s);
                if (m) {
                    storeMarkerMap[id] = m;
                    var addr = s.address || s.Address;
                    bounds.extend({ lat: addr.latitude, lng: addr.longitude });
                    hasValid = true;
                }
            });

            if (hasValid) storeMap.fitBounds(bounds, { padding: 60 });

            renderStoreCards(allStores);
        })
        .catch(function () {
            document.getElementById('store-list').innerHTML =
                '<p style="color:#aaa;text-align:center;padding:20px">Không thể tải danh sách cửa hàng.</p>';
        });
}

function selectStore(id) {
    selectedStoreId = (selectedStoreId === id) ? null : id;
    refreshMarkerIcons();
    renderStoreCards(allStores);

    if (selectedStoreId) {
        var store = allStores.find(function (s) {
            return (s.storeID || s.StoreID) === selectedStoreId;
        });
        if (store) {
            var addr = store.address || store.Address;
            if (addr && addr.latitude != null && addr.longitude != null) {
                storeMap.panTo({ lat: addr.latitude, lng: addr.longitude });
                storeMap.setZoom(16);
                var marker = storeMarkerMap[selectedStoreId];
                if (marker) setTimeout(function () { infoWindow.open(storeMap, marker); }, 300);
            }
        }
    }
}

function renderStoreCards(stores) {
    var storeList = document.getElementById('store-list');
    if (!stores || stores.length === 0) {
        storeList.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px">Chưa có cửa hàng nào.</p>';
        return;
    }

    var sorted = stores.slice();
    if (userLat !== null && userLng !== null) {
        sorted.sort(function (a, b) {
            var aa = a.address || a.Address || {};
            var ba = b.address || b.Address || {};
            var da = (aa.latitude != null) ? haversineDistance(userLat, userLng, aa.latitude, aa.longitude) : Infinity;
            var db = (ba.latitude != null) ? haversineDistance(userLat, userLng, ba.latitude, ba.longitude) : Infinity;
            return da - db;
        });
    }

    storeList.innerHTML = sorted.map(function (s) {
        var addr = s.address || s.Address;
        var addrText = formatAddress(addr);
        var id = s.storeID || s.StoreID;
        var hasCoords = addr && addr.latitude != null && addr.longitude != null;
        var isNearest = id === nearestStoreId;
        var isSelected = id === selectedStoreId;

        var distHtml = '';
        if (userLat !== null && userLng !== null && hasCoords) {
            var dist = haversineDistance(userLat, userLng, addr.latitude, addr.longitude);
            distHtml = '<div class="store-card-info store-card-distance">' +
                '<i class="ti-map"></i><span>' + dist.toFixed(1) + ' km từ vị trí của bạn</span></div>';
        }

        var classes = 'store-card';
        if (isNearest) classes += ' store-card-nearest';
        if (isSelected) classes += ' store-card-selected';

        return '<div class="' + classes + '" id="store-card-' + id + '" onclick="selectStore(' + id + ')">' +
            (isNearest ? '<div class="store-nearest-badge">📍 Gần bạn nhất</div>' : '') +
            (isSelected ? '<div class="store-selected-badge">✓ Đang chọn</div>' : '') +
            '<div class="store-card-name"><i class="ti-home"></i> ' + (s.storeName || s.StoreName) + '</div>' +
            (addrText ? '<div class="store-card-info"><i class="ti-location-pin"></i><span>' + addrText + '</span></div>' : '') +
            distHtml +
            '<div class="store-card-info"><i class="ti-headphone-alt"></i><span>' + (s.phone || s.Phone) + '</span></div>' +
            '<div class="store-card-info"><i class="ti-email"></i><span>' + (s.email || s.Email) + '</span></div>' +
            '<div class="store-card-info"><i class="ti-agenda"></i><span>Sức chứa: ' + (s.seatingCapacity || s.SeatingCapacity) + ' người</span></div>' +
            (hasCoords
                ? '<a class="store-directions-btn' + (isSelected ? ' store-directions-btn-selected' : '') + '" href="' +
                  getDirectionsUrl(addr.latitude, addr.longitude) + '" target="_blank" onclick="event.stopPropagation()">🗺️ Chỉ đường Google Maps</a>'
                : '') +
            '</div>';
    }).join('');

    if (selectedStoreId) {
        var card = document.getElementById('store-card-' + selectedStoreId);
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
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
            userLat = position.coords.latitude;
            userLng = position.coords.longitude;

            if (userMarker) userMarker.setMap(null);
            userMarker = new google.maps.Marker({
                position: { lat: userLat, lng: userLng },
                map: storeMap,
                title: 'Vị trí của bạn',
                icon: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
            });
            infoWindow.setContent('<div style="font-weight:600;padding:2px 4px">📍 Vị trí của bạn</div>');
            infoWindow.open(storeMap, userMarker);

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
            selectedStoreId = nearestStoreId;

            refreshMarkerIcons();

            var nearestAddr = nearest.store.address || nearest.store.Address;
            storeMap.panTo({ lat: nearestAddr.latitude, lng: nearestAddr.longitude });
            storeMap.setZoom(15);

            renderStoreCards(allStores);

            var label = document.getElementById('nearest-store-label');
            label.textContent = 'Cửa hàng gần bạn nhất: ' +
                (nearest.store.storeName || nearest.store.StoreName) +
                ' (' + nearest.dist.toFixed(1) + ' km)';
            label.style.display = 'block';

            var marker = storeMarkerMap[nearestStoreId];
            if (marker) setTimeout(function () { infoWindow.open(storeMap, marker); }, 400);

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
            setTimeout(initStoreMap, 50);
        } else if (storeMap) {
            google.maps.event.trigger(storeMap, 'resize');
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

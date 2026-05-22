(function () {
    var panel     = document.getElementById('store-panel');
    var backdrop  = document.getElementById('store-panel-backdrop');
    var storeBtn  = document.getElementById('nav-store-btn');
    var closeBtn  = document.getElementById('store-panel-close');
    var storeList = document.getElementById('store-list');
    var loaded    = false;

    function formatAddress(addr) {
        if (!addr) return '';
        return [addr.houseNumber, addr.street, addr.ward, addr.district, addr.province]
            .filter(Boolean).join(', ');
    }

    function renderStores(stores) {
        if (!stores || stores.length === 0) {
            storeList.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px">Chưa có cửa hàng nào.</p>';
            return;
        }
        storeList.innerHTML = stores.map(function (s) {
            var addr = formatAddress(s.address || s.Address);
            return '<div class="store-card">' +
                '<div class="store-card-name"><i class="ti-home"></i> ' + (s.storeName || s.StoreName) + '</div>' +
                (addr ? '<div class="store-card-info"><i class="ti-location-pin"></i><span>' + addr + '</span></div>' : '') +
                '<div class="store-card-info"><i class="ti-headphone-alt"></i><span>' + (s.phone || s.Phone) + '</span></div>' +
                '<div class="store-card-info"><i class="ti-email"></i><span>' + (s.email || s.Email) + '</span></div>' +
                '<div class="store-card-info"><i class="ti-agenda"></i><span>Sức chứa: ' + (s.seatingCapacity || s.SeatingCapacity) + ' người</span></div>' +
                '</div>';
        }).join('');
    }

    function loadStores() {
        if (loaded) return;
        storeList.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px">Đang tải...</p>';
        apiGet('/store/get-all')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                loaded = true;
                renderStores(Array.isArray(data) ? data : (data.data || []));
            })
            .catch(function () {
                storeList.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px">Không thể tải danh sách cửa hàng.</p>';
            });
    }

    function openPanel() {
        panel.classList.add('open');
        backdrop.classList.add('open');
        loadStores();
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
})();

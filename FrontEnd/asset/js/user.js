(function ktraDangNhap() {
    var role = localStorage.getItem('role');
    if (!role || role !== 'user') {
        alert('Vui lòng đăng nhập để tiếp tục!');
        window.location.href = 'index.html';
        return;
    }
    var name    = localStorage.getItem('fullName') || '';
    var initial = name.charAt(0).toUpperCase();

    var sidebarAvatar = document.getElementById('sidebar-avatar');
    var sidebarName   = document.getElementById('sidebar-name');
    if (sidebarAvatar) sidebarAvatar.textContent = initial;
    if (sidebarName)   sidebarName.textContent   = name;

    loadSection('profile');

    document.querySelectorAll('.sidebar-item[data-section]').forEach(function (item) {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelectorAll('.sidebar-item').forEach(function (i) { i.classList.remove('active'); });
            item.classList.add('active');
            loadSection(item.dataset.section);
        });
    });

    var logoutBtn = document.getElementById('btn-logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function (e) {
            e.preventDefault();
            apiPost('/auth/logout').then(function () {
                clearAuth();
                window.location.href = 'index.html';
            }).catch(function () {
                clearAuth();
                window.location.href = 'index.html';
            });
        });
    }
})();

function loadSection(section) {
    var main = document.getElementById('user-main-content');
    if (!main) return;
    main.innerHTML = '<p style="padding:20px;color:var(--muted)">Đang tải...</p>';
    switch (section) {
        case 'profile': renderProfile(main); break;
        case 'orders':  renderOrders(main);  break;
        case 'address': renderAddress(main); break;
        case 'ticket':  renderTicket(main);  break;
        default:        renderProfile(main);
    }
}

// 1. THÔNG TIN TÀI KHOẢN
function renderProfile(main) {
    apiGet('/auth/me').then(function (r) { return r.json(); }).then(function (d) {
        var u = d.data || d;
        var dob    = (u.birthday || u.BirthDate || '').slice(0, 10);
        var gender = u.gender   || u.Gender    || '';
        main.innerHTML =
            '<div class="section-card">' +
            '<div class="section-card-header"><h2 class="section-card-title">👤 Thông tin tài khoản</h2></div>' +
            '<div class="section-card-body">' +
            '<div class="up-field-row">' +
            '<div class="up-field"><label>Họ và tên</label>' +
            '<input type="text" id="pf-name" value="' + (u.fullName || u.FullName || '') + '"></div>' +
            '<div class="up-field"><label>Giới tính</label>' +
            '<select id="pf-gender">' +
            '<option value="">-- Chọn --</option>' +
            '<option value="Male"'   + (gender === 'Male'   ? ' selected' : '') + '>Nam</option>' +
            '<option value="Female"' + (gender === 'Female' ? ' selected' : '') + '>Nữ</option>' +
            '<option value="Other"'  + (gender === 'Other'  ? ' selected' : '') + '>Khác</option>' +
            '</select></div>' +
            '</div>' +
            '<div class="up-field-row">' +
            '<div class="up-field"><label>Tên đăng nhập</label>' +
            '<input type="text" value="' + (u.userName || u.UserName || '') + '" readonly></div>' +
            '<div class="up-field"><label>Số điện thoại</label>' +
            '<input type="tel" id="pf-phone" value="' + (u.phone || u.Phone || '') + '" placeholder="Chưa cập nhật"></div>' +
            '</div>' +
            '<div class="up-field"><label>Ngày sinh</label>' +
            '<input type="date" id="pf-dob" value="' + dob + '"></div>' +
            '<button class="up-btn" onclick="saveProfile()">Lưu thay đổi</button>' +
            '</div></div>';
    }).catch(function () {
        main.innerHTML = '<p style="padding:20px;color:var(--muted)">Lỗi tải thông tin tài khoản.</p>';
    });
}

function saveProfile() {
    var name   = document.getElementById('pf-name').value.trim();
    var phone  = document.getElementById('pf-phone').value.trim();
    var dob    = document.getElementById('pf-dob').value;
    var gender = document.getElementById('pf-gender').value;
    if (!name) { alert('Vui lòng nhập họ tên.'); return; }
    var userId = localStorage.getItem('userId');
    apiPut('/user/Update/' + userId, { FullName: name, Phone: phone, BirthDate: dob || null, Gender: gender })
        .then(function (r) {
            if (!r.ok) throw new Error();
            localStorage.setItem('fullName', name);
            var initial = name.charAt(0).toUpperCase();
            var sidebarAvatar = document.getElementById('sidebar-avatar');
            var sidebarName   = document.getElementById('sidebar-name');
            if (sidebarAvatar) sidebarAvatar.textContent = initial;
            if (sidebarName)   sidebarName.textContent   = name;
            alert('Cập nhật thành công!');
        }).catch(function () { alert('Lỗi cập nhật thông tin!'); });
}

// 2. LỊCH SỬ ĐƠN HÀNG
function renderOrders(main) {
    apiGet('/bill/my-bills').then(function (r) { return r.json(); }).then(function (d) {
        var orders = Array.isArray(d) ? d : (d.data || []);
        if (!orders.length) {
            main.innerHTML =
                '<div class="section-card">' +
                '<div class="section-card-header"><h2 class="section-card-title">📦 Lịch sử đơn hàng</h2></div>' +
                '<div class="section-card-body"><p style="color:var(--muted)">Chưa có đơn hàng nào.</p></div></div>';
            return;
        }
        var rows = orders.map(function (o) {
            var status = o.BillStatus || o.Status || o.status || '';
            var statusClass = (status === 'Delivered' || status === 'Done' || status === 'Completed')
                            ? 'badge-success'
                            : (status === 'Pending' || status === 'Processing' ? 'badge-warning' : 'badge-danger');
            var items = (o.BillDetails || []).map(function (bd) {
                return (bd.ProductName || '') + ' ×' + (bd.Qty || bd.Quantity || 1);
            }).join(', ');
            var date  = (o.CreatedAt || o.Date || '').slice(0, 10);
            var total = o.TotalPrice || o.Total || 0;
            return '<div class="order-row">' +
                '<div class="order-icon">🍗</div>' +
                '<div class="order-info">' +
                '<div class="order-id">#' + (o.BillID || o.ID || '') + '</div>' +
                '<div class="order-items">' + (items || 'Xem chi tiết') + '</div>' +
                '<div class="order-date">' + date + '</div>' +
                '</div>' +
                '<div class="order-right">' +
                '<span class="order-total">' + total.toLocaleString('vi-VN') + 'đ</span>' +
                '<span class="order-badge ' + statusClass + '">' + status + '</span>' +
                '</div></div>';
        }).join('');
        main.innerHTML =
            '<div class="section-card">' +
            '<div class="section-card-header"><h2 class="section-card-title">📦 Lịch sử đơn hàng</h2></div>' +
            '<div class="section-card-body"><div class="order-list">' + rows + '</div></div></div>';
    }).catch(function () {
        main.innerHTML = '<p style="padding:20px;color:var(--muted)">Lỗi tải lịch sử đơn hàng.</p>';
    });
}

// 3. ĐỊA CHỈ GIAO HÀNG
function renderAddress(main) {
    apiGet('/address/my-addresses').then(function (r) { return r.json(); }).then(function (d) {
        var addrs = Array.isArray(d) ? d : (d.data || []);
        var canDelete = addrs.length > 1;
        var addrRows = addrs.map(function (a) {
            var id       = a.AddressID || a.addressID || a.ID || a.id;
            var isDef    = a.IsDefault || a.isDefault || false;
            var houseNum = a.HouseNumber || a.houseNumber;
            var parts    = [
                houseNum ? 'Số ' + houseNum : null,
                a.Street   || a.street,
                a.Ward     || a.ward,
                a.District || a.district,
                a.Province || a.province,
                a.Country  || a.country
            ].filter(Boolean);
            var fullAddr = parts.join(', ');
            var title    = a.Province || a.province || a.Street || a.street || 'Địa chỉ';
            return '<div class="addr-row' + (isDef ? ' is-default' : '') + '">' +
                '<div class="addr-left">' +
                '<div class="addr-label-wrap">' +
                '<span class="addr-label">' + title + '</span>' +
                (isDef ? '<span class="addr-default-badge">Mặc định</span>' : '') +
                '</div>' +
                '<p class="addr-text">' + fullAddr + '</p>' +
                '</div>' +
                '<div class="addr-actions">' +
                (!isDef ? '<button class="addr-btn-ghost" onclick="setDefault(\'' + id + '\')">Đặt mặc định</button>' : '') +
                (canDelete ? '<button class="addr-btn-ghost" style="color:#e74c3c;border-color:#fcc" onclick="deleteAddress(\'' + id + '\')">Xoá</button>' : '') +
                '</div></div>';
        }).join('');

        main.innerHTML =
            '<div class="section-card">' +
            '<div class="section-card-header"><h2 class="section-card-title">📍 Địa chỉ giao hàng</h2></div>' +
            '<div class="section-card-body">' +
            '<div class="addr-list">' + (addrRows || '<p style="color:var(--muted)">Chưa có địa chỉ nào.</p>') + '</div>' +
            '<div class="add-addr-card">' +
            '<p class="add-addr-title">➕ Thêm địa chỉ mới</p>' +
            '<div class="up-field-row">' +
            '<div class="up-field"><label>SỐ NHÀ</label>' +
            '<input type="number" id="addr-housenumber" placeholder="VD: 123"></div>' +
            '<div class="up-field"><label>ĐƯỜNG <span style="color:#e74c3c">*</span></label>' +
            '<input type="text" id="addr-street" placeholder="VD: Nguyễn Văn Linh"></div>' +
            '</div>' +
            '<div class="up-field-row">' +
            '<div class="up-field"><label>PHƯỜNG/XÃ <span style="color:#e74c3c">*</span></label>' +
            '<input type="text" id="addr-ward" placeholder="VD: Phường 1"></div>' +
            '<div class="up-field"><label>QUẬN/HUYỆN <span style="color:#e74c3c">*</span></label>' +
            '<input type="text" id="addr-district" placeholder="VD: Quận 7"></div>' +
            '</div>' +
            '<div class="up-field-row">' +
            '<div class="up-field"><label>TỈNH/THÀNH PHỐ <span style="color:#e74c3c">*</span></label>' +
            '<input type="text" id="addr-province" placeholder="VD: TP. Hồ Chí Minh"></div>' +
            '<div class="up-field"><label>QUỐC GIA</label>' +
            '<input type="text" id="addr-country" value="Viet Nam" placeholder="Viet Nam"></div>' +
            '</div>' +
            '<button class="up-btn" onclick="addAddress()">Thêm địa chỉ</button>' +
            '</div></div></div>';
    }).catch(function () {
        main.innerHTML = '<p style="padding:20px;color:var(--muted)">Lỗi tải địa chỉ.</p>';
    });
}

function setDefault(id) {
    apiPut('/address/set-default/' + id).then(function (r) {
        if (!r.ok) throw new Error();
        loadSection('address');
    }).catch(function () { alert('Lỗi đặt địa chỉ mặc định!'); });
}

function addAddress() {
    var houseNumber = document.getElementById('addr-housenumber').value.trim();
    var street      = document.getElementById('addr-street').value.trim();
    var ward        = document.getElementById('addr-ward').value.trim();
    var district    = document.getElementById('addr-district').value.trim();
    var province    = document.getElementById('addr-province').value.trim();
    var country     = document.getElementById('addr-country').value.trim() || 'Viet Nam';
    if (!street || !ward || !district || !province) {
        alert('Vui lòng điền đầy đủ: Đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố.');
        return;
    }
    apiPost('/address/add', {
        HouseNumber: houseNumber ? parseInt(houseNumber) : null,
        Street: street,
        Ward: ward,
        District: district,
        Province: province,
        Country: country
    }).then(function (r) {
        if (!r.ok) throw new Error();
        loadSection('address');
    }).catch(function () { alert('Lỗi thêm địa chỉ!'); });
}

function deleteAddress(id) {
    if (!confirm('Bạn có chắc muốn xoá địa chỉ này?')) return;
    apiDelete('/address/delete/' + id).then(function (r) {
        if (!r.ok) throw new Error();
        loadSection('address');
    }).catch(function () { alert('Lỗi xoá địa chỉ!'); });
}

// 4. MÃ GIẢM GIÁ
function renderTicket(main) {
    var start = '2020-01-01';
    var end   = new Date().toISOString().slice(0, 10);
    apiGet('/ticket/get-all/' + start + '/' + end).then(function (r) { return r.json(); }).then(function (d) {
        var tickets = Array.isArray(d) ? d : (d.data || []);
        if (!tickets.length) {
            main.innerHTML =
                '<div class="section-card">' +
                '<div class="section-card-header"><h2 class="section-card-title">🎟️ Mã giảm giá</h2></div>' +
                '<div class="section-card-body"><p style="color:var(--muted)">Chưa có mã giảm giá nào.</p></div></div>';
            return;
        }
        var cards = tickets.map(function (t) {
            var code    = t.TicketCode || t.Code || String(t.TicketID || '');
            var disc    = t.DiscountAmount || t.DiscountPercent || 0;
            var discStr = t.DiscountPercent ? (t.DiscountPercent + '%') : disc.toLocaleString('vi-VN') + 'đ';
            var desc    = t.Description || ('Giảm ' + discStr);
            var endDate = (t.EndDate || t.ExpiryDate || '').slice(0, 10);
            var used    = t.IsUsed || t.used || false;
            return '<div class="ticket-card' + (used ? ' used' : '') + '">' +
                '<span class="ticket-code">' + code + '</span>' +
                '<p class="ticket-desc">' + desc + '</p>' +
                '<div class="ticket-footer">' +
                '<span class="ticket-date">HSD: ' + (endDate || '—') + '</span>' +
                (used
                    ? '<span class="ticket-used-badge">Đã dùng</span>'
                    : '<button class="up-btn up-btn-sm" onclick="copyCode(\'' + code + '\')">Sao chép</button>') +
                '</div></div>';
        }).join('');
        main.innerHTML =
            '<div class="section-card">' +
            '<div class="section-card-header"><h2 class="section-card-title">🎟️ Mã giảm giá</h2></div>' +
            '<div class="section-card-body"><div class="ticket-grid">' + cards + '</div></div></div>';
    }).catch(function () {
        main.innerHTML = '<p style="padding:20px;color:var(--muted)">Lỗi tải mã giảm giá.</p>';
    });
}

function copyCode(code) {
    navigator.clipboard.writeText(code).then(function () {
        alert('Đã sao chép mã: ' + code);
    });
}

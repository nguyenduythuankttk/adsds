(function ktraDangNhap() {
    var role = localStorage.getItem('role');
    if (!role || role !== 'user') {
        alert('Vui lòng đăng nhập để tiếp tục!');
        window.location.href = 'index.html';
        return;
    }
    if (isTokenExpired()) {
        clearAuth();
        window.location.href = 'index.html';
        return;
    }
    var name    = localStorage.getItem('fullName') || '';
    var initial = name.charAt(0).toUpperCase();

    // Sidebar
    var sidebarAvatar = document.getElementById('sidebar-avatar');
    var sidebarName   = document.getElementById('sidebar-name');
    if (sidebarAvatar) sidebarAvatar.textContent = initial;
    if (sidebarName)   sidebarName.textContent   = name;

    // Header avatar
    var headerInitial = document.getElementById('header-avatar-initial');
    var headerName    = document.getElementById('header-avatar-name');
    var shortName     = name.split(' ').pop();
    if (headerInitial) headerInitial.textContent = initial;
    if (headerName)    headerName.textContent    = shortName;

    // Mapping header user icon to user.html
    var headerAvatarBtn = document.getElementById('headerAvatarBtn');
    if (headerAvatarBtn) {
        headerAvatarBtn.addEventListener('click', function () {
            window.location.href = 'user.html';
        });
    }

    // Cart-fab: đọc số lượng từ localStorage rồi hiện badge
    (function () {
        var CART_KEY = 'chonlibi_cart';
        var cartFab  = document.getElementById('cart-fab');
        var countEl  = document.getElementById('cart-count');
        try {
            var cart  = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
            var total = cart.reduce(function (s, i) { return s + (i.qty || 0); }, 0);
            if (countEl) {
                countEl.textContent = total;
                total > 0 ? countEl.classList.add('visible') : countEl.classList.remove('visible');
            }
        } catch (e) {}
        if (cartFab) {
            cartFab.style.display = '';
            cartFab.addEventListener('click', function () {
                window.location.href = 'menu.html';
            });
        }
    })();

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
        case 'profile':  renderProfile(main);   break;
        case 'orders':   renderOrders(main);    break;
        case 'address':  renderAddress(main);   break;
        case 'ticket':   renderTicket(main);    break;
        case 'password': renderPassword(main);  break;
        default:         renderProfile(main);
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
            '<option value="Others"'  + (gender === 'Others'  ? ' selected' : '') + '>Khác</option>' +
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
var _statusViMap = { Create: 'Đã tạo', UnPaid: 'Chờ thanh toán', Paid: 'Đã thanh toán', Delete: 'Đã hủy' };

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
        window._userOrders = orders;
        var rows = orders.map(function (o, idx) {
            var changes  = o.billChange || o.BillChange || [];
            var latest   = changes.length ? changes[0] : {};
            var status   = latest.status || latest.Status || '';
            var statusVi = _statusViMap[status] || status;
            var statusClass = (status === 'Paid') ? 'badge-success'
                : (status === 'Create' || status === 'UnPaid') ? 'badge-warning' : 'badge-danger';

            var createChange = changes.slice().reverse().find(function (c) { return (c.status || c.Status) === 'Create'; }) || {};
            var date = (createChange.changeAt || createChange.ChangeAt || '').slice(0, 10);

            var details = o.detail || o.Detail || o.billDetail || o.BillDetail || [];
            var items = details.map(function (bd) {
                var pv   = bd.productVarient || bd.ProductVarient || {};
                var prod = pv.product || pv.Product || {};
                return (prod.productName || prod.ProductName || 'Sản phẩm') + ' ×' + (bd.quantity || bd.Quantity || 1);
            }).join(', ');

            var total  = o.total || o.Total || 0;
            var billId = o.billID || o.BillID || '';
            return '<div class="order-row">' +
                '<div class="order-icon">🍗</div>' +
                '<div class="order-info">' +
                '<div class="order-id">#' + billId.slice(0, 8).toUpperCase() + '</div>' +
                '<div class="order-items">' + (items || '—') + '</div>' +
                '<div class="order-date">' + (date || '—') + '</div>' +
                '</div>' +
                '<div class="order-right">' +
                '<span class="order-total">' + Number(total).toLocaleString('vi-VN') + 'đ</span>' +
                '<span class="order-badge ' + statusClass + '">' + statusVi + '</span>' +
                '<button class="order-detail-btn" onclick="showBillModal(' + idx + ')">Chi tiết</button>' +
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

function formatAddressText(a) {
    if (!a) return null;
    var parts = [];
    if (a.streetAddress) parts.push(a.streetAddress);
    if (a.district) parts.push(a.district);
    if (a.province) parts.push(a.province);
    return parts.join(', ') || null;
}

function showBillModal(idx) {
    var o = (window._userOrders || [])[idx];
    if (!o) return;

    var billId        = o.billID || o.BillID || '';
    var total         = Number(o.total || o.Total || 0);
    var vat           = Number(o.vat || o.VAT || 0.1);
    var moneyReceived = Number(o.moneyReceived || o.MoneyReceived || 0);
    var moneyGiveBack = Number(o.moneyGiveBack || o.MoneyGiveBack || 0);
    var note          = o.note || o.Note || '';
    var payMethod     = o.paymentMethods || o.PaymentMethods || '';
    var payDisplay    = payMethod === 'Cash' ? 'Tiền mặt'
                      : payMethod === 'BankTransfer' ? 'Chuyển khoản / Thẻ'
                      : payMethod === 'Card' ? 'Thẻ / Chuyển khoản'
                      : payMethod;
    var subtotal      = vat > 0 ? total / (1 + vat) : total;
    var vatAmt        = total - subtotal;
    var tableID       = o.tableID || o.TableID || null;

    var store         = o.store || o.Store || null;
    var storeName     = store ? (store.storeName || store.StoreName || '') : '';
    var storeAddr     = store ? formatAddressText(store.address || store.Address) : null;

    var deliveryAddr  = o.address || o.Address || null;
    var deliveryText  = formatAddressText(deliveryAddr);

    // Items table
    var details  = o.detail || o.Detail || o.billDetail || o.BillDetail || [];
    var itemRows = details.map(function (bd) {
        var pv    = bd.productVarient || bd.ProductVarient || {};
        var prod  = pv.product || pv.Product || {};
        var name  = prod.productName || prod.ProductName || 'Sản phẩm';
        var size  = pv.size || pv.Size || 'Default';
        var qty   = Number(bd.quantity || bd.Quantity || 1);
        var price = Number(bd.price || bd.Price || 0);
        var line  = Number(bd.inlineTotal || bd.InlineTotal || qty * price);
        return '<tr>' +
            '<td>' + name + '</td>' +
            '<td style="text-align:center">' + (size === 'Default' ? '—' : size) + '</td>' +
            '<td style="text-align:center">' + qty + '</td>' +
            '<td style="text-align:right">' + price.toLocaleString('vi-VN') + 'đ</td>' +
            '<td style="text-align:right"><b>' + line.toLocaleString('vi-VN') + 'đ</b></td>' +
            '</tr>';
    }).join('');
    var itemsHtml = itemRows
        ? '<table class="bill-table"><thead><tr><th>Sản phẩm</th><th>Size</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead><tbody>' + itemRows + '</tbody></table>'
        : '<p style="color:#aaa;font-size:13px;margin:0">Không có thông tin sản phẩm.</p>';

    // Status timeline (oldest → newest)
    var changes = (o.billChange || o.BillChange || []).slice().reverse();
    var createdAt = changes.length ? (changes[0].changeAt || changes[0].ChangeAt || '').replace('T', ' ').slice(0, 16) : '—';
    var timelineHtml = changes.map(function (bc, i) {
        var st   = bc.status || bc.Status || '';
        var time = (bc.changeAt || bc.ChangeAt || '').replace('T', ' ').slice(0, 16);
        var isLast = i === changes.length - 1;
        return '<div class="bill-tl-step' + (isLast ? ' bill-tl-last' : '') + '">' +
            '<div class="bill-tl-dot"></div>' +
            '<div class="bill-tl-body">' +
            '<span class="bill-tl-label">' + (_statusViMap[st] || st) + '</span>' +
            '<span class="bill-tl-time">' + time + '</span>' +
            '</div></div>';
    }).join('');

    var html =
        '<div class="bill-overlay" onclick="if(event.target===this)closeBillModal()">' +
        '<div class="bill-box">' +
        '<div class="bill-box-header">' +
        '<div>' +
        '<div class="bill-box-id">HOÁ ĐƠN #' + billId.slice(0, 8).toUpperCase() + '</div>' +
        '<div class="bill-box-date">' + createdAt + '</div>' +
        '</div>' +
        '<button class="bill-close-btn" onclick="closeBillModal()">✕</button>' +
        '</div>' +
        '<div class="bill-box-body">' +

        '<div class="bill-section-lbl">🛒 Sản phẩm</div>' +
        itemsHtml +

        '<div class="bill-totals-block">' +
        '<div class="bill-tot-row"><span>Tạm tính</span><span>' + subtotal.toLocaleString('vi-VN') + 'đ</span></div>' +
        '<div class="bill-tot-row"><span>VAT (' + Math.round(vat * 100) + '%)</span><span>' + vatAmt.toLocaleString('vi-VN') + 'đ</span></div>' +
        '<div class="bill-tot-row bill-tot-final"><span>Tổng cộng</span><span>' + total.toLocaleString('vi-VN') + 'đ</span></div>' +
        (moneyReceived > 0 ? '<div class="bill-tot-row"><span>Tiền nhận</span><span>' + moneyReceived.toLocaleString('vi-VN') + 'đ</span></div>' : '') +
        (moneyGiveBack > 0 ? '<div class="bill-tot-row"><span>Tiền thối</span><span>' + moneyGiveBack.toLocaleString('vi-VN') + 'đ</span></div>' : '') +
        '</div>' +

        '<div class="bill-meta-block">' +
        '<div class="bill-meta-row"><span class="bill-meta-lbl">Thanh toán</span><span class="bill-meta-val">' + payDisplay + '</span></div>' +
        (storeName ? '<div class="bill-meta-row"><span class="bill-meta-lbl">Cửa hàng</span><span class="bill-meta-val">' + storeName + '</span></div>' : '') +
        (storeAddr ? '<div class="bill-meta-row"><span class="bill-meta-lbl">Địa chỉ CH</span><span class="bill-meta-val">' + storeAddr + '</span></div>' : '') +
        (deliveryText ? '<div class="bill-meta-row"><span class="bill-meta-lbl">Giao đến</span><span class="bill-meta-val">' + deliveryText + '</span></div>' : '') +
        (tableID ? '<div class="bill-meta-row"><span class="bill-meta-lbl">Bàn số</span><span class="bill-meta-val">' + tableID + '</span></div>' : '') +
        (note ? '<div class="bill-meta-row"><span class="bill-meta-lbl">Ghi chú</span><span class="bill-meta-val">' + note + '</span></div>' : '') +
        '</div>' +

        (timelineHtml ? '<div class="bill-section-lbl" style="margin-top:20px">📋 Trạng thái đơn hàng</div><div class="bill-timeline">' + timelineHtml + '</div>' : '') +

        '</div></div></div>';

    var el = document.createElement('div');
    el.innerHTML = html;
    document.body.appendChild(el.firstChild);
    document.body.style.overflow = 'hidden';
}

function closeBillModal() {
    var overlay = document.querySelector('.bill-overlay');
    if (overlay) { overlay.remove(); document.body.style.overflow = ''; }
}

// 3. ĐỊA CHỈ GIAO HÀNG
function renderAddress(main) {
    apiGet('/address/my-addresses').then(function (r) { return r.json(); }).then(function (d) {
        var addrs = Array.isArray(d) ? d : (d.data || []);
        var canDelete = addrs.length > 1;
        var addrRows = addrs.map(function (a) {
            var id       = a.AddressID || a.addressID || a.ID || a.id;
            var isDef    = a.IsDefault || a.isDefault || false;
            var parts    = [
                a.StreetAddress || a.streetAddress,
                a.District      || a.district,
                a.Province      || a.province
            ].filter(Boolean);
            var fullAddr = parts.join(', ');
            var title    = a.Province || a.province || a.StreetAddress || a.streetAddress || 'Địa chỉ';
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
            '<div class="up-field">' +
            '<label>SỐ NHÀ / ĐƯỜNG <span style="color:#e74c3c">*</span></label>' +
            '<input type="text" id="addr-street-address" placeholder="VD: 42 Nguyễn Văn Linh"></div>' +
            '<div class="up-field-row">' +
            '<div class="up-field"><label>QUẬN/HUYỆN <span style="color:#e74c3c">*</span></label>' +
            '<input type="text" id="addr-district" placeholder="VD: Quận 7"></div>' +
            '<div class="up-field"><label>TỈNH/THÀNH PHỐ <span style="color:#e74c3c">*</span></label>' +
            '<input type="text" id="addr-province" placeholder="VD: TP. Hồ Chí Minh"></div>' +
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
    var streetAddress = document.getElementById('addr-street-address').value.trim();
    var district      = document.getElementById('addr-district').value.trim();
    var province      = document.getElementById('addr-province').value.trim();
    if (!streetAddress || !district || !province) {
        alert('Vui lòng điền đầy đủ: Số nhà/Đường, Quận/Huyện, Tỉnh/Thành phố.');
        return;
    }
    apiPost('/address/add', {
        StreetAddress: streetAddress,
        District: district,
        Province: province
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
    apiGet('/ticket/my-tickets').then(function (r) { return r.json(); }).then(function (d) {
        var tickets = Array.isArray(d) ? d : (d.data || []);
        if (!tickets.length) {
            main.innerHTML =
                '<div class="section-card">' +
                '<div class="section-card-header"><h2 class="section-card-title">🎟️ Mã giảm giá</h2></div>' +
                '<div class="section-card-body"><p style="color:var(--muted)">Chưa có mã giảm giá nào.</p></div></div>';
            return;
        }
        var today = new Date().toISOString().slice(0, 10);
        var cards = tickets.map(function (t) {
            var ticketId  = String(t.ticketID || t.TicketID || '');
            var code      = ticketId.replace(/-/g, '').slice(0, 8).toUpperCase();
            var discount  = Number(t.discount || t.Discount || 0);
            var discPct   = Math.round(discount * 100);
            var startDate = (t.startDate || t.StartDate || '').slice(0, 10);
            var endDate   = (t.endDate   || t.EndDate   || '').slice(0, 10);
            var usedAt    = t.usedAt || t.UsedAt || null;

            var isUsed    = !!usedAt;
            var isExpired = !isUsed && !!endDate && endDate < today;
            var isActive  = !isUsed && !isExpired;

            var badgeCls  = isUsed ? 'tk-badge-used' : isExpired ? 'tk-badge-expired' : 'tk-badge-active';
            var badgeTxt  = isUsed ? 'Đã dùng' : isExpired ? 'Hết hạn' : 'Hiệu lực';

            var usedLine  = usedAt
                ? '<div class="tk-used-time">Dùng lúc: ' + String(usedAt).replace('T', ' ').slice(0, 16) + '</div>'
                : '';
            var actionBtn = isActive
                ? '<button class="up-btn up-btn-sm" onclick="copyCode(\'' + ticketId + '\')">Sao chép mã</button>'
                : '';

            return '<div class="ticket-card' + (!isActive ? ' used' : '') + '">' +
                '<div class="tk-top-row">' +
                '<span class="ticket-code">' + code + '</span>' +
                '<span class="tk-badge ' + badgeCls + '">' + badgeTxt + '</span>' +
                '</div>' +
                '<div class="tk-discount">Giảm ' + discPct + '%</div>' +
                '<div class="tk-dates">' +
                '<span>Bắt đầu: <b>' + (startDate || '—') + '</b></span>' +
                '<span>HSD: <b>' + (endDate || '—') + '</b></span>' +
                '</div>' +
                usedLine +
                '<div class="ticket-footer">' + actionBtn + '</div>' +
                '</div>';
        }).join('');
        main.innerHTML =
            '<div class="section-card">' +
            '<div class="section-card-header"><h2 class="section-card-title">🎟️ Mã giảm giá</h2></div>' +
            '<div class="section-card-body"><div class="ticket-grid">' + cards + '</div></div></div>';
    }).catch(function () {
        main.innerHTML = '<p style="padding:20px;color:var(--muted)">Lỗi tải mã giảm giá.</p>';
    });
}

function copyCode(ticketId) {
    navigator.clipboard.writeText(ticketId).then(function () {
        alert('Đã sao chép mã: ' + ticketId);
    });
}

// 5. ĐỔI MẬT KHẨU
function renderPassword(main) {
    main.innerHTML =
        '<div class="section-card">' +
        '<div class="section-card-header"><h2 class="section-card-title">🔒 Đổi mật khẩu</h2></div>' +
        '<div class="section-card-body">' +
        '<div class="up-field"><label>Mật khẩu hiện tại</label>' +
        '<input type="password" id="pw-current" placeholder="Nhập mật khẩu hiện tại" autocomplete="current-password"></div>' +
        '<div class="up-field"><label>Mật khẩu mới</label>' +
        '<input type="password" id="pw-new" placeholder="Tối thiểu 6 ký tự" autocomplete="new-password"></div>' +
        '<div class="up-field"><label>Xác nhận mật khẩu mới</label>' +
        '<input type="password" id="pw-confirm" placeholder="Nhập lại mật khẩu mới" autocomplete="new-password"></div>' +
        '<p id="pw-error" class="pw-error-msg"></p>' +
        '<p id="pw-success" class="pw-success-msg"></p>' +
        '<button class="up-btn" id="pw-send-otp-btn" onclick="requestPasswordOtp()">Gửi mã xác nhận</button>' +
        '</div></div>' +

        // OTP popup overlay
        '<div id="pw-otp-overlay" class="pw-otp-overlay" style="display:none">' +
        '<div class="pw-otp-box">' +
        '<button class="pw-otp-close" onclick="closePwOtpPopup()">✕</button>' +
        '<div class="pw-otp-icon">📧</div>' +
        '<h3 class="pw-otp-title">Nhập mã xác nhận</h3>' +
        '<p class="pw-otp-desc">Mã OTP đã được gửi về email của bạn.<br>Mã có hiệu lực trong <span id="pw-otp-timer">1:00</span>.</p>' +
        '<div class="pw-otp-inputs" id="pw-otp-inputs">' +
        '<input class="pw-otp-digit" type="text" maxlength="1" inputmode="numeric" />' +
        '<input class="pw-otp-digit" type="text" maxlength="1" inputmode="numeric" />' +
        '<input class="pw-otp-digit" type="text" maxlength="1" inputmode="numeric" />' +
        '<input class="pw-otp-digit" type="text" maxlength="1" inputmode="numeric" />' +
        '<input class="pw-otp-digit" type="text" maxlength="1" inputmode="numeric" />' +
        '<input class="pw-otp-digit" type="text" maxlength="1" inputmode="numeric" />' +
        '</div>' +
        '<p id="pw-otp-error" class="pw-error-msg" style="text-align:center"></p>' +
        '<button class="up-btn" id="pw-otp-confirm-btn" onclick="confirmPasswordOtp()">Xác nhận đổi mật khẩu</button>' +
        '<p class="pw-otp-resend">Chưa nhận được? <a href="#" onclick="resendPasswordOtp(event)">Gửi lại mã</a></p>' +
        '</div></div>';

    initOtpInputs();
}

var _pwOtpTimerInterval = null;

function initOtpInputs() {
    var digits = document.querySelectorAll('.pw-otp-digit');
    digits.forEach(function (inp, i) {
        inp.addEventListener('input', function () {
            inp.value = inp.value.replace(/[^0-9]/g, '').slice(-1);
            if (inp.value && i < digits.length - 1) digits[i + 1].focus();
        });
        inp.addEventListener('keydown', function (e) {
            if (e.key === 'Backspace' && !inp.value && i > 0) digits[i - 1].focus();
        });
        inp.addEventListener('paste', function (e) {
            e.preventDefault();
            var text = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '');
            digits.forEach(function (d, j) { d.value = text[j] || ''; });
            var last = Math.min(text.length, digits.length) - 1;
            if (last >= 0) digits[last].focus();
        });
    });
}

function startOtpTimer() {
    clearInterval(_pwOtpTimerInterval);
    var seconds = 60;
    var timerEl = document.getElementById('pw-otp-timer');
    _pwOtpTimerInterval = setInterval(function () {
        seconds--;
        if (!timerEl) { clearInterval(_pwOtpTimerInterval); return; }
        var m = Math.floor(seconds / 60);
        var s = seconds % 60;
        timerEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
        if (seconds <= 0) {
            clearInterval(_pwOtpTimerInterval);
            timerEl.textContent = 'Hết hạn';
            timerEl.style.color = '#e74c3c';
        }
    }, 1000);
}

function openPwOtpPopup() {
    var overlay = document.getElementById('pw-otp-overlay');
    if (overlay) { overlay.style.display = 'flex'; }
    document.querySelectorAll('.pw-otp-digit').forEach(function (d) { d.value = ''; });
    var first = document.querySelector('.pw-otp-digit');
    if (first) setTimeout(function () { first.focus(); }, 100);
    var errEl = document.getElementById('pw-otp-error');
    if (errEl) errEl.textContent = '';
    startOtpTimer();
}

function closePwOtpPopup() {
    var overlay = document.getElementById('pw-otp-overlay');
    if (overlay) overlay.style.display = 'none';
    clearInterval(_pwOtpTimerInterval);
}

function requestPasswordOtp() {
    var current = document.getElementById('pw-current').value;
    var newPw   = document.getElementById('pw-new').value;
    var confirm = document.getElementById('pw-confirm').value;
    var errEl   = document.getElementById('pw-error');
    var okEl    = document.getElementById('pw-success');
    errEl.textContent = '';
    okEl.textContent  = '';

    if (!current || !newPw || !confirm) { errEl.textContent = 'Vui lòng điền đầy đủ các trường.'; return; }
    if (newPw.length < 6) { errEl.textContent = 'Mật khẩu mới phải có ít nhất 6 ký tự.'; return; }
    if (newPw !== confirm) { errEl.textContent = 'Mật khẩu xác nhận không khớp.'; return; }

    var btn = document.getElementById('pw-send-otp-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Đang gửi...'; }

    apiPost('/auth/change-password/request-otp', { currentPass: current, newPass: newPw })
        .then(function (r) {
            return r.json().then(function (d) { return { ok: r.ok, data: d }; });
        })
        .then(function (res) {
            if (res.ok) {
                openPwOtpPopup();
            } else {
                errEl.textContent = (res.data && res.data.message) || 'Không thể gửi mã OTP.';
            }
        })
        .catch(function () { errEl.textContent = 'Lỗi kết nối máy chủ.'; })
        .finally(function () {
            if (btn) { btn.disabled = false; btn.textContent = 'Gửi mã xác nhận'; }
        });
}

function resendPasswordOtp(e) {
    e.preventDefault();
    requestPasswordOtp();
}

function confirmPasswordOtp() {
    var digits = document.querySelectorAll('.pw-otp-digit');
    var otp = Array.from(digits).map(function (d) { return d.value; }).join('');
    var errEl = document.getElementById('pw-otp-error');
    errEl.textContent = '';

    if (otp.length < 6) { errEl.textContent = 'Vui lòng nhập đủ 6 chữ số.'; return; }

    var current = document.getElementById('pw-current').value;
    var newPw   = document.getElementById('pw-new').value;
    var btn = document.getElementById('pw-otp-confirm-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Đang xác nhận...'; }

    apiPut('/auth/change-password', { currentPass: current, newPass: newPw, otp: otp })
        .then(function (r) {
            return r.json().then(function (d) { return { ok: r.ok, data: d }; });
        })
        .then(function (res) {
            if (res.ok) {
                closePwOtpPopup();
                var okEl = document.getElementById('pw-success');
                if (okEl) okEl.textContent = 'Đổi mật khẩu thành công!';
                document.getElementById('pw-current').value = '';
                document.getElementById('pw-new').value = '';
                document.getElementById('pw-confirm').value = '';
            } else {
                errEl.textContent = (res.data && res.data.message) || 'Xác nhận thất bại.';
            }
        })
        .catch(function () { errEl.textContent = 'Lỗi kết nối máy chủ.'; })
        .finally(function () {
            if (btn) { btn.disabled = false; btn.textContent = 'Xác nhận đổi mật khẩu'; }
        });
}

// Header Nav Toggle (Home / User)
(function () {
    var homeBtn = document.getElementById('nav-toggle-home');
    var userBtn = document.getElementById('nav-toggle-user');
    var thumb   = document.getElementById('nav-toggle-thumb');
    if (!homeBtn || !userBtn) return;

    userBtn.classList.add('active');
    homeBtn.classList.remove('active');
    if (thumb) thumb.classList.add('on-user');

    homeBtn.addEventListener('click', function () {
        window.location.href = 'index.html';
    });
})();

// Helpers hiển thị giờ Việt Nam. BackEnd serialize DateTime kèm "+07:00"
// (xem Backend.Converters.DateTimeJsonConverter), nên `new Date(s)` parse ra
// đúng instant; ta luôn format với timeZone Asia/Ho_Chi_Minh để hiển thị giờ
// VN bất kể browser ở đâu. Dùng các helper này thay cho new Date(x).toLocaleString('vi-VN').

(function (global) {
    var VN_TZ = 'Asia/Ho_Chi_Minh';

    function _parse(s) {
        if (s == null || s === '') return null;
        if (s instanceof Date) return isNaN(s.getTime()) ? null : s;
        var d = new Date(s);
        return isNaN(d.getTime()) ? null : d;
    }

    // "05/06/2026"
    function fmtVnDate(s) {
        var d = _parse(s);
        if (!d) return '';
        return d.toLocaleDateString('vi-VN', {
            timeZone: VN_TZ,
            day: '2-digit', month: '2-digit', year: 'numeric'
        });
    }

    // "05/06/2026 15:30"
    function fmtVnDateTime(s) {
        var d = _parse(s);
        if (!d) return '';
        return d.toLocaleString('vi-VN', {
            timeZone: VN_TZ,
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: false
        });
    }

    // "15:30"
    function fmtVnTime(s) {
        var d = _parse(s);
        if (!d) return '';
        return d.toLocaleTimeString('vi-VN', {
            timeZone: VN_TZ,
            hour: '2-digit', minute: '2-digit', hour12: false
        });
    }

    // "05/06/2026 15:30:42" — bản đầy đủ có giây
    function fmtVnFull(s) {
        var d = _parse(s);
        if (!d) return '';
        return d.toLocaleString('vi-VN', {
            timeZone: VN_TZ,
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });
    }

    // "yyyy-MM-dd" theo giờ VN — dùng cho input type=date, query string,...
    function vnTodayISO() {
        return new Date().toLocaleDateString('sv-SE', { timeZone: VN_TZ });
    }

    global.fmtVnDate     = fmtVnDate;
    global.fmtVnDateTime = fmtVnDateTime;
    global.fmtVnTime     = fmtVnTime;
    global.fmtVnFull     = fmtVnFull;
    global.vnTodayISO    = vnTodayISO;
})(window);

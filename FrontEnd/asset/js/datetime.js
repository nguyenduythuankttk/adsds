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
        var pad = function(n) { return (n < 10 ? '0' : '') + n; };
        var options = {
            timeZone: VN_TZ,
            year: 'numeric', month: '2-digit', day: '2-digit'
        };
        try {
            var formatter = new Intl.DateTimeFormat('en-GB', options);
            var parts = formatter.formatToParts(d);
            var year, month, day;
            parts.forEach(function(p) {
                if (p.type === 'day') day = p.value;
                if (p.type === 'month') month = p.value;
                if (p.type === 'year') year = p.value;
            });
            return day + '/' + month + '/' + year;
        } catch(e) {
            var day = pad(d.getDate());
            var month = pad(d.getMonth() + 1);
            var year = d.getFullYear();
            return day + '/' + month + '/' + year;
        }
    }

    // "15:30 05/06/2026"
    function fmtVnDateTime(s) {
        var d = _parse(s);
        if (!d) return '';
        var pad = function(n) { return (n < 10 ? '0' : '') + n; };
        var options = {
            timeZone: VN_TZ,
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false
        };
        try {
            var formatter = new Intl.DateTimeFormat('en-GB', options);
            var parts = formatter.formatToParts(d);
            var year, month, day, hour, minute;
            parts.forEach(function(p) {
                if (p.type === 'day') day = p.value;
                if (p.type === 'month') month = p.value;
                if (p.type === 'year') year = p.value;
                if (p.type === 'hour') hour = p.value;
                if (p.type === 'minute') minute = p.value;
            });
            return hour + ':' + minute + ' ' + day + '/' + month + '/' + year;
        } catch(e) {
            var hour = pad(d.getHours());
            var minute = pad(d.getMinutes());
            var day = pad(d.getDate());
            var month = pad(d.getMonth() + 1);
            var year = d.getFullYear();
            return hour + ':' + minute + ' ' + day + '/' + month + '/' + year;
        }
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

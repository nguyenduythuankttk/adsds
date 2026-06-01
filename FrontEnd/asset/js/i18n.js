(function () {
    var LANGS = ['vi', 'en', 'ja'];
    var _cache = {};
    var _lang = localStorage.getItem('lang') || 'vi';

    function applyToDOM(data) {
        // Text content
        document.querySelectorAll('[data-i18n]').forEach(function (el) {
            var key = el.getAttribute('data-i18n');
            if (data[key] !== undefined) el.textContent = data[key];
        });
        // HTML content (for elements with icons/spans inside)
        document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-html');
            if (data[key] !== undefined) el.innerHTML = data[key];
        });
        // Placeholders
        document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
            var key = el.getAttribute('data-i18n-ph');
            if (data[key] !== undefined) el.placeholder = data[key];
        });
        // Highlight active lang button
        document.querySelectorAll('.lang-btn').forEach(function (btn) {
            btn.classList.toggle('active', btn.getAttribute('data-lang') === _lang);
        });
    }

    function load(lang) {
        if (LANGS.indexOf(lang) === -1) lang = 'vi';
        _lang = lang;
        localStorage.setItem('lang', lang);

        if (_cache[lang]) { applyToDOM(_cache[lang]); return; }

        fetch('/asset/js/i18n/' + lang + '.json')
            .then(function (r) { return r.json(); })
            .then(function (data) {
                _cache[lang] = data;
                applyToDOM(data);
            });
    }

    // Delegation: bắt click trên bất kỳ .lang-btn nào
    document.addEventListener('click', function (e) {
        var btn = e.target.closest && e.target.closest('.lang-btn');
        if (btn) load(btn.getAttribute('data-lang'));
    });

    // Public API — JS khác có thể gọi i18n.t('key') để lấy bản dịch
    window.i18n = {
        load: load,
        t: function (key) { return (_cache[_lang] || {})[key] || key; },
        lang: function () { return _lang; }
    };

    // Tự động chạy khi DOM sẵn sàng
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { load(_lang); });
    } else {
        load(_lang);
    }
}());

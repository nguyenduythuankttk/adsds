// Mobile hamburger navigation toggle
(function () {
    var hamburger = document.getElementById('hamburger-btn');
    var nav = document.getElementById('nav');
    var overlay = document.getElementById('mobile-nav-overlay');

    if (!hamburger || !nav) return;

    function openNav() {
        nav.classList.add('mobile-open');
        if (overlay) overlay.classList.add('open');
        hamburger.setAttribute('aria-expanded', 'true');
        hamburger.innerHTML = '✕';
    }

    function closeNav() {
        nav.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.innerHTML = '☰';
    }

    hamburger.addEventListener('click', function () {
        if (nav.classList.contains('mobile-open')) closeNav();
        else openNav();
    });

    if (overlay) {
        overlay.addEventListener('click', closeNav);
    }

    // Close nav when a top-level link (non-submenu-trigger) is clicked
    nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            if (window.innerWidth <= 768) closeNav();
        });
    });

    // Close nav on resize back to desktop
    window.addEventListener('resize', function () {
        if (window.innerWidth > 768) closeNav();
    });
})();

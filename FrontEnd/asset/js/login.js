
const tabs = document.querySelectorAll('.modal-tab');
const panels = document.querySelectorAll('.modal-panel');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));

        tab.classList.add('active');
        const target = tab.getAttribute('data-tab');
        document.getElementById('panel-' + target).classList.add('active');
    });
});

document.getElementById('btn-login').addEventListener('click', () => {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const error    = document.getElementById('login-error');

    if (!email || !password) {
        error.textContent = 'Vui lòng nhập đầy đủ email và mật khẩu.';
        return;
    }
    error.textContent = '';
    //api đăng nhập 
    alert('Đăng nhập thành công!');
});

document.getElementById('btn-register').addEventListener('click', () => {
    const fullname = document.getElementById('reg-fullname').value.trim();
    const phone    = document.getElementById('reg-phone').value.trim();
    const email    = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value.trim();
    const error    = document.getElementById('register-error');

    if (!fullname || !phone || !email || !password) {
        error.textContent = 'Vui lòng điền đầy đủ tất cả các trường.';
        return;
    }
    if (password.length < 6) {
        error.textContent = 'Mật khẩu phải có ít nhất 6 ký tự.';
        return;
    }
    error.textContent = '';
    // api đky
    alert('Tạo tài khoản thành công!');
});
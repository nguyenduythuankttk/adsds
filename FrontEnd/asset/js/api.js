// Khi chạy qua Live Server (port 5500) thì gọi thẳng backend; khi qua nginx thì dùng relative path
var API_BASE = (window.location.port === '5500' || window.location.port === '3001')
    ? 'http://127.0.0.1:3000/api/pbl3'
    : '/api/pbl3';

function getToken()  { return localStorage.getItem('token'); }
function setToken(t) { localStorage.setItem('token', t); }

function clearAuth() { localStorage.clear(); }

function apiFetch(method, path, body) {
    var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    var token = getToken();
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    if (body !== undefined) opts.body = JSON.stringify(body);
    return fetch(API_BASE + path, opts).then(function (res) {
        if (res.status === 401) {
            clearAuth();
            window.location.href = '/html/index.html';
        }
        return res;
    });
}

function apiGet(path)         { return apiFetch('GET',    path); }
function apiPost(path, body)  { return apiFetch('POST',   path, body); }
function apiPut(path, body)   { return apiFetch('PUT',    path, body); }
function apiDelete(path)      { return apiFetch('DELETE', path); }

function luuThongTinNhanVien(data) {
    setToken(data.acessToken || data.AcessToken);
    localStorage.setItem('fullName',   data.fullName   || data.FullName   || '');
    localStorage.setItem('employeeId', data.employeeID || data.EmployeeID || '');
    localStorage.setItem('storeId',    data.storeID    || data.StoreID    || '');
    var role = (data.role || data.Role || '');
    localStorage.setItem('role', role === 'Manager' ? 'admin' : 'employee');
}

function luuThongTinKhachHang(data) {
    setToken(data.acessToken || data.AcessToken);
    localStorage.setItem('fullName', data.fullName || data.FullName || '');
    localStorage.setItem('userId',   data.userID   || data.UserID   || '');
    localStorage.setItem('role',     'user');
}

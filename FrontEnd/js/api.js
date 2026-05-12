const BASE_URL = 'https://api.dhstore.it.com/api/pbl3';

/**
 * Wrapper fetch tự động gắn Authorization header.
 * - 401 → throw với err.status = 401 (token hết hạn hoặc bị blacklist)
 * - Lỗi mạng → throw với message rõ ràng
 */
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}/${path}`, { ...options, headers });
  } catch {
    throw new Error('Không thể kết nối server. Vui lòng kiểm tra backend đang chạy.');
  }

  if (res.status === 401) {
    let msg = 'Phiên đăng nhập hết hạn hoặc token đã bị thu hồi.';
    try {
      const data = await res.json();
      msg = data?.message || msg;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) msg = text;
    }
    const err = new Error(msg);
    err.status = 401;
    throw err;
  }

  if (res.status === 204 || res.headers.get('content-length') === '0') return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.message || data?.title || `Lỗi ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

const api = {
  get:    (path)       => apiFetch(path, { method: 'GET' }),
  post:   (path, body) => apiFetch(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (path, body) => apiFetch(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path)       => apiFetch(path, { method: 'DELETE' }),
};

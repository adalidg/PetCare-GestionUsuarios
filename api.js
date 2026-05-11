// ─── API MODULE ─────────────────────────────────────────────
const API_BASE = 'http://localhost:5000/api';

const api = {
  async _request(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_BASE}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error desconocido');
    return data;
  },

  // Auth
  login:  (email, password)  => api._request('POST', '/auth/login', { email, password }),

  // Usuarios CRUD
  getAll: ()                 => api._request('GET',  '/usuarios'),
  getOne: (id)               => api._request('GET',  `/usuarios/${id}`),
  create: (payload)          => api._request('POST', '/usuarios', payload),
  update: (id, payload)      => api._request('PUT',  `/usuarios/${id}`, payload),
  delete: (id)               => api._request('DELETE', `/usuarios/${id}`),
};

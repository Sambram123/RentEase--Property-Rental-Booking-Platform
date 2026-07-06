import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor — attach JWT from localStorage ────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rentease_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — normalize error messages ───────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';

    // Auto-clear stale token on 401 and notify app to redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('rentease_token');
      localStorage.removeItem('rentease_user');
      // Dispatch event so AuthContext can handle redirect without circular import
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    return Promise.reject(new Error(message));
  }
);

// ── Named helpers ─────────────────────────────────────────────────────────────
export const healthCheck = async () => {
  const { data } = await api.get('/health');
  return data;
};

export default api;

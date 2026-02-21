import axios from 'axios';
import { API_BASE_URL } from '@utils/constants';

/**
 * Singleton Axios instance.
 *
 * Authentication strategy:
 *   - Primary: httpOnly `civicpulse_token` cookie (sent automatically via `withCredentials`)
 *   - Fallback: Bearer token stored in memory via `api.setToken(token)` (e.g. after Google OAuth)
 *
 * Never store JWT in localStorage — vulnerable to XSS.
 */

let _inMemoryToken = null;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,            // sends httpOnly cookies cross-origin
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    if (_inMemoryToken) {
      config.headers.Authorization = `Bearer ${_inMemoryToken}`;
    }
    // When sending FormData, DELETE the Content-Type header entirely so the
    // browser sets it automatically as multipart/form-data with the correct
    // boundary. The axios instance default ('application/json') would otherwise
    // override it and break multer parsing on the server.
    // Delete both casings — axios v1's AxiosHeaders normalises to lowercase
    // internally, so deleting only 'Content-Type' may leave 'content-type'.
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  // Unwrap the `data` layer from our ApiResponse envelope: { success, data, message }
  (response) => response.data,

  (error) => {
    if (!error.response) {
      // Network error, timeout, CORS pre-flight failure, etc.
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }

    const { status, data } = error.response;

    // Session expired → clear in-memory token and redirect
    if (status === 401) {
      _inMemoryToken = null;
      // Auth endpoints (login, register, /auth/me) handle 401 themselves —
      // only force-redirect for mid-session expiry on non-auth routes.
      const url = error.config?.url ?? '';
      if (!url.startsWith('/auth/') && window.location.pathname !== '/login') {
        const isAdminPath = window.location.pathname.startsWith('/admin');
        window.location.href = isAdminPath ? '/admin/login' : '/login';
      }
    }

    // Build a normalised error so callers don't have to dig through axios structure
    const message =
      data?.message ||
      (Array.isArray(data?.errors) ? data.errors.map(e => e.msg || e).join('. ') : null) ||
      `Request failed with status ${status}`;

    const err = new Error(message);
    err.status = status;
    err.data   = data;
    return Promise.reject(err);
  }
);

// ─── Token helpers (in-memory; NOT localStorage) ─────────────────────────────
api.setToken  = (token) => { _inMemoryToken = token; };
api.clearToken = ()     => { _inMemoryToken = null;  };

export default api;

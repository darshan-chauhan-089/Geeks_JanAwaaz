import api from './api';

const ADMIN_TOKEN_KEY = 'civicpulse_admin_token';
const ADMIN_USER_KEY = 'civicpulse_admin_user';

const STATUS_MAP = {
  in_working_progress: 'In Progress',
  in_progress: 'In Progress',
  issue_resolved: 'Resolved',
  resolved: 'Resolved',
  issue_rejected: 'Rejected',
  issue_dismissed: 'Rejected',
  rejected: 'Rejected',
  verified: 'Verified',
  pending: 'Pending',
  critical: 'Critical',
};

function safeGetSessionItem(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetSessionItem(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // no-op
  }
}

function safeRemoveSessionItem(key) {
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // no-op
  }
}

function hydrateTokenFromSession() {
  const token = safeGetSessionItem(ADMIN_TOKEN_KEY);
  if (token) api.setToken(token);
  return token;
}

function normalizeIssue(issue) {
  return {
    ...issue,
    reportedByName: issue.reportedByName || issue.createdBy?.name || issue.reportedBy?.name,
  };
}

export const adminService = {
  isAdminAuthenticated() {
    return Boolean(hydrateTokenFromSession());
  },

  getAdminUser() {
    try {
      const raw = safeGetSessionItem(ADMIN_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  async loginAdmin(credentials) {
    // Admin login uses the same auth endpoint — role is checked after login
    const res = await api.post('/auth/login', credentials);

    const payload = res?.data ?? res ?? {};
    const token = payload?.token;
    const user = payload?.user;

    if (!token || !user) {
      throw new Error('Invalid admin login response.');
    }

    if (user.role !== 'admin') {
      throw new Error('Access denied. Admin credentials required.');
    }

    api.setToken(token);
    safeSetSessionItem(ADMIN_TOKEN_KEY, token);
    safeSetSessionItem(ADMIN_USER_KEY, JSON.stringify(user));

    return user;
  },

  logoutAdmin() {
    api.clearToken();
    safeRemoveSessionItem(ADMIN_TOKEN_KEY);
    safeRemoveSessionItem(ADMIN_USER_KEY);
  },

  async getDashboardStats() {
    hydrateTokenFromSession();
    const res = await api.get('/admin/stats');
    return res?.data ?? res;
  },

  async getIssues(params = {}) {
    hydrateTokenFromSession();
    const merged = { ...params };
    if (!merged.status) {
      delete merged.status;
    }
    const res = await api.get('/admin/issues', { params: merged });
    const payload = res?.data ?? res ?? {};
    const issues = Array.isArray(payload.issues) ? payload.issues.map(normalizeIssue) : [];
    return { ...payload, issues };
  },

  async updateIssueStatus(issueId, status) {
    hydrateTokenFromSession();
    const normalizedKey = String(status || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');
    const apiStatus = STATUS_MAP[normalizedKey] || status;

    const res = await api.patch(`/admin/issues/${issueId}/status`, { status: apiStatus });
    return res?.data ?? res;
  },
};

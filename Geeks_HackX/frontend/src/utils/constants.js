/** ─── API ────────────────────────────────────────────────────────────────── */

// Vite exposes VITE_* vars only — never use REACT_APP_*
const API_HOST = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export const API_BASE_URL  = `${API_HOST}/api/v1`;
export const GOOGLE_AUTH_URL = `${API_HOST}/api/v1/auth/google`;

/** Real-time Socket.io server URL (no path suffix) */
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ?? API_HOST;

/** ─── Issue categories (must match backend enum) ────────────────────────── */
export const ISSUE_CATEGORIES = [
  'road',
  'water',
  'electricity',
  'sanitation',
  'safety',
  'environment',
  'infrastructure',
  'other',
];

/** ─── Issue statuses ───────────────────────────────────────────────────────── */
export const ISSUE_STATUSES = {
  PENDING:  'Pending',
  VERIFIED: 'Verified',
  CRITICAL: 'Critical',
  RESOLVED: 'Resolved',
  REJECTED: 'Rejected',
};

export const STATUS_COLORS = {
  [ISSUE_STATUSES.PENDING]:  '#d97706',
  [ISSUE_STATUSES.VERIFIED]: '#2563eb',
  [ISSUE_STATUSES.CRITICAL]: '#dc2626',
  [ISSUE_STATUSES.RESOLVED]: '#16a34a',
  [ISSUE_STATUSES.REJECTED]: '#6b7280',
};

/** ─── Sort presets (must match backend SORT_MAP keys) ─────────────────────── */
export const SORT_PRESETS = [
  { label: 'Most Recent',  value: 'recent' },
  { label: 'Most Liked',   value: 'liked' },
  { label: 'Most Verified',value: 'verified' },
  { label: 'Highest Severity', value: 'severity' },
];

/** ─── User roles ────────────────────────────────────────────────────────────── */
export const USER_ROLES = {
  USER:     'user',
  CITIZEN:  'citizen',
  OFFICIAL: 'official',
  ADMIN:    'admin',
};

/** ─── Pagination defaults ─────────────────────────────────────────────────── */
export const DEFAULT_PAGE_SIZE = 20;

/** ─── File upload limits (mirror backend multer config) ─────────────────── */
export const MAX_FILES       = 5;
export const MAX_FILE_SIZE_MB = 5;

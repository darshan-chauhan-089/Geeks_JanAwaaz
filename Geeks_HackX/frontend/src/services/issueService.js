import api from './api';

/**
 * Issue service — wraps all /api/v1/issues endpoints.
 * All methods return the `data` field from the ApiResponse envelope.
 */

export const issueService = {
  /**
   * Fetch paginated list of issues.
   * @param {{ page?, limit?, sort?, category?, status?, lat?, lng?, radius? }} params
   * @returns {{ issues: Issue[], pagination: Pagination }}
   */
  getIssues: async (params = {}) => {
    const res = await api.get('/issues', { params });
    const payload = res.data; // { issues, pagination } (inner envelope)

    // Normalise pagination keys so all consumers use a consistent shape:
    //   backend: { page, pages, hasNext, hasPrev }
    //   frontend: { currentPage, totalPages, hasNextPage, hasPrevPage }
    if (payload?.pagination) {
      const p = payload.pagination;
      payload.pagination = {
        ...p,
        currentPage:  p.page,
        totalPages:   p.pages,
        hasNextPage:  p.hasNext,
        hasPrevPage:  p.hasPrev,
      };
    }
    return payload;
  },

  /**
   * Fetch a single issue (fully populated).
   * @param {string} id
   */
  getIssue: async (id) => {
    const res = await api.get(`/issues/${id}`);
    return res.data;
  },

  /**
   * Fetch issues near a coordinate.
   * @param {{ lat, lng, radius?, page?, limit?, status? }} params
   */
  getNearbyIssues: async (params) => {
    const res = await api.get('/issues/nearby', { params });
    return res.data;
  },

  /**
   * Fetch trending issues.
   * @param {{ status?, limit? }} params
   */
  getTrending: async (params = {}) => {
    const res = await api.get('/issues/trending', { params });
    return res.data;
  },

  /**
   * Create a new issue.
   * @param {FormData} formData — must include location as JSON string
   */
  createIssue: async (formData) => {
    const res = await api.post('/issues', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /**
   * Toggle like/unlike an issue.
   * @param {string} id
   * @returns {{ likeCount: number, liked: boolean }}
   */
  likeIssue: async (id) => {
    const res = await api.patch(`/issues/${id}/like`);
    return res.data;
  },

  /**
   * Verify an issue with a mandatory comment + seriousness rating.
   * @param {string} id
   * @param {FormData} formData — comment, seriousnessRating, optional image
   */
  verifyIssue: async (id, formData) => {
    const res = await api.patch(`/issues/${id}/verify`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /**
   * Add a comment (optionally with an image).
   * @param {string} id
   * @param {FormData} formData — text, optional image
   */
  addComment: async (id, formData) => {
    const res = await api.post(`/issues/${id}/comments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  /**
   * Update issue status (official / admin only).
   * @param {string} id
   * @param {{ status: string }} payload
   */
  updateStatus: async (id, payload) => {
    const res = await api.patch(`/issues/${id}/status`, payload);
    return res.data;
  },

  /**
   * Delete an issue.
   * @param {string} id
   */
  deleteIssue: async (id) => {
    await api.delete(`/issues/${id}`);
  },

  /**
   * Get stats for the currently authenticated user.
   * @returns {{ issueCount, verificationCount, resolvedCount }}
   */
  getUserStats: async () => {
    const res = await api.get('/users/me/stats');
    return res.data;
  },

  /**
   * Get recent activity for the currently authenticated user.
   * @returns {Array}
   */
  getUserActivity: async () => {
    const res = await api.get('/users/me/activity');
    return res.data;
  },

  /**
   * Get the current user's own issues (paginated).
   * @param {{ page?, limit?, sort?, status?, category? }} params
   * @returns {{ issues: Issue[], pagination: Pagination }}
   */
  getMyIssues: async (params = {}) => {
    const res = await api.get('/users/me/issues', { params });
    const payload = res.data;
    if (payload?.pagination) {
      const p = payload.pagination;
      payload.pagination = {
        ...p,
        currentPage: p.page,
        totalPages:  p.pages,
        hasNextPage: p.hasNext,
        hasPrevPage: p.hasPrev,
      };
    }
    return payload;
  },

  /**
   * Get issues available for verification (Pending/Verified, not by self).
   * @param {{ page?, limit?, sort?, category? }} params
   * @returns {{ issues: Issue[], pagination: Pagination }}
   */
  getVerificationRequests: async (params = {}) => {
    const res = await api.get('/users/me/verification-requests', { params });
    const payload = res.data;
    if (payload?.pagination) {
      const p = payload.pagination;
      payload.pagination = {
        ...p,
        currentPage: p.page,
        totalPages:  p.pages,
        hasNextPage: p.hasNext,
        hasPrevPage: p.hasPrev,
      };
    }
    return payload;
  },

  /**
   * Get admin-level stats (admin / official only).
   * @returns {{ totalPending, newToday, avgResolutionDays, categoryBreakdown }}
   */
  getAdminStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },
};

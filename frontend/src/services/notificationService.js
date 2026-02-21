import api from './api';

/**
 * Notification service — wraps all /api/v1/notifications endpoints.
 */
export const notificationService = {
  /**
   * Fetch paginated notifications for the current user.
   * @param {{ page?, limit?, unread? }} params
   */
  getNotifications: async (params = {}) => {
    const res = await api.get('/notifications', { params });
    return res.data;
  },

  /**
   * Mark a single notification as read.
   * @param {string} id
   */
  markAsRead: async (id) => {
    const res = await api.patch(`/notifications/${id}/read`);
    return res.data;
  },

  /**
   * Mark all notifications as read.
   */
  markAllAsRead: async () => {
    const res = await api.patch('/notifications/read-all');
    return res.data;
  },

  /**
   * Delete a single notification.
   * @param {string} id
   */
  deleteNotification: async (id) => {
    await api.delete(`/notifications/${id}`);
  },

  /**
   * Clear all notifications.
   */
  clearAll: async () => {
    await api.delete('/notifications');
  },
};

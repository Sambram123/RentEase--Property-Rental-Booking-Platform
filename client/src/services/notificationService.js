import api from './api';

// ─── Fetch notifications (paginated) ──────────────────────────────────────────
export const fetchNotifications = async ({ page = 1, limit = 20, isRead } = {}) => {
  const params = { page, limit };
  if (isRead !== undefined) params.isRead = isRead;
  const { data } = await api.get('/notifications', { params });
  return data.data; // { notifications, unreadCount, pagination }
};

// ─── Fetch unread count ───────────────────────────────────────────────────────
export const fetchUnreadCount = async () => {
  const { data } = await api.get('/notifications/unread-count');
  return data.data.count;
};

// ─── Mark single notification as read ─────────────────────────────────────────
export const markNotificationRead = async (id) => {
  const { data } = await api.put(`/notifications/${id}/read`);
  return data.data;
};

// ─── Mark all notifications as read ───────────────────────────────────────────
export const markAllNotificationsRead = async () => {
  const { data } = await api.put('/notifications/read-all');
  return data.data;
};

// ─── Delete a notification ────────────────────────────────────────────────────
export const deleteNotification = async (id) => {
  const { data } = await api.delete(`/notifications/${id}`);
  return data;
};

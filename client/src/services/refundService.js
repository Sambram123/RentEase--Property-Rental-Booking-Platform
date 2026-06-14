import api from './api';

// ─── Cancel booking with refund ────────────────────────────────────────────────
export const cancelBookingWithRefund = async (bookingId, cancellationReason) => {
  const { data } = await api.post(`/bookings/${bookingId}/cancel`, { cancellationReason });
  return data.data;
};

// ─── Get refund estimate before cancellation ───────────────────────────────────
export const fetchRefundEstimate = async (bookingId) => {
  const { data } = await api.get(`/bookings/${bookingId}/refund-estimate`);
  return data.data;
};

// ─── Get my refunds (tenant) ───────────────────────────────────────────────────
export const fetchMyRefunds = async () => {
  const { data } = await api.get('/refunds/my-refunds');
  return data.data;
};

// ─── Get single refund ─────────────────────────────────────────────────────────
export const fetchRefundById = async (id) => {
  const { data } = await api.get(`/refunds/${id}`);
  return data.data.refund;
};

// ─── Get owner's refunds ───────────────────────────────────────────────────────
export const fetchOwnerRefunds = async ({ status, page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (status) params.append('status', status);
  const { data } = await api.get(`/refunds/owner?${params}`);
  return data.data;
};

// ─── Update refund status (admin) ──────────────────────────────────────────────
export const updateRefundStatus = async (id, status, adminNote = '') => {
  const { data } = await api.put(`/refunds/${id}/status`, { status, adminNote });
  return data.data.refund;
};

// ─── Admin: all refunds ─────────────────────────────────────────────────────────
export const fetchAdminRefunds = async ({ status, page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (status) params.append('status', status);
  const { data } = await api.get(`/admin/refunds?${params}`);
  return data.data;
};

// ─── Refund analytics ─────────────────────────────────────────────────────────
export const fetchRefundAnalytics = async () => {
  const { data } = await api.get('/refunds/analytics');
  return data.data;
};

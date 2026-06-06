import api from './api';

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const fetchAdminDashboard = async () => {
  const { data } = await api.get('/admin/dashboard');
  return data.data;
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const fetchAdminUsers = async (params = {}) => {
  const { data } = await api.get('/admin/users', { params });
  return data.data;
};

export const fetchAdminUserById = async (id) => {
  const { data } = await api.get(`/admin/users/${id}`);
  return data.data;
};

export const updateAdminUser = async (id, body) => {
  const { data } = await api.put(`/admin/users/${id}`, body);
  return data.data;
};

export const deleteAdminUser = async (id) => {
  const { data } = await api.delete(`/admin/users/${id}`);
  return data;
};

// ── Properties ────────────────────────────────────────────────────────────────
export const fetchAdminProperties = async (params = {}) => {
  const { data } = await api.get('/admin/properties', { params });
  return data.data;
};

export const updatePropertyStatus = async (id, status) => {
  const { data } = await api.put(`/admin/properties/${id}/status`, { status });
  return data.data;
};

export const deleteAdminProperty = async (id) => {
  const { data } = await api.delete(`/admin/properties/${id}`);
  return data;
};

// ── Bookings ──────────────────────────────────────────────────────────────────
export const fetchAdminBookings = async (params = {}) => {
  const { data } = await api.get('/admin/bookings', { params });
  return data.data;
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const fetchAdminPayments = async (params = {}) => {
  const { data } = await api.get('/admin/payments', { params });
  return data.data;
};

// ── Reviews ───────────────────────────────────────────────────────────────────
export const fetchAdminReviews = async (params = {}) => {
  const { data } = await api.get('/admin/reviews', { params });
  return data.data;
};

export const deleteAdminReview = async (id) => {
  const { data } = await api.delete(`/admin/reviews/${id}`);
  return data;
};

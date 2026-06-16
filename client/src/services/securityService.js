import api from './api';

// GET /api/admin/security/dashboard
export const fetchSecurityDashboard = async () => {
  const { data } = await api.get('/admin/security/dashboard');
  return data.data;
};

// GET /api/admin/security/logs
export const fetchAuditLogs = async ({ action, success, page = 1, limit = 50, ipAddress } = {}) => {
  const params = { page, limit };
  if (action) params.action = action;
  if (success !== undefined) params.success = success;
  if (ipAddress) params.ipAddress = ipAddress;
  const { data } = await api.get('/admin/security/logs', { params });
  return data.data;
};

// GET /api/admin/security/failed-logins
export const fetchFailedLogins = async ({ hours = 24 } = {}) => {
  const { data } = await api.get('/admin/security/failed-logins', { params: { hours } });
  return data.data;
};

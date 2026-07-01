import api from './api';

// ── System Health ─────────────────────────────────────────────────────────────
export const fetchHealthCheck = async () => {
  const { data } = await api.get('/health');
  return data;
};

export const fetchStatus = async () => {
  const { data } = await api.get('/status');
  return data;
};

// ── Admin System Monitoring ───────────────────────────────────────────────────
export const fetchSystemMonitoring = async () => {
  const { data } = await api.get('/admin/system');
  return data.data;
};

export const triggerBackup = async (label = '') => {
  const { data } = await api.post('/admin/system/backup', { label });
  return data.data;
};

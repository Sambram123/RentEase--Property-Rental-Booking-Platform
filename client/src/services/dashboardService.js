import api from './api';

export const fetchTenantDashboard = async () => {
  const { data } = await api.get('/dashboard/tenant');
  return data.data;
};

export const fetchOwnerDashboard = async () => {
  const { data } = await api.get('/dashboard/owner');
  return data.data;
};

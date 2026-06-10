import api from './api';

export const getProfile = async () => {
  const { data } = await api.get('/users/profile');
  return data.data;
};

export const updateProfile = async (payload) => {
  const { data } = await api.put('/users/profile', payload);
  return data.data;
};

export const changePassword = async (payload) => {
  const { data } = await api.put('/users/change-password', payload);
  return data;
};

export const getPreferences = async () => {
  const { data } = await api.get('/users/preferences');
  return data.data.preferences;
};

export const updatePreferences = async (payload) => {
  const { data } = await api.put('/users/preferences', payload);
  return data.data.preferences;
};

export const updateAvatar = async (payload) => {
  const { data } = await api.put('/users/avatar', payload);
  return data.data;
};

export const resetAvatar = async () => {
  const { data } = await api.delete('/users/avatar');
  return data.data;
};

export const deleteAccount = async (payload) => {
  const { data } = await api.delete('/users/account', { data: payload });
  return data;
};

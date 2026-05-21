import api from './api';

// ─── Fetch properties with optional filters ───────────────────────────────────
export const fetchProperties = async (params = {}) => {
  const { data } = await api.get('/properties', { params });
  return data.data; // { count, total, page, totalPages, properties }
};

// ─── Fetch a single property by ID ───────────────────────────────────────────
export const fetchPropertyById = async (id) => {
  const { data } = await api.get(`/properties/${id}`);
  return data.data.property;
};

// ─── Fetch properties owned by the logged-in user ────────────────────────────
export const fetchMyProperties = async () => {
  const { data } = await api.get('/properties/owner/my-properties');
  return data.data; // { count, properties }
};

// ─── Create a new property listing ───────────────────────────────────────────
export const createProperty = async (payload) => {
  const { data } = await api.post('/properties', payload);
  return data.data.property;
};

// ─── Update a property ────────────────────────────────────────────────────────
export const updateProperty = async (id, payload) => {
  const { data } = await api.put(`/properties/${id}`, payload);
  return data.data.property;
};

// ─── Delete a property ────────────────────────────────────────────────────────
export const deleteProperty = async (id) => {
  const { data } = await api.delete(`/properties/${id}`);
  return data;
};

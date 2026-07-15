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

// ─── Create a new property listing (multipart/form-data) ─────────────────────
export const createProperty = async (formData) => {
  const { data } = await api.post('/properties', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.property;
};

// ─── Update a property (multipart/form-data) ─────────────────────────────────
export const updateProperty = async (id, formData) => {
  const { data } = await api.put(`/properties/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data.property;
};

// ─── Delete a property ────────────────────────────────────────────────────────
export const deleteProperty = async (id) => {
  const { data } = await api.delete(`/properties/${id}`);
  return data;
};

// ─── Delete a single image from a property (also removes from Cloudinary) ────
export const deletePropertyImage = async (propertyId, publicId) => {
  const encodedId = encodeURIComponent(publicId);
  const { data } = await api.delete(`/properties/${propertyId}/images/${encodedId}`);
  return data;
};

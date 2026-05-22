import api from './api';

// ─── Create a booking ─────────────────────────────────────────────────────────
export const createBooking = async ({ propertyId, checkInDate, checkOutDate }) => {
  const { data } = await api.post('/bookings', { propertyId, checkInDate, checkOutDate });
  return data.data.booking;
};

// ─── Get current user's bookings ──────────────────────────────────────────────
export const fetchMyBookings = async () => {
  const { data } = await api.get('/bookings/my-bookings');
  return data.data; // { count, bookings }
};

// ─── Get bookings for a specific property (owner view) ───────────────────────
export const fetchPropertyBookings = async (propertyId) => {
  const { data } = await api.get(`/bookings/property/${propertyId}`);
  return data.data; // { count, bookings }
};

// ─── Get all bookings across all owner properties ────────────────────────────
export const fetchOwnerBookings = async () => {
  const { data } = await api.get('/bookings/owner/all');
  return data.data; // { count, bookings }
};

// ─── Get single booking ───────────────────────────────────────────────────────
export const fetchBookingById = async (id) => {
  const { data } = await api.get(`/bookings/${id}`);
  return data.data.booking;
};

// ─── Update booking status ────────────────────────────────────────────────────
export const updateBookingStatus = async (id, status) => {
  const { data } = await api.put(`/bookings/${id}/status`, { status });
  return data.data.booking;
};

// ─── Delete booking ───────────────────────────────────────────────────────────
export const deleteBooking = async (id) => {
  const { data } = await api.delete(`/bookings/${id}`);
  return data;
};

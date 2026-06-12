import api from './api';

// ─── Get availability (blocked dates/ranges) for a property ──────────────────
export const fetchAvailability = async (propertyId) => {
  const { data } = await api.get(`/availability/${propertyId}`);
  return data.data.availability;
};

// ─── Get full calendar data (blocked + booked) ────────────────────────────────
export const fetchCalendar = async (propertyId) => {
  const { data } = await api.get(`/availability/calendar/${propertyId}`);
  return data.data;
};

// ─── Block specific dates (owner) ─────────────────────────────────────────────
export const blockDates = async (propertyId, dates) => {
  const { data } = await api.post('/availability/block', { propertyId, dates });
  return data.data.availability;
};

// ─── Unblock specific dates (owner) ──────────────────────────────────────────
export const unblockDates = async (propertyId, dates) => {
  const { data } = await api.post('/availability/unblock', { propertyId, dates });
  return data.data.availability;
};

// ─── Block a date range (owner) ───────────────────────────────────────────────
export const blockRange = async (propertyId, startDate, endDate, reason = '') => {
  const { data } = await api.put('/availability/range', {
    propertyId,
    startDate,
    endDate,
    reason,
  });
  return data.data.availability;
};

// ─── Remove a blocked range (owner) ──────────────────────────────────────────
export const unblockRange = async (propertyId, rangeId) => {
  const { data } = await api.delete(`/availability/range/${rangeId}`, {
    data: { propertyId },
  });
  return data.data.availability;
};

// ─── Get occupancy analytics (owner) ─────────────────────────────────────────
export const fetchOccupancyAnalytics = async () => {
  const { data } = await api.get('/availability/analytics/occupancy');
  return data.data.analytics;
};

import api from './api';

// ─── Recommendations ───────────────────────────────────────────────────────────
export const fetchRecommendations = async () => {
  const { data } = await api.get('/recommendations');
  return data.data;
};

// ─── Trending ──────────────────────────────────────────────────────────────────
export const fetchTrending = async (limit = 8) => {
  const { data } = await api.get(`/properties/trending?limit=${limit}`);
  return data.data;
};

// ─── Featured ─────────────────────────────────────────────────────────────────
export const fetchFeatured = async (limit = 8) => {
  const { data } = await api.get(`/properties/featured?limit=${limit}`);
  return data.data;
};

// ─── Similar properties ────────────────────────────────────────────────────────
export const fetchSimilarProperties = async (propertyId, limit = 6) => {
  const { data } = await api.get(`/properties/${propertyId}/similar?limit=${limit}`);
  return data.data;
};

// ─── Recently viewed ───────────────────────────────────────────────────────────
export const fetchRecentlyViewed = async (limit = 10) => {
  const { data } = await api.get(`/properties/recently-viewed?limit=${limit}`);
  return data.data;
};

// ─── Track property view ───────────────────────────────────────────────────────
export const trackPropertyView = async (propertyId) => {
  try {
    await api.post(`/properties/${propertyId}/view`);
  } catch {
    // best-effort
  }
};

// ─── Track search ──────────────────────────────────────────────────────────────
export const trackSearch = async (filters) => {
  try {
    await api.post('/properties/track-search', filters);
  } catch {
    // best-effort
  }
};

// ─── Popular cities ────────────────────────────────────────────────────────────
export const fetchPopularCities = async (limit = 8) => {
  const { data } = await api.get(`/properties/popular-cities?limit=${limit}`);
  return data.data;
};

// ─── Saved searches ────────────────────────────────────────────────────────────
export const fetchSavedSearches = async () => {
  const { data } = await api.get('/searches');
  return data.data;
};

export const saveSearch = async (name, filters) => {
  const { data } = await api.post('/searches', { name, filters });
  return data.data.savedSearch;
};

export const deleteSavedSearch = async (id) => {
  const { data } = await api.delete(`/searches/${id}`);
  return data;
};

export const fetchSearchHistory = async () => {
  const { data } = await api.get('/searches/history');
  return data.data.history;
};

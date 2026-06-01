import api from './api';

// ─── Create a review ─────────────────────────────────────────────────────────
export const createReview = async ({ propertyId, rating, comment }) => {
  const { data } = await api.post('/reviews', { propertyId, rating, comment });
  return data.data.review;
};

// ─── Get reviews for a property ──────────────────────────────────────────────
export const fetchPropertyReviews = async (propertyId) => {
  const { data } = await api.get(`/reviews/property/${propertyId}`);
  return data.data; // { reviews, count, averageRating }
};

// ─── Update a review ─────────────────────────────────────────────────────────
export const updateReview = async (reviewId, { rating, comment }) => {
  const { data } = await api.put(`/reviews/${reviewId}`, { rating, comment });
  return data.data.review;
};

// ─── Delete a review ─────────────────────────────────────────────────────────
export const deleteReview = async (reviewId) => {
  const { data } = await api.delete(`/reviews/${reviewId}`);
  return data;
};

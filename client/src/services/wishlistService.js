import api from './api';

// ─── Get wishlist (populated properties) ─────────────────────────────────────
export const fetchWishlist = async () => {
  const { data } = await api.get('/wishlist');
  return data.data; // { count, properties }
};

// ─── Add to wishlist ─────────────────────────────────────────────────────────
export const addToWishlist = async (propertyId) => {
  const { data } = await api.post(`/wishlist/${propertyId}`);
  return data.data; // { wishlist }
};

// ─── Remove from wishlist ────────────────────────────────────────────────────
export const removeFromWishlist = async (propertyId) => {
  const { data } = await api.delete(`/wishlist/${propertyId}`);
  return data.data; // { wishlist }
};

// ─── Image utility helpers ───────────────────────────────────────────────────
// Handles both:
//   new format: images = [{ url: string, public_id: string }]
//   legacy format: images = [string]

/**
 * Extract the URL from a single image entry.
 * @param {string|{url:string,public_id:string}} img
 * @returns {string|null}
 */
export const getImageUrl = (img) => {
  if (!img) return null;
  if (typeof img === 'string') return img;
  if (typeof img === 'object' && img.url) return img.url;
  return null;
};

/**
 * Get the first image URL from a property's images array.
 * Falls back to the provided fallback URL if no valid image found.
 * @param {Array} images
 * @param {string} [fallback]
 * @returns {string}
 */
const DEFAULT_PLACEHOLDER =
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80';

export const getFirstImageUrl = (images, fallback = DEFAULT_PLACEHOLDER) => {
  if (!Array.isArray(images) || images.length === 0) return fallback;
  const url = getImageUrl(images[0]);
  return url || fallback;
};

/**
 * Convert an images array to an array of URL strings.
 * @param {Array} images
 * @returns {string[]}
 */
export const getImageUrls = (images) => {
  if (!Array.isArray(images)) return [];
  return images.map(getImageUrl).filter(Boolean);
};

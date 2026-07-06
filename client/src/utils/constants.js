// ─── Shared placeholder image ─────────────────────────────────────────────────
export const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80';

// ─── Shared time formatter ────────────────────────────────────────────────────
/**
 * Returns a human-readable relative time string.
 * e.g. "Just now", "5m ago", "3h ago", "2d ago", "12 Jun"
 */
export const formatTimeAgo = (dateString) => {
  const now  = new Date();
  const date = new Date(dateString);
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

export const FEATURED_PROPERTIES = [
  {
    id: '1',
    title: 'Modern Studio Apartment',
    location: 'Bandra West, Mumbai',
    pricePerMonth: 35000,
    bedrooms: 1,
    bathrooms: 1,
    image:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
    rating: 4.9,
  },
  {
    id: '2',
    title: 'Luxury 2BHK with City View',
    location: 'Koramangala, Bangalore',
    pricePerMonth: 52000,
    bedrooms: 2,
    bathrooms: 2,
    image:
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80',
    rating: 4.8,
  },
  {
    id: '3',
    title: 'Cozy Garden Flat',
    location: 'Jubilee Hills, Hyderabad',
    pricePerMonth: 28000,
    bedrooms: 2,
    bathrooms: 1,
    image:
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    rating: 4.7,
  },
  {
    id: '4',
    title: 'Premium Penthouse Suite',
    location: 'Golf Course Road, Gurgaon',
    pricePerMonth: 95000,
    bedrooms: 3,
    bathrooms: 3,
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
    rating: 5.0,
  },
];

export const formatPrice = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

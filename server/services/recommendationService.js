/**
 * Recommendation Engine
 * Scores properties based on: user preferences, search history,
 * booking/wishlist history, viewCount, rating, and recency.
 *
 * Day 22: Added caching for trending/featured queries to reduce DB load.
 */

import Property from '../models/Property.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import cache, { TTL, getOrSet } from './cacheService.js';

const MAX_RESULTS = 12;
const RECENTLY_VIEWED_LIMIT = 20;
const SEARCH_HISTORY_LIMIT  = 20;

// ─── Trending score formula ────────────────────────────────────────────────────
const trendingScore = (p) => {
  const views    = p.viewCount    || 0;
  const rating   = p.rating       || 0;
  const reviews  = p.reviewsCount || 0;
  const wishlist = p.wishlistCount|| 0;
  return views * 1 + rating * 20 + reviews * 5 + wishlist * 10;
};

// ─── Get trending properties (cached) ────────────────────────────────────────
export const getTrendingProperties = async ({ limit = MAX_RESULTS, excludeIds = [] } = {}) => {
  // Skip cache when caller has specific excludeIds (personalised context)
  if (excludeIds.length > 0) {
    return _fetchTrending(limit, excludeIds);
  }
  return getOrSet(
    `recommendations:trending:${limit}`,
    () => _fetchTrending(limit, []),
    TTL.LONG
  );
};

const _fetchTrending = async (limit, excludeIds) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const props = await Property.find({
    availability: true,
    _id: { $nin: excludeIds },
    $or: [
      { viewCount: { $gt: 0 } },
      { rating: { $gt: 3 } },
      { reviewsCount: { $gt: 0 } },
      { wishlistCount: { $gt: 0 } },
      { createdAt: { $gte: sevenDaysAgo } },
    ],
  })
    .select('_id title city address type price images rating reviewsCount viewCount wishlistCount availability owner')
    .populate('owner', 'name avatar')
    .lean();

  return props
    .sort((a, b) => trendingScore(b) - trendingScore(a))
    .slice(0, limit);
};

// ─── Get featured properties (cached) ────────────────────────────────────────
export const getFeaturedProperties = async ({ limit = MAX_RESULTS, excludeIds = [] } = {}) => {
  if (excludeIds.length > 0) {
    return _fetchFeatured(limit, excludeIds);
  }
  return getOrSet(
    `recommendations:featured:${limit}`,
    () => _fetchFeatured(limit, []),
    TTL.LONG
  );
};

const _fetchFeatured = async (limit, excludeIds) => {
  return Property.find({
    availability: true,
    _id: { $nin: excludeIds },
    rating: { $gte: 3 },
  })
    .select('_id title city address type price images rating reviewsCount viewCount wishlistCount availability owner')
    .populate('owner', 'name avatar')
    .sort({ rating: -1, reviewsCount: -1, createdAt: -1 })
    .limit(limit)
    .lean();
};

// ─── Get similar properties ───────────────────────────────────────────────────
export const getSimilarProperties = async (property, { limit = 6, excludeId = null } = {}) => {
  const city      = property.city || property.address?.city;
  const type      = property.type;
  const price     = property.price || 0;
  const priceLow  = price * 0.6;
  const priceHigh = price * 1.4;

  const cacheKey = `recommendations:similar:${property._id}:${limit}`;
  return getOrSet(cacheKey, async () => {
    const filter = {
      availability: true,
      _id: { $ne: excludeId || property._id },
      $or: [
        { city },
        { type },
        { price: { $gte: priceLow, $lte: priceHigh } },
      ],
    };

    const props = await Property.find(filter)
      .select('_id title city address type price images rating reviewsCount viewCount wishlistCount availability owner')
      .populate('owner', 'name avatar')
      .lean();

    return props
      .map((p) => {
        let score = 0;
        if (p.city === city) score += 3;
        if (p.type === type) score += 2;
        if (p.price >= priceLow && p.price <= priceHigh) score += 1;
        score += (p.rating || 0) * 0.5;
        return { ...p, _score: score };
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, limit)
      .map(({ _score, ...p }) => p);
  }, TTL.MEDIUM);
};

// ─── Get personalized recommendations ─────────────────────────────────────────
export const getPersonalizedRecommendations = async (userId, { limit = MAX_RESULTS } = {}) => {
  const user = await User.findById(userId)
    .select('recentlyViewed preferredCities preferredPropertyTypes searchHistory wishlist')
    .populate('recentlyViewed.property', 'city type price')
    .lean();

  if (!user) return getFeaturedProperties({ limit });

  // Collect data from user profile
  const preferredCities = new Set(user.preferredCities || []);
  const preferredTypes  = new Set(user.preferredPropertyTypes || []);

  // Extract preferences from recently viewed
  (user.recentlyViewed || []).forEach(({ property }) => {
    if (property?.city) preferredCities.add(property.city);
    if (property?.type) preferredTypes.add(property.type);
  });

  // Extract preferences from search history
  (user.searchHistory || []).forEach(({ filters }) => {
    if (filters?.city) preferredCities.add(filters.city);
    if (filters?.type) preferredTypes.add(filters.type);
  });

  // Get booking history city preferences
  const bookings = await Booking.find({ user: userId })
    .select('property')
    .populate('property', 'city type')
    .lean();

  bookings.forEach(({ property }) => {
    if (property?.city) preferredCities.add(property.city);
    if (property?.type) preferredTypes.add(property.type);
  });

  const excludeIds = [
    ...(user.recentlyViewed || []).map((rv) => rv.property?._id || rv.property),
    ...(user.wishlist || []),
  ].filter(Boolean);

  const orConditions = [];
  if (preferredCities.size > 0) orConditions.push({ city: { $in: [...preferredCities] } });
  if (preferredTypes.size  > 0) orConditions.push({ type: { $in: [...preferredTypes]  } });
  orConditions.push({ rating: { $gte: 4 } });

  const filter = {
    availability: true,
    _id: { $nin: excludeIds },
    ...(orConditions.length > 0 && { $or: orConditions }),
  };

  const props = await Property.find(filter)
    .select('_id title city address type price images rating reviewsCount viewCount wishlistCount availability owner')
    .populate('owner', 'name avatar')
    .lean();

  return props
    .map((p) => {
      let score = 0;
      if (preferredCities.has(p.city)) score += 5;
      if (preferredTypes.has(p.type)) score += 3;
      score += (p.rating || 0) * 2;
      score += (p.viewCount || 0) * 0.1;
      score += (p.wishlistCount || 0) * 0.5;
      return { ...p, _score: score };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, limit)
    .map(({ _score, ...p }) => p);
};

// ─── Track recently viewed (deduped, capped at limit) ─────────────────────────
export const trackRecentlyViewed = async (userId, propertyId) => {
  try {
    const user = await User.findById(userId).select('recentlyViewed');
    if (!user) return;

    // Remove existing entry for this property
    user.recentlyViewed = user.recentlyViewed.filter(
      (rv) => rv.property?.toString() !== propertyId.toString()
    );

    // Prepend new entry
    user.recentlyViewed.unshift({ property: propertyId, viewedAt: new Date() });

    // Cap to limit
    if (user.recentlyViewed.length > RECENTLY_VIEWED_LIMIT) {
      user.recentlyViewed = user.recentlyViewed.slice(0, RECENTLY_VIEWED_LIMIT);
    }

    await user.save();

    // Invalidate personalised cache for user
    await cache.del(`recommendations:personalized:${userId}`);
  } catch {
    // best-effort — don't break the main flow
  }
};

// ─── Track search ──────────────────────────────────────────────────────────────
export const trackSearch = async (userId, { q, city, type, minPrice, maxPrice }) => {
  try {
    if (!q && !city && !type) return; // skip empty/unfiltered searches

    const user = await User.findById(userId)
      .select('searchHistory preferredCities preferredPropertyTypes');
    if (!user) return;

    // Add to search history
    user.searchHistory.unshift({
      query:      q || city || type || '',
      filters:    { q, city, type, minPrice, maxPrice },
      searchedAt: new Date(),
    });
    if (user.searchHistory.length > SEARCH_HISTORY_LIMIT) {
      user.searchHistory = user.searchHistory.slice(0, SEARCH_HISTORY_LIMIT);
    }

    if (city && !user.preferredCities.includes(city)) {
      user.preferredCities.unshift(city);
      if (user.preferredCities.length > 10) user.preferredCities = user.preferredCities.slice(0, 10);
    }
    if (type && !user.preferredPropertyTypes.includes(type)) {
      user.preferredPropertyTypes.unshift(type);
      if (user.preferredPropertyTypes.length > 6) user.preferredPropertyTypes = user.preferredPropertyTypes.slice(0, 6);
    }

    await user.save();
  } catch {
    // best-effort
  }
};

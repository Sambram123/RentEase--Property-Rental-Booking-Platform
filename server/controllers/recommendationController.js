import asyncHandler from '../utils/asyncHandler.js';
import Property from '../models/Property.js';
import User from '../models/User.js';
import SavedSearch from '../models/SavedSearch.js';
import {
  getTrendingProperties,
  getFeaturedProperties,
  getPersonalizedRecommendations,
  getSimilarProperties,
  trackRecentlyViewed,
  trackSearch,
} from '../services/recommendationService.js';

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get personalized recommendations
// @route   GET /api/recommendations
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const limit  = Math.min(Number(req.query.limit) || 12, 20);

  const [personalized, trending, featured] = await Promise.all([
    getPersonalizedRecommendations(userId, { limit }),
    getTrendingProperties({ limit: 8 }),
    getFeaturedProperties({ limit: 8 }),
  ]);

  res.status(200).json({
    success: true,
    data: { personalized, trending, featured },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get trending properties (public)
// @route   GET /api/properties/trending
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getTrending = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 20);
  const props = await getTrendingProperties({ limit });

  res.status(200).json({
    success: true,
    data: { count: props.length, properties: props },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get featured properties (public)
// @route   GET /api/properties/featured
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getFeatured = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 20);
  const props = await getFeaturedProperties({ limit });

  res.status(200).json({
    success: true,
    data: { count: props.length, properties: props },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get similar properties for a given property
// @route   GET /api/properties/:id/similar
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getSimilar = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id).lean();
  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  const limit = Math.min(Number(req.query.limit) || 6, 12);
  const props = await getSimilarProperties(property, { limit, excludeId: property._id });

  res.status(200).json({
    success: true,
    data: { count: props.length, properties: props },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get recently viewed properties for current user
// @route   GET /api/properties/recently-viewed
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getRecentlyViewed = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 10, 20);

  const user = await User.findById(req.user._id)
    .select('recentlyViewed')
    .populate({
      path: 'recentlyViewed.property',
      select: 'title city price rating images type availability owner reviewsCount viewCount',
      populate: { path: 'owner', select: 'name avatar' },
    });

  if (!user) {
    return res.status(200).json({ success: true, data: { properties: [] } });
  }

  const viewed = (user.recentlyViewed || [])
    .filter((rv) => rv.property && rv.property._id)
    .slice(0, limit)
    .map((rv) => ({ ...rv.property.toObject?.() || rv.property, viewedAt: rv.viewedAt }));

  res.status(200).json({
    success: true,
    data: { count: viewed.length, properties: viewed },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Track property view (auto-called on property detail page)
// @route   POST /api/properties/:id/view
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const trackView = asyncHandler(async (req, res) => {
  const propertyId = req.params.id;

  // Increment view count atomically
  await Property.findByIdAndUpdate(propertyId, { $inc: { viewCount: 1 } });

  // Track in user's recently viewed
  if (req.user) {
    await trackRecentlyViewed(req.user._id, propertyId);
  }

  res.status(200).json({ success: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get popular cities (aggregated from properties)
// @route   GET /api/properties/popular-cities
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getPopularCities = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 8, 20);

  const cities = await Property.aggregate([
    { $match: { availability: true, city: { $exists: true, $ne: '' } } },
    {
      $group: {
        _id:        '$city',
        count:      { $sum: 1 },
        avgRating:  { $avg: '$rating' },
        totalViews: { $sum: '$viewCount' },
      },
    },
    { $sort: { count: -1, totalViews: -1 } },
    { $limit: limit },
    { $project: { _id: 0, city: '$_id', count: 1, avgRating: { $round: ['$avgRating', 1] }, totalViews: 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: { cities },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Track a search (update user preferences)
// @route   POST /api/properties/track-search
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const trackSearchAction = asyncHandler(async (req, res) => {
  const { q, city, type, minPrice, maxPrice } = req.body;
  if (req.user) {
    await trackSearch(req.user._id, { q, city, type, minPrice, maxPrice });
  }
  res.status(200).json({ success: true });
});

// ─────────────────────────────────────────────────────────────────────────────
// Saved Searches
// ─────────────────────────────────────────────────────────────────────────────

// @desc    Save a search
// @route   POST /api/searches
// @access  Private
const saveSearch = asyncHandler(async (req, res) => {
  const { name, filters } = req.body;

  if (!filters) {
    res.status(400);
    throw new Error('filters is required');
  }

  // Cap per user
  const count = await SavedSearch.countDocuments({ user: req.user._id });
  if (count >= 20) {
    // Remove oldest
    const oldest = await SavedSearch.findOne({ user: req.user._id }).sort({ createdAt: 1 });
    if (oldest) await oldest.deleteOne();
  }

  const saved = await SavedSearch.create({
    user:    req.user._id,
    name:    name || 'Saved Search',
    filters: filters || {},
  });

  res.status(201).json({
    success: true,
    message: 'Search saved',
    data: { savedSearch: saved },
  });
});

// @desc    Get user's saved searches
// @route   GET /api/searches
// @access  Private
const getSavedSearches = asyncHandler(async (req, res) => {
  const searches = await SavedSearch.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    data: { count: searches.length, searches },
  });
});

// @desc    Delete a saved search
// @route   DELETE /api/searches/:id
// @access  Private
const deleteSavedSearch = asyncHandler(async (req, res) => {
  const search = await SavedSearch.findById(req.params.id);
  if (!search) {
    res.status(404);
    throw new Error('Saved search not found');
  }
  if (search.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }
  await search.deleteOne();
  res.status(200).json({ success: true, message: 'Saved search deleted' });
});

// @desc    Get user's search history
// @route   GET /api/searches/history
// @access  Private
const getSearchHistory = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('searchHistory').lean();
  const history = (user?.searchHistory || []).slice(0, 20);
  res.status(200).json({ success: true, data: { history } });
});

export {
  getRecommendations,
  getTrending,
  getFeatured,
  getSimilar,
  getRecentlyViewed,
  trackView,
  getPopularCities,
  trackSearchAction,
  saveSearch,
  getSavedSearches,
  deleteSavedSearch,
  getSearchHistory,
};

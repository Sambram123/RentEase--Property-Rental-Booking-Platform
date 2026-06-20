import asyncHandler from '../utils/asyncHandler.js';
import { getPerformanceReport } from '../middleware/performanceMiddleware.js';
import cache from '../services/cacheService.js';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get server performance metrics
// @route   GET /api/admin/performance
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const getPerformanceDashboard = asyncHandler(async (req, res) => {
  const report = getPerformanceReport();

  // Most viewed properties
  const topProperties = await Property.find({ availability: true })
    .sort({ viewCount: -1 })
    .limit(10)
    .select('title city viewCount rating reviewsCount wishlistCount')
    .lean();

  // Database-level metrics (lightweight aggregations)
  const [totalBookings, pendingBookings, activeProperties] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ bookingStatus: 'pending' }),
    Property.countDocuments({ availability: true }),
  ]);

  // Cache stats
  const cacheStats = cache.stats();

  res.json({
    success: true,
    data: {
      ...report,
      topViewedProperties: topProperties,
      database: {
        totalBookings,
        pendingBookings,
        activeProperties,
      },
      cache: cacheStats,
    },
  });
});

export { getPerformanceDashboard };

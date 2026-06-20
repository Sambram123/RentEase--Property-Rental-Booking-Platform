import asyncHandler from '../utils/asyncHandler.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Property from '../models/Property.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import cache, { TTL, getOrSet } from '../services/cacheService.js';

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get tenant dashboard analytics
// @route   GET /api/dashboard/tenant
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getTenantDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const cacheKey = `dashboard:tenant:${userId}`;

  const data = await getOrSet(cacheKey, async () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Run all queries in parallel with targeted projections
    const [bookingStats, recentBookings, payments, recentNotifications, totalSpentAgg, bookingTrend] = await Promise.all([
      // Aggregate booking counts by status in ONE query instead of filtering in JS
      Booking.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$bookingStatus', count: { $sum: 1 } } },
      ]),
      // Only fetch recent 5 for display — use compound index user+createdAt
      Booking.find({ user: userId })
        .select('property checkInDate checkOutDate bookingStatus totalAmount')
        .populate('property', 'title city images price')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      // Payments: limit 5 with projection
      Payment.find({ user: userId })
        .select('property booking amount paymentStatus transactionDate createdAt')
        .populate('property', 'title city')
        .populate('booking', 'checkInDate checkOutDate totalAmount')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      // Notifications: limit 5 projection
      Notification.find({ recipient: userId })
        .select('type title message isRead createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      // Total spent aggregation
      Payment.aggregate([
        { $match: { user: userId, paymentStatus: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Monthly booking trend
      Booking.aggregate([
        { $match: { user: userId, createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    // Build stats from aggregation result
    const statsMap = bookingStats.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});

    const totalBookings = bookingStats.reduce((sum, s) => sum + s.count, 0);

    return {
      stats: {
        totalBookings,
        activeBookings:    statsMap.confirmed  || 0,
        completedBookings: statsMap.completed  || 0,
        cancelledBookings: statsMap.cancelled  || 0,
        pendingBookings:   statsMap.pending    || 0,
        totalSpent:        totalSpentAgg[0]?.total || 0,
      },
      recentBookings,
      recentPayments: payments,
      recentNotifications,
      bookingTrend,
    };
  }, TTL.MEDIUM);

  res.status(200).json({ success: true, data });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get owner dashboard analytics
// @route   GET /api/dashboard/owner
// @access  Private (owner / admin)
// ─────────────────────────────────────────────────────────────────────────────
const getOwnerDashboard = asyncHandler(async (req, res) => {
  if (!['owner', 'admin'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Access denied — property owners only');
  }

  const userId = req.user._id;
  const cacheKey = `dashboard:owner:${userId}`;

  const data = await getOrSet(cacheKey, async () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Step 1: get owner's properties (lean + projection)
    const properties = await Property.find({ owner: userId })
      .select('_id title city address images price availability rating reviewsCount')
      .lean();
    const propertyIds = properties.map((p) => p._id);

    if (propertyIds.length === 0) {
      return {
        stats: { totalProperties: 0, activeBookings: 0, pendingBookings: 0,
          completedBookings: 0, totalBookings: 0, totalRevenue: 0,
          monthlyRevenue: 0, paidPayments: 0, pendingPayments: 0 },
        recentBookings: [], recentPayments: [], recentReviews: [],
        recentNotifications: [], propertyPerformance: [], revenueTrend: [], bookingTrend: [],
      };
    }

    // Step 2: parallel queries
    const [
      bookingStats,
      recentBookings,
      successPayments,
      recentNotifications,
      revenueTrend,
      bookingTrend,
      pendingPaymentsCount,
      recentReviews,
    ] = await Promise.all([
      // Aggregate booking counts
      Booking.aggregate([
        { $match: { property: { $in: propertyIds } } },
        { $group: { _id: '$bookingStatus', count: { $sum: 1 } } },
      ]),
      // Recent 5 bookings
      Booking.find({ property: { $in: propertyIds } })
        .select('user property checkInDate checkOutDate bookingStatus totalAmount createdAt')
        .populate('user', 'name email')
        .populate('property', 'title city images price')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      // Successful payments (for revenue calc)
      Payment.find({ property: { $in: propertyIds }, paymentStatus: 'success' })
        .select('user property booking amount transactionDate createdAt')
        .populate('user', 'name email')
        .populate('property', 'title city')
        .populate('booking', 'checkInDate checkOutDate totalAmount')
        .sort({ transactionDate: -1 })
        .lean(),
      // Recent notifications
      Notification.find({ recipient: userId })
        .select('type title message isRead createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      // Revenue trend
      Payment.aggregate([
        {
          $match: {
            property: { $in: propertyIds },
            paymentStatus: 'success',
            transactionDate: { $gte: sixMonthsAgo },
          },
        },
        {
          $group: {
            _id: { year: { $year: '$transactionDate' }, month: { $month: '$transactionDate' } },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      // Booking trend
      Booking.aggregate([
        { $match: { property: { $in: propertyIds }, createdAt: { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      // Pending payments count
      Payment.countDocuments({ property: { $in: propertyIds }, paymentStatus: 'pending' }),
      // Recent reviews
      Review.find({ property: { $in: propertyIds } })
        .select('user property rating comment createdAt')
        .populate('user', 'name')
        .populate('property', 'title')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const statsMap = bookingStats.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});
    const totalBookings = bookingStats.reduce((sum, s) => sum + s.count, 0);

    const totalRevenue = successPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyRevenue = successPayments
      .filter((p) => p.transactionDate && new Date(p.transactionDate) >= monthStart)
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // Property performance using in-memory join (avoids N queries)
    const bookingMap = {};
    const revenueMap = {};

    // Build per-property booking counts from aggregate
    const allBookingsForPerf = await Booking.aggregate([
      { $match: { property: { $in: propertyIds } } },
      { $group: { _id: '$property', count: { $sum: 1 } } },
    ]);
    allBookingsForPerf.forEach(({ _id, count }) => { bookingMap[_id.toString()] = count; });

    // Revenue per property from in-memory successPayments
    successPayments.forEach((p) => {
      const pid = p.property?._id?.toString() || p.property?.toString();
      if (pid) revenueMap[pid] = (revenueMap[pid] || 0) + (p.amount || 0);
    });

    const propertyPerformance = properties.map((prop) => ({
      _id:           prop._id,
      title:         prop.title,
      city:          prop.city || prop.address?.city,
      images:        prop.images,
      price:         prop.price,
      availability:  prop.availability,
      totalBookings: bookingMap[prop._id.toString()] || 0,
      averageRating: prop.rating || 0,
      reviewCount:   prop.reviewsCount || 0,
      revenue:       revenueMap[prop._id.toString()] || 0,
    }));

    return {
      stats: {
        totalProperties: properties.length,
        activeBookings:    statsMap.confirmed  || 0,
        pendingBookings:   statsMap.pending    || 0,
        completedBookings: statsMap.completed  || 0,
        totalBookings,
        totalRevenue,
        monthlyRevenue,
        paidPayments:    successPayments.length,
        pendingPayments: pendingPaymentsCount,
      },
      recentBookings,
      recentPayments: successPayments.slice(0, 5),
      recentReviews,
      recentNotifications,
      propertyPerformance,
      revenueTrend,
      bookingTrend,
    };
  }, TTL.MEDIUM);

  res.status(200).json({ success: true, data });
});

// Invalidate dashboard cache when data changes (exported for use in other controllers)
export const invalidateDashboardCache = async (userId) => {
  if (!userId) return;
  await cache.invalidatePattern(`dashboard:tenant:${userId}`);
  await cache.invalidatePattern(`dashboard:owner:${userId}`);
};

export { getTenantDashboard, getOwnerDashboard };

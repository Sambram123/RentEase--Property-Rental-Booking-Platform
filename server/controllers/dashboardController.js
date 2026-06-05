import asyncHandler from '../utils/asyncHandler.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Property from '../models/Property.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get tenant dashboard analytics
// @route   GET /api/dashboard/tenant
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getTenantDashboard = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Booking counts by status
  const [bookings, payments, recentNotifications] = await Promise.all([
    Booking.find({ user: userId })
      .populate('property', 'title city images price')
      .sort({ createdAt: -1 })
      .lean(),
    Payment.find({ user: userId })
      .populate('property', 'title city')
      .populate('booking', 'checkInDate checkOutDate totalAmount')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
  ]);

  const totalBookings = bookings.length;
  const activeBookings = bookings.filter(
    (b) => b.bookingStatus === 'confirmed'
  ).length;
  const completedBookings = bookings.filter(
    (b) => b.bookingStatus === 'completed'
  ).length;
  const cancelledBookings = bookings.filter(
    (b) => b.bookingStatus === 'cancelled'
  ).length;
  const pendingBookings = bookings.filter(
    (b) => b.bookingStatus === 'pending'
  ).length;

  // Total spent (successful payments)
  const totalSpent = await Payment.aggregate([
    { $match: { user: userId, paymentStatus: 'success' } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);

  // Monthly booking trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const bookingTrend = await Booking.aggregate([
    { $match: { user: userId, createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const recentBookings = bookings.slice(0, 5);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalBookings,
        activeBookings,
        completedBookings,
        cancelledBookings,
        pendingBookings,
        totalSpent: totalSpent[0]?.total || 0,
      },
      recentBookings,
      recentPayments: payments,
      recentNotifications,
      bookingTrend,
    },
  });
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

  // Get owner's properties
  const properties = await Property.find({ owner: userId }).lean();
  const propertyIds = properties.map((p) => p._id);

  // All bookings for owner properties
  const [allBookings, successPayments, recentNotifications] = await Promise.all(
    [
      Booking.find({ property: { $in: propertyIds } })
        .populate('user', 'name email')
        .populate('property', 'title city images price')
        .sort({ createdAt: -1 })
        .lean(),
      Payment.find({
        property: { $in: propertyIds },
        paymentStatus: 'success',
      })
        .populate('user', 'name email')
        .populate('property', 'title city')
        .populate('booking', 'checkInDate checkOutDate totalAmount')
        .sort({ transactionDate: -1 })
        .lean(),
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]
  );

  const totalProperties = properties.length;
  const activeBookings = allBookings.filter(
    (b) => b.bookingStatus === 'confirmed'
  ).length;
  const pendingBookings = allBookings.filter(
    (b) => b.bookingStatus === 'pending'
  ).length;
  const completedBookings = allBookings.filter(
    (b) => b.bookingStatus === 'completed'
  ).length;

  // Revenue calculations
  const totalRevenue = successPayments.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );

  // Monthly revenue (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const revenueTrend = await Payment.aggregate([
    {
      $match: {
        property: { $in: propertyIds },
        paymentStatus: 'success',
        transactionDate: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$transactionDate' },
          month: { $month: '$transactionDate' },
        },
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Booking trend (last 6 months)
  const bookingTrend = await Booking.aggregate([
    {
      $match: {
        property: { $in: propertyIds },
        createdAt: { $gte: sixMonthsAgo },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Current month revenue
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyRevenue = successPayments
    .filter((p) => p.transactionDate && new Date(p.transactionDate) >= monthStart)
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Paid vs pending payments
  const pendingPayments = await Payment.countDocuments({
    property: { $in: propertyIds },
    paymentStatus: 'pending',
  });
  const paidPayments = successPayments.length;

  // Property performance
  const propertyPerformance = await Promise.all(
    properties.map(async (prop) => {
      const propBookings = allBookings.filter(
        (b) => b.property?._id?.toString() === prop._id.toString()
      );
      const propRevenue = successPayments
        .filter((p) => p.property?._id?.toString() === prop._id.toString())
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const reviewCount = await Review.countDocuments({ property: prop._id });

      return {
        _id: prop._id,
        title: prop.title,
        city: prop.city || prop.address?.city,
        images: prop.images,
        price: prop.price,
        availability: prop.availability,
        totalBookings: propBookings.length,
        averageRating: prop.rating || 0,
        reviewCount,
        revenue: propRevenue,
      };
    })
  );

  // Recent reviews on owner's properties
  const recentReviews = await Review.find({ property: { $in: propertyIds } })
    .populate('user', 'name')
    .populate('property', 'title')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentBookings = allBookings.slice(0, 5);
  const recentPayments = successPayments.slice(0, 5);

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalProperties,
        activeBookings,
        pendingBookings,
        completedBookings,
        totalBookings: allBookings.length,
        totalRevenue,
        monthlyRevenue,
        paidPayments,
        pendingPayments,
      },
      recentBookings,
      recentPayments,
      recentReviews,
      recentNotifications,
      propertyPerformance,
      revenueTrend,
      bookingTrend,
    },
  });
});

export { getTenantDashboard, getOwnerDashboard };

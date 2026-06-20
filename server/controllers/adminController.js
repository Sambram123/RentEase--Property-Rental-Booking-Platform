import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import { getOrSet, TTL } from '../services/cacheService.js';


// ─────────────────────────────────────────────────────────────────────────────
// @desc    Admin dashboard overview
// @route   GET /api/admin/dashboard
// @access  Admin
// ─────────────────────────────────────────────────────────────────────────────
const getAdminDashboard = asyncHandler(async (req, res) => {
  const data = await getOrSet('admin:dashboard', async () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // All counts + recent items + analytics in ONE parallel batch
    const [
      totalUsers, totalOwners, totalTenants,
      totalProperties, totalBookings, totalPayments,
      activeBookings, activeProperties, failedPayments, successPayments,
      revenueAgg,
      recentUsers, recentBookings, recentPayments,
      userGrowth, revenueTrend, bookingTrend, propertyGrowth,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'owner' }),
      User.countDocuments({ role: 'tenant' }),
      Property.countDocuments(),
      Booking.countDocuments(),
      Payment.countDocuments(),
      Booking.countDocuments({ bookingStatus: 'confirmed' }),
      Property.countDocuments({ availability: true }),
      Payment.countDocuments({ paymentStatus: 'failed' }),
      Payment.countDocuments({ paymentStatus: 'success' }),
      Payment.aggregate([
        { $match: { paymentStatus: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt isVerified').lean(),
      Booking.find()
        .select('user property bookingStatus totalAmount createdAt')
        .populate('user', 'name email')
        .populate('property', 'title city')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Payment.find()
        .select('user property amount paymentStatus createdAt')
        .populate('user', 'name email')
        .populate('property', 'title')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      // Analytics
      User.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Payment.aggregate([
        { $match: { paymentStatus: 'success', createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Booking.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      Property.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    return {
      stats: {
        totalUsers, totalOwners, totalTenants, totalProperties,
        totalBookings, totalPayments, totalRevenue: revenueAgg[0]?.total || 0,
        activeBookings, activeProperties, failedPayments, successPayments,
      },
      recentUsers,
      recentBookings,
      recentPayments,
      analytics: { userGrowth, revenueTrend, bookingTrend, propertyGrowth },
    };
  }, TTL.MEDIUM);

  res.json({ success: true, data });
});


// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/users
const getUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, data: { users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

// GET /api/admin/users/:id
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password').lean();
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  // Extra stats
  const [bookingCount, propertyCount, reviewCount] = await Promise.all([
    Booking.countDocuments({ user: user._id }),
    Property.countDocuments({ owner: user._id }),
    Review.countDocuments({ user: user._id }),
  ]);

  res.json({ success: true, data: { ...user, bookingCount, propertyCount, reviewCount } });
});

// PUT /api/admin/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const { role, isVerified } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (role && ['tenant', 'owner', 'admin'].includes(role)) user.role = role;
  if (typeof isVerified === 'boolean') user.isVerified = isVerified;

  await user.save();
  res.json({ success: true, data: user });
});

// DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  // Prevent deleting yourself or other admins
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('Cannot delete your own account');
  }
  if (user.role === 'admin') {
    res.status(400);
    throw new Error('Cannot delete another admin account');
  }

  await User.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'User deleted' });
});

// ─────────────────────────────────────────────────────────────────────────────
// PROPERTIES
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/properties
const getProperties = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status === 'pending') filter.availability = false;
  else if (status === 'approved') filter.availability = true;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { city: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [properties, total] = await Promise.all([
    Property.find(filter)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Property.countDocuments(filter),
  ]);

  res.json({ success: true, data: { properties, total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

// PUT /api/admin/properties/:id/status
const updatePropertyStatus = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'approved' | 'rejected' | 'pending'
  const property = await Property.findById(req.params.id);
  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  if (status === 'approved') property.availability = true;
  else if (status === 'rejected' || status === 'pending') property.availability = false;

  await property.save();

  // Notify owner
  try {
    await Notification.create({
      recipient: property.owner,
      type: 'system',
      title: `Property ${status}`,
      message: `Your property "${property.title}" has been ${status} by admin.`,
    });
  } catch { /* notification is best-effort */ }

  res.json({ success: true, data: property });
});

// DELETE /api/admin/properties/:id
const deleteProperty = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }
  await Property.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Property deleted' });
});

// ─────────────────────────────────────────────────────────────────────────────
// BOOKINGS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/bookings
const getBookings = asyncHandler(async (req, res) => {
  const { status, property, user: userId, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.bookingStatus = status;
  if (property) filter.property = property;
  if (userId) filter.user = userId;

  const skip = (Number(page) - 1) * Number(limit);
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('user', 'name email')
      .populate('property', 'title city price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Booking.countDocuments(filter),
  ]);

  res.json({ success: true, data: { bookings, total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/payments
const getPayments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.paymentStatus = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [payments, total, revenueAgg, failedCount, successCount, pendingCount] =
    await Promise.all([
      Payment.find(filter)
        .populate('user', 'name email')
        .populate('property', 'title city')
        .populate('booking', 'checkInDate checkOutDate')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Payment.countDocuments(filter),
      Payment.aggregate([
        { $match: { paymentStatus: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      Payment.countDocuments({ paymentStatus: 'failed' }),
      Payment.countDocuments({ paymentStatus: 'success' }),
      Payment.countDocuments({ paymentStatus: 'pending' }),
    ]);

  res.json({
    success: true,
    data: {
      payments,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      summary: {
        totalRevenue: revenueAgg[0]?.total || 0,
        failedCount,
        successCount,
        pendingCount,
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/reviews
const getReviews = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [reviews, total] = await Promise.all([
    Review.find()
      .populate('user', 'name email avatar')
      .populate('property', 'title city')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Review.countDocuments(),
  ]);

  res.json({ success: true, data: { reviews, total, page: Number(page), pages: Math.ceil(total / Number(limit)) } });
});

// DELETE /api/admin/reviews/:id
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  const propertyId = review.property;
  await Review.findByIdAndDelete(req.params.id);

  // Recalculate property rating
  try {
    await Review.updatePropertyRating(propertyId);
  } catch { /* best-effort */ }

  res.json({ success: true, message: 'Review deleted' });
});

export {
  getAdminDashboard,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getProperties,
  updatePropertyStatus,
  deleteProperty,
  getBookings,
  getPayments,
  getReviews,
  deleteReview,
};

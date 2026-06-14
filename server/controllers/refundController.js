import asyncHandler from '../utils/asyncHandler.js';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';
import Refund from '../models/Refund.js';
import Notification from '../models/Notification.js';
import { calculateRefund } from '../utils/refundCalculator.js';

// ─── Helper: send in-app notification ─────────────────────────────────────────
const sendNotification = async ({ recipient, type, title, message, refundId }) => {
  try {
    await Notification.create({
      recipient,
      type,
      title,
      message,
      referenceId: refundId || null,
      referenceType: 'Refund',
    });
  } catch {
    /* best-effort */
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Cancel booking + auto-trigger refund calculation
// @route   POST /api/bookings/:id/cancel
// @access  Private (tenant who owns the booking)
// ─────────────────────────────────────────────────────────────────────────────
const cancelBooking = asyncHandler(async (req, res) => {
  const { cancellationReason } = req.body;

  const booking = await Booking.findById(req.params.id).populate('property');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Only the booking user, property owner, or admin can cancel
  const isTenant = booking.user.toString() === req.user._id.toString();
  const isOwner =
    booking.property?.owner?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isTenant && !isOwner && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to cancel this booking');
  }

  if (booking.bookingStatus === 'cancelled') {
    res.status(400);
    throw new Error('Booking is already cancelled');
  }
  if (booking.bookingStatus === 'completed') {
    res.status(400);
    throw new Error('Completed bookings cannot be cancelled');
  }

  const property = booking.property;
  const policy = property?.cancellationPolicy || 'moderate';
  const paidAmount = booking.advancePaid || 0;

  // Calculate refund
  const { refundPercentage, refundAmount, daysBeforeCheckIn, breakdown } =
    calculateRefund(policy, booking.checkInDate, paidAmount, booking.totalAmount);

  // Determine who cancelled
  let cancelledByRole = 'tenant';
  if (isAdmin && !isTenant) cancelledByRole = 'admin';
  else if (isOwner && !isTenant) cancelledByRole = 'owner';

  // Update booking
  booking.bookingStatus = 'cancelled';
  booking.cancellationStatus = 'requested';
  booking.cancelledAt = new Date();
  booking.cancellationReason = cancellationReason || 'Cancelled by user';
  booking.cancelledBy = cancelledByRole;
  await booking.save();

  // Create refund record only if payment was made
  let refund = null;
  if (paidAmount > 0) {
    refund = await Refund.create({
      booking: booking._id,
      property: property._id,
      tenant: booking.user,
      owner: property.owner,
      refundAmount,
      refundPercentage,
      originalAmount: paidAmount,
      refundReason: cancellationReason || 'Booking cancelled',
      cancellationPolicy: policy,
      daysBeforeCheckIn,
      refundStatus: 'requested',
      requestedAt: new Date(),
    });

    // Notify tenant
    await sendNotification({
      recipient: booking.user,
      type: 'refund_requested',
      title: 'Refund Requested',
      message: `Your refund of ₹${refundAmount.toLocaleString('en-IN')} (${refundPercentage}%) has been requested. ${breakdown}`,
      refundId: refund._id,
    });

    // Notify owner
    await sendNotification({
      recipient: property.owner,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `Booking for "${property.title}" was cancelled by ${cancelledByRole}. Refund of ₹${refundAmount.toLocaleString('en-IN')} requested.`,
      refundId: refund._id,
    });
  } else {
    // No payment, just notify cancellation
    await sendNotification({
      recipient: booking.user,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `Your booking for "${property.title}" has been cancelled.`,
    });
    await sendNotification({
      recipient: property.owner,
      type: 'booking_cancelled',
      title: 'Booking Cancelled',
      message: `A booking for "${property.title}" was cancelled by ${cancelledByRole}.`,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Booking cancelled successfully',
    data: {
      booking,
      refund,
      refundEstimate: {
        refundAmount,
        refundPercentage,
        daysBeforeCheckIn,
        breakdown,
        policy,
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get refund estimate before cancellation
// @route   GET /api/bookings/:id/refund-estimate
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getRefundEstimate = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(
    'property',
    'cancellationPolicy title price'
  );

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  const isTenant = booking.user.toString() === req.user._id.toString();
  const isOwner =
    booking.property?.owner?.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isTenant && !isOwner && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized');
  }

  const property = booking.property;
  const policy = property?.cancellationPolicy || 'moderate';
  const paidAmount = booking.advancePaid || 0;

  const { refundPercentage, refundAmount, daysBeforeCheckIn, breakdown } =
    calculateRefund(policy, booking.checkInDate, paidAmount, booking.totalAmount);

  res.status(200).json({
    success: true,
    data: {
      refundAmount,
      refundPercentage,
      daysBeforeCheckIn,
      breakdown,
      policy,
      paidAmount,
      totalAmount: booking.totalAmount,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all refunds for the logged-in tenant
// @route   GET /api/refunds/my-refunds
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getMyRefunds = asyncHandler(async (req, res) => {
  const refunds = await Refund.find({ tenant: req.user._id })
    .populate('booking', 'checkInDate checkOutDate totalAmount advancePaid bookingStatus')
    .populate('property', 'title city images cancellationPolicy')
    .sort({ requestedAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    message: 'Refunds fetched successfully',
    data: { count: refunds.length, refunds },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single refund by ID
// @route   GET /api/refunds/:id
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getRefundById = asyncHandler(async (req, res) => {
  const refund = await Refund.findById(req.params.id)
    .populate('booking', 'checkInDate checkOutDate totalAmount advancePaid bookingStatus cancellationReason cancelledAt')
    .populate('property', 'title city images cancellationPolicy')
    .populate('tenant', 'name email avatar')
    .populate('owner', 'name email');

  if (!refund) {
    res.status(404);
    throw new Error('Refund not found');
  }

  const isTenant = refund.tenant._id.toString() === req.user._id.toString();
  const isOwner = refund.owner._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isTenant && !isOwner && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view this refund');
  }

  res.status(200).json({
    success: true,
    data: { refund },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update refund status (admin only)
// @route   PUT /api/refunds/:id/status
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
const updateRefundStatus = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only admins can update refund status');
  }

  const { status, adminNote } = req.body;
  const VALID_STATUSES = ['approved', 'rejected', 'processed'];

  if (!VALID_STATUSES.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const refund = await Refund.findById(req.params.id)
    .populate('property', 'title')
    .populate('tenant', 'name email');

  if (!refund) {
    res.status(404);
    throw new Error('Refund not found');
  }

  if (refund.refundStatus === 'processed') {
    res.status(400);
    throw new Error('Processed refunds cannot be modified');
  }

  refund.refundStatus = status;
  if (adminNote) refund.adminNote = adminNote;
  if (status === 'processed' || status === 'approved') {
    refund.processedAt = new Date();
    // Update booking cancellation status
    await Booking.findByIdAndUpdate(refund.booking, {
      cancellationStatus: 'processed',
    });
  }
  await refund.save();

  // Notify tenant
  const notifType =
    status === 'approved' ? 'refund_approved' : status === 'rejected' ? 'refund_rejected' : 'refund_processed';
  const notifTitle =
    status === 'approved' ? 'Refund Approved' : status === 'rejected' ? 'Refund Rejected' : 'Refund Processed';
  const notifMsg =
    status === 'approved'
      ? `Your refund of ₹${refund.refundAmount.toLocaleString('en-IN')} has been approved.`
      : status === 'rejected'
      ? `Your refund request for "${refund.property?.title}" was rejected. ${adminNote || ''}`
      : `Your refund of ₹${refund.refundAmount.toLocaleString('en-IN')} has been processed.`;

  await sendNotification({
    recipient: refund.tenant._id,
    type: notifType,
    title: notifTitle,
    message: notifMsg,
    refundId: refund._id,
  });

  res.status(200).json({
    success: true,
    message: `Refund ${status} successfully`,
    data: { refund },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all refunds for owner's properties
// @route   GET /api/refunds/owner
// @access  Private (Owner/Admin)
// ─────────────────────────────────────────────────────────────────────────────
const getOwnerRefunds = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? {} : { owner: req.user._id };
  const { status, page = 1, limit = 20 } = req.query;
  if (status) filter.refundStatus = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [refunds, total] = await Promise.all([
    Refund.find(filter)
      .populate('booking', 'checkInDate checkOutDate totalAmount advancePaid bookingStatus')
      .populate('property', 'title city images')
      .populate('tenant', 'name email avatar')
      .sort({ requestedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Refund.countDocuments(filter),
  ]);

  // Analytics for owner
  const [totalRefundAgg, pendingCount, processedCount] = await Promise.all([
    Refund.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$refundAmount' } } },
    ]),
    Refund.countDocuments({ ...filter, refundStatus: 'requested' }),
    Refund.countDocuments({ ...filter, refundStatus: 'processed' }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      refunds,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      summary: {
        totalRefundAmount: totalRefundAgg[0]?.total || 0,
        pendingCount,
        processedCount,
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get refund analytics (admin)
// @route   GET /api/refunds/analytics
// @access  Private (Admin)
// ─────────────────────────────────────────────────────────────────────────────
const getRefundAnalytics = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [
    totalRefunds,
    statusBreakdown,
    policyBreakdown,
    refundTrend,
    totalRefundAmountAgg,
    avgRefundPercentage,
  ] = await Promise.all([
    Refund.countDocuments(),
    Refund.aggregate([
      { $group: { _id: '$refundStatus', count: { $sum: 1 }, totalAmount: { $sum: '$refundAmount' } } },
    ]),
    Refund.aggregate([
      { $group: { _id: '$cancellationPolicy', count: { $sum: 1 } } },
    ]),
    Refund.aggregate([
      { $match: { requestedAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$requestedAt' }, month: { $month: '$requestedAt' } },
          count: { $sum: 1 },
          totalAmount: { $sum: '$refundAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    Refund.aggregate([
      { $group: { _id: null, total: { $sum: '$refundAmount' } } },
    ]),
    Refund.aggregate([
      { $group: { _id: null, avg: { $avg: '$refundPercentage' } } },
    ]),
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalRefunds,
      totalRefundAmount: totalRefundAmountAgg[0]?.total || 0,
      avgRefundPercentage: Math.round(avgRefundPercentage[0]?.avg || 0),
      statusBreakdown,
      policyBreakdown,
      refundTrend,
    },
  });
});

export {
  cancelBooking,
  getRefundEstimate,
  getMyRefunds,
  getRefundById,
  updateRefundStatus,
  getOwnerRefunds,
  getRefundAnalytics,
};

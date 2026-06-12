import asyncHandler from '../utils/asyncHandler.js';
import Availability from '../models/Availability.js';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';

// ─── Helper: get or create availability doc for a property ────────────────────
const getOrCreateAvailability = async (propertyId, userId) => {
  let avail = await Availability.findOne({ property: propertyId });
  if (!avail) {
    avail = await Availability.create({
      property:  propertyId,
      createdBy: userId,
    });
  }
  return avail;
};

// ─── Helper: normalize date to midnight UTC ───────────────────────────────────
const normalizeDate = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get availability for a property
// @route   GET /api/availability/:propertyId
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getAvailability = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  const property = await Property.findById(propertyId);
  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  const avail = await Availability.findOne({ property: propertyId }).lean();

  res.status(200).json({
    success: true,
    data: {
      availability: avail || { blockedDates: [], unavailableRanges: [] },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get full calendar data (blocked + booked) for a property
// @route   GET /api/availability/calendar/:propertyId
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getCalendar = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  const property = await Property.findById(propertyId);
  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  // Get availability blocks
  const avail = await Availability.findOne({ property: propertyId }).lean();

  // Get confirmed/pending bookings
  const bookings = await Booking.find({
    property: propertyId,
    bookingStatus: { $in: ['pending', 'confirmed'] },
  })
    .populate('user', 'name')
    .select('checkInDate checkOutDate bookingStatus user totalAmount')
    .lean();

  // Build list of all booked date ranges
  const bookedRanges = bookings.map((b) => ({
    id:        b._id,
    startDate: b.checkInDate,
    endDate:   b.checkOutDate,
    status:    b.bookingStatus,
    guest:     b.user?.name || 'Guest',
    amount:    b.totalAmount,
    type:      'booking',
  }));

  // Expand individual blocked dates into events
  const blockedDateEvents = (avail?.blockedDates || []).map((d) => ({
    date:   d,
    type:   'blocked',
    reason: 'Blocked by owner',
  }));

  // Unavailable ranges
  const blockedRanges = (avail?.unavailableRanges || []).map((r) => ({
    id:        r._id,
    startDate: r.startDate,
    endDate:   r.endDate,
    reason:    r.reason,
    type:      'blocked_range',
  }));

  res.status(200).json({
    success: true,
    data: {
      property: {
        _id:          property._id,
        title:        property.title,
        availability: property.availability,
      },
      bookedRanges,
      blockedDates:  blockedDateEvents,
      blockedRanges,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Block specific dates
// @route   POST /api/availability/block
// @access  Private (owner / admin)
// ─────────────────────────────────────────────────────────────────────────────
const blockDates = asyncHandler(async (req, res) => {
  const { propertyId, dates } = req.body;

  if (!propertyId || !dates || !Array.isArray(dates) || dates.length === 0) {
    res.status(400);
    throw new Error('propertyId and dates array are required');
  }

  // Ownership check
  const property = await Property.findById(propertyId);
  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }
  if (
    req.user.role !== 'admin' &&
    property.owner.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to manage this property');
  }

  const avail = await getOrCreateAvailability(propertyId, req.user._id);

  // Normalize and deduplicate incoming dates
  const normalized = dates.map((d) => normalizeDate(d));

  // Add only dates not already blocked
  const existing = avail.blockedDates.map((d) => normalizeDate(d).getTime());
  const newDates = normalized.filter((d) => !existing.includes(d.getTime()));

  avail.blockedDates.push(...newDates);
  await avail.save();

  res.status(200).json({
    success: true,
    message: `${newDates.length} date(s) blocked successfully`,
    data: { availability: avail },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Unblock specific dates
// @route   POST /api/availability/unblock
// @access  Private (owner / admin)
// ─────────────────────────────────────────────────────────────────────────────
const unblockDates = asyncHandler(async (req, res) => {
  const { propertyId, dates } = req.body;

  if (!propertyId || !dates || !Array.isArray(dates) || dates.length === 0) {
    res.status(400);
    throw new Error('propertyId and dates array are required');
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }
  if (
    req.user.role !== 'admin' &&
    property.owner.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to manage this property');
  }

  const avail = await Availability.findOne({ property: propertyId });
  if (!avail) {
    res.status(200).json({ success: true, message: 'No blocked dates found' });
    return;
  }

  const toUnblock = dates.map((d) => normalizeDate(d).getTime());
  avail.blockedDates = avail.blockedDates.filter(
    (d) => !toUnblock.includes(normalizeDate(d).getTime())
  );
  await avail.save();

  res.status(200).json({
    success: true,
    message: `Date(s) unblocked successfully`,
    data: { availability: avail },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Block a date range
// @route   PUT /api/availability/range
// @access  Private (owner / admin)
// ─────────────────────────────────────────────────────────────────────────────
const blockRange = asyncHandler(async (req, res) => {
  const { propertyId, startDate, endDate, reason } = req.body;

  if (!propertyId || !startDate || !endDate) {
    res.status(400);
    throw new Error('propertyId, startDate, and endDate are required');
  }

  const start = new Date(startDate);
  const end   = new Date(endDate);
  if (end <= start) {
    res.status(400);
    throw new Error('endDate must be after startDate');
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }
  if (
    req.user.role !== 'admin' &&
    property.owner.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to manage this property');
  }

  const avail = await getOrCreateAvailability(propertyId, req.user._id);
  avail.unavailableRanges.push({
    startDate: start,
    endDate:   end,
    reason:    reason || 'Blocked by owner',
  });
  await avail.save();

  res.status(200).json({
    success: true,
    message: 'Date range blocked successfully',
    data: { availability: avail },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Remove a blocked date range
// @route   DELETE /api/availability/range/:rangeId
// @access  Private (owner / admin)
// ─────────────────────────────────────────────────────────────────────────────
const unblockRange = asyncHandler(async (req, res) => {
  const { propertyId } = req.body;
  const { rangeId } = req.params;

  if (!propertyId) {
    res.status(400);
    throw new Error('propertyId is required');
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }
  if (
    req.user.role !== 'admin' &&
    property.owner.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to manage this property');
  }

  const avail = await Availability.findOne({ property: propertyId });
  if (!avail) {
    res.status(404);
    throw new Error('Availability record not found');
  }

  avail.unavailableRanges = avail.unavailableRanges.filter(
    (r) => r._id.toString() !== rangeId
  );
  await avail.save();

  res.status(200).json({
    success: true,
    message: 'Date range removed successfully',
    data: { availability: avail },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get occupancy analytics for owner's properties
// @route   GET /api/availability/occupancy
// @access  Private (owner / admin)
// ─────────────────────────────────────────────────────────────────────────────
const getOccupancyAnalytics = asyncHandler(async (req, res) => {
  if (!['owner', 'admin'].includes(req.user.role)) {
    res.status(403);
    throw new Error('Access denied — property owners only');
  }

  const properties = await Property.find({ owner: req.user._id }).select('_id title city price images').lean();
  const propertyIds = properties.map((p) => p._id);

  const now      = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearEnd   = new Date(now.getFullYear(), 11, 31);
  const totalDaysInYear = 365;

  const analytics = await Promise.all(
    properties.map(async (prop) => {
      // Get all confirmed bookings for this property this year
      const bookings = await Booking.find({
        property: prop._id,
        bookingStatus: { $in: ['confirmed', 'completed'] },
        checkInDate: { $lte: yearEnd },
        checkOutDate: { $gte: yearStart },
      }).lean();

      // Calculate booked days (counting overlapping days within this year)
      let bookedDays = 0;
      const bookedDates = new Set();
      bookings.forEach((b) => {
        const start = new Date(Math.max(new Date(b.checkInDate), yearStart));
        const end   = new Date(Math.min(new Date(b.checkOutDate), yearEnd));
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          bookedDates.add(d.toDateString());
        }
      });
      bookedDays = bookedDates.size;

      // Get blocked days
      const avail = await Availability.findOne({ property: prop._id }).lean();
      let blockedDays = 0;
      if (avail) {
        const blockedSet = new Set();
        avail.blockedDates.forEach((d) => {
          const date = new Date(d);
          if (date >= yearStart && date <= yearEnd) {
            blockedSet.add(date.toDateString());
          }
        });
        avail.unavailableRanges.forEach((range) => {
          const start = new Date(Math.max(new Date(range.startDate), yearStart));
          const end   = new Date(Math.min(new Date(range.endDate), yearEnd));
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            blockedSet.add(d.toDateString());
          }
        });
        blockedDays = blockedSet.size;
      }

      const availableDays    = Math.max(0, totalDaysInYear - bookedDays - blockedDays);
      const occupancyPercent = Math.min(100, Math.round((bookedDays / totalDaysInYear) * 100));

      // Upcoming bookings
      const upcomingBookings = await Booking.find({
        property: prop._id,
        bookingStatus: { $in: ['pending', 'confirmed'] },
        checkInDate: { $gte: now },
      })
        .populate('user', 'name email')
        .sort({ checkInDate: 1 })
        .limit(3)
        .lean();

      return {
        property:          prop,
        bookedDays,
        blockedDays,
        availableDays,
        occupancyPercent,
        totalBookings:     bookings.length,
        upcomingBookings,
      };
    })
  );

  res.status(200).json({
    success: true,
    data: { analytics },
  });
});

export {
  getAvailability,
  getCalendar,
  blockDates,
  unblockDates,
  blockRange,
  unblockRange,
  getOccupancyAnalytics,
};

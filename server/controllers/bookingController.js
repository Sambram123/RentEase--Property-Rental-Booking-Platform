import asyncHandler from '../utils/asyncHandler.js';
import Booking from '../models/Booking.js';
import Property from '../models/Property.js';

// ─── Helper: calculate total rent in months ────────────────────────────────────
const calcTotalAmount = (pricePerMonth, checkIn, checkOut) => {
  const msPerDay  = 1000 * 60 * 60 * 24;
  const days      = Math.ceil((new Date(checkOut) - new Date(checkIn)) / msPerDay);
  const months    = days / 30;
  return Math.round(pricePerMonth * months);
};

// ─── Helper: check for date overlap with existing bookings ────────────────────
const hasDateConflict = async (propertyId, checkIn, checkOut, excludeId = null) => {
  const query = {
    property:      propertyId,
    bookingStatus: { $in: ['pending', 'confirmed'] },
    // Overlap condition: existing.checkIn < requested.checkOut
    //                AND existing.checkOut > requested.checkIn
    checkInDate:  { $lt: new Date(checkOut) },
    checkOutDate: { $gt: new Date(checkIn) },
  };
  if (excludeId) query._id = { $ne: excludeId };
  return Booking.exists(query);
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a booking
// @route   POST /api/bookings
// @access  Private (any authenticated user)
// ─────────────────────────────────────────────────────────────────────────────
const createBooking = asyncHandler(async (req, res) => {
  const { propertyId, checkInDate, checkOutDate } = req.body;

  // ── Required fields ────────────────────────────────────────────────────────
  if (!propertyId || !checkInDate || !checkOutDate) {
    res.status(400);
    throw new Error('propertyId, checkInDate, and checkOutDate are required');
  }

  const checkIn  = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);
  const today    = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Date validations ───────────────────────────────────────────────────────
  if (isNaN(checkIn) || isNaN(checkOut)) {
    res.status(400);
    throw new Error('Invalid date format');
  }
  if (checkIn < today) {
    res.status(400);
    throw new Error('Check-in date cannot be in the past');
  }
  if (checkOut <= checkIn) {
    res.status(400);
    throw new Error('Check-out date must be after check-in date');
  }

  // ── Fetch property ─────────────────────────────────────────────────────────
  const property = await Property.findById(propertyId);
  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }
  if (!property.availability) {
    res.status(400);
    throw new Error('This property is not available for booking');
  }

  // ── Prevent self-booking (owner booking their own property) ───────────────
  if (property.owner.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot book your own property');
  }

  // ── Check date conflicts ───────────────────────────────────────────────────
  const conflict = await hasDateConflict(propertyId, checkIn, checkOut);
  if (conflict) {
    res.status(409);
    throw new Error('These dates are already booked. Please choose different dates.');
  }

  // ── Calculate amount ───────────────────────────────────────────────────────
  const totalAmount = calcTotalAmount(property.price, checkIn, checkOut);

  const booking = await Booking.create({
    user:          req.user._id,
    property:      propertyId,
    checkInDate:   checkIn,
    checkOutDate:  checkOut,
    totalAmount,
    bookingStatus: 'pending',
    paymentStatus: 'pending',
  });

  const populated = await booking.populate([
    { path: 'property', select: 'title city price images' },
    { path: 'user',     select: 'name email' },
  ]);

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: { booking: populated },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all bookings for the logged-in user
// @route   GET /api/bookings/my-bookings
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('property', 'title city price images address type')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    message: 'Your bookings fetched successfully',
    data: { count: bookings.length, bookings },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all bookings for a specific property (for the owner)
// @route   GET /api/bookings/property/:propertyId
// @access  Private (owner of that property / admin)
// ─────────────────────────────────────────────────────────────────────────────
const getPropertyBookings = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.propertyId);
  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  // Ownership check
  if (
    req.user.role !== 'admin' &&
    property.owner.toString() !== req.user._id.toString()
  ) {
    res.status(403);
    throw new Error('Not authorized to view bookings for this property');
  }

  const bookings = await Booking.find({ property: req.params.propertyId })
    .populate('user', 'name email avatar')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    message: 'Property bookings fetched successfully',
    data: { count: bookings.length, bookings },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private (booking owner or property owner or admin)
// ─────────────────────────────────────────────────────────────────────────────
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('user',     'name email avatar')
    .populate('property', 'title city price images owner type');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  const isBookingUser    = booking.user._id.toString() === req.user._id.toString();
  const isPropertyOwner  = booking.property.owner?.toString() === req.user._id.toString();
  const isAdmin          = req.user.role === 'admin';

  if (!isBookingUser && !isPropertyOwner && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to view this booking');
  }

  res.status(200).json({
    success: true,
    message: 'Booking fetched successfully',
    data: { booking },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const VALID_STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];
  if (!VALID_STATUSES.includes(status)) {
    res.status(400);
    throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const booking = await Booking.findById(req.params.id).populate('property', 'owner');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  const isBookingUser   = booking.user.toString() === req.user._id.toString();
  const isPropertyOwner = booking.property.owner?.toString() === req.user._id.toString();
  const isAdmin         = req.user.role === 'admin';

  // ── Permission rules ───────────────────────────────────────────────────────
  // - Property owner / admin: can confirm, complete, or cancel any booking
  // - Booking user: can only cancel their own pending booking
  if (!isPropertyOwner && !isAdmin) {
    if (!isBookingUser) {
      res.status(403);
      throw new Error('Not authorized to update this booking');
    }
    // Tenant can only cancel
    if (status !== 'cancelled') {
      res.status(403);
      throw new Error('Tenants can only cancel their own bookings');
    }
    if (booking.bookingStatus !== 'pending') {
      res.status(400);
      throw new Error('Only pending bookings can be cancelled');
    }
  }

  booking.bookingStatus = status;
  await booking.save();

  res.status(200).json({
    success: true,
    message: `Booking ${status} successfully`,
    data: { booking },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete / cancel booking
// @route   DELETE /api/bookings/:id
// @access  Private (booking owner or admin)
// ─────────────────────────────────────────────────────────────────────────────
const deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  const isBookingUser = booking.user.toString() === req.user._id.toString();
  const isAdmin       = req.user.role === 'admin';

  if (!isBookingUser && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to delete this booking');
  }

  await booking.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Booking deleted successfully',
    data: {},
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all bookings across all owner properties (owner dashboard)
// @route   GET /api/bookings/owner/all
// @access  Private (owner / admin)
// ─────────────────────────────────────────────────────────────────────────────
const getOwnerAllBookings = asyncHandler(async (req, res) => {
  // Find all properties owned by this user
  const myProperties = await Property.find({ owner: req.user._id }).select('_id');
  const propertyIds  = myProperties.map((p) => p._id);

  const bookings = await Booking.find({ property: { $in: propertyIds } })
    .populate('user',     'name email avatar')
    .populate('property', 'title city price images')
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    message: 'All property bookings fetched',
    data: { count: bookings.length, bookings },
  });
});

export {
  createBooking,
  getMyBookings,
  getPropertyBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  getOwnerAllBookings,
};

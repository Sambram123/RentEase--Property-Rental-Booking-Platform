import asyncHandler from '../utils/asyncHandler.js';
import Booking from '../models/Booking.js';

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (tenant)
// ─────────────────────────────────────────────────────────────────────────────
const createBooking = asyncHandler(async (req, res) => {
  // TODO (Day 5): validate dates, check availability, calculate totalAmount
  res.status(201).json({
    success: true,
    message: 'createBooking — coming soon',
    data: {},
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all bookings for the logged-in user
// @route   GET /api/bookings
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getUserBookings = asyncHandler(async (req, res) => {
  // TODO (Day 5): filter by req.user._id, populate property details
  res.status(200).json({
    success: true,
    message: 'getUserBookings — coming soon',
    data: {},
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single booking by ID
// @route   GET /api/bookings/:id
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getBookingById = asyncHandler(async (req, res) => {
  // TODO (Day 5): verify user owns the booking or is admin
  const booking = await Booking.findById(req.params.id)
    .populate('user', 'name email')
    .populate('property', 'title city price')
    .lean();

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  res.status(200).json({
    success: true,
    message: 'Booking fetched successfully',
    data: { booking },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update booking status (confirm / cancel / complete)
// @route   PUT /api/bookings/:id
// @access  Private (owner / admin)
// ─────────────────────────────────────────────────────────────────────────────
const updateBookingStatus = asyncHandler(async (req, res) => {
  // TODO (Day 5): validate new status, check permissions
  res.status(200).json({
    success: true,
    message: 'updateBookingStatus — coming soon',
    data: {},
  });
});

export { createBooking, getUserBookings, getBookingById, updateBookingStatus };

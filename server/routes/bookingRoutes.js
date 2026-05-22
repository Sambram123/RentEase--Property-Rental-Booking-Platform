import express from 'express';
import {
  createBooking,
  getMyBookings,
  getPropertyBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  getOwnerAllBookings,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All booking routes require authentication
// ── Static routes first (before /:id to avoid conflicts) ─────────────────────

// GET  /api/bookings/my-bookings   — current user's bookings
router.get('/my-bookings', protect, getMyBookings);

// GET  /api/bookings/owner/all     — all bookings across owner's properties
router.get('/owner/all', protect, getOwnerAllBookings);

// GET  /api/bookings/property/:propertyId — bookings for a specific property
router.get('/property/:propertyId', protect, getPropertyBookings);

// ── CRUD ──────────────────────────────────────────────────────────────────────
// POST /api/bookings   — create booking
router.post('/', protect, createBooking);

// GET /api/bookings/:id — single booking detail
router.get('/:id', protect, getBookingById);

// PUT /api/bookings/:id/status — update booking status
router.put('/:id/status', protect, updateBookingStatus);

// DELETE /api/bookings/:id — delete booking
router.delete('/:id', protect, deleteBooking);

export default router;

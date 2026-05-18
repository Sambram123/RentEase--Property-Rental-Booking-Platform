import express from 'express';
import {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All booking routes are protected — user must be authenticated
// GET    /api/bookings       — get current user's bookings
// POST   /api/bookings       — create a new booking
router
  .route('/')
  .get(protect, getUserBookings)
  .post(protect, createBooking);

// GET    /api/bookings/:id   — get booking details
// PUT    /api/bookings/:id   — update booking status
router
  .route('/:id')
  .get(protect, getBookingById)
  .put(protect, updateBookingStatus);

export default router;

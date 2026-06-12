import express from 'express';
import {
  getAvailability,
  getCalendar,
  blockDates,
  unblockDates,
  blockRange,
  unblockRange,
  getOccupancyAnalytics,
} from '../controllers/availabilityController.js';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── Public routes ──────────────────────────────────────────────────────────
router.get('/:propertyId',          getAvailability);
router.get('/calendar/:propertyId', getCalendar);

// ── Owner / Admin routes ───────────────────────────────────────────────────
router.post('/block',                  protect, ownerOnly, blockDates);
router.post('/unblock',                protect, ownerOnly, unblockDates);
router.put('/range',                   protect, ownerOnly, blockRange);
router.delete('/range/:rangeId',       protect, ownerOnly, unblockRange);
router.get('/analytics/occupancy',     protect, ownerOnly, getOccupancyAnalytics);

export default router;

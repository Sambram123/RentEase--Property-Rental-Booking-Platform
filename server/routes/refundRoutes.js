import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getMyRefunds,
  getRefundById,
  updateRefundStatus,
  getOwnerRefunds,
  getRefundAnalytics,
} from '../controllers/refundController.js';

const router = express.Router();

// All routes require auth
router.use(protect);

// Static routes first (must be before /:id)
router.get('/my-refunds', getMyRefunds);
router.get('/owner', getOwnerRefunds);
router.get('/analytics', getRefundAnalytics);

// Dynamic routes
router.get('/:id', getRefundById);
router.put('/:id/status', updateRefundStatus);

export default router;

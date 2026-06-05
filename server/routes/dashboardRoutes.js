import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getTenantDashboard,
  getOwnerDashboard,
} from '../controllers/dashboardController.js';

const router = express.Router();

// All dashboard routes require authentication
router.use(protect);

router.get('/tenant', getTenantDashboard);
router.get('/owner', getOwnerDashboard);

export default router;

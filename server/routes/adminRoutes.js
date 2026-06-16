import { Router } from 'express';
import { protect, adminOnly } from '../middleware/authMiddleware.js';
import {
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
} from '../controllers/adminController.js';
import {
  getOwnerRefunds,
  updateRefundStatus,
  getRefundAnalytics,
} from '../controllers/refundController.js';
import {
  getSecurityDashboard,
  getAuditLogs,
  getFailedLogins,
} from '../controllers/securityController.js';

const router = Router();

// All admin routes require auth + admin role
router.use(protect, adminOnly);

// Dashboard
router.get('/dashboard', getAdminDashboard);

// Users
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Properties
router.get('/properties', getProperties);
router.put('/properties/:id/status', updatePropertyStatus);
router.delete('/properties/:id', deleteProperty);

// Bookings
router.get('/bookings', getBookings);

// Payments
router.get('/payments', getPayments);

// Reviews
router.get('/reviews', getReviews);
router.delete('/reviews/:id', deleteReview);

// Refunds — static routes must come before :id dynamic routes
router.get('/refunds/analytics', getRefundAnalytics);
router.get('/refunds', getOwnerRefunds);
router.put('/refunds/:id/status', updateRefundStatus);

// ── Security Monitoring (admin only) ─────────────────────────────────────────
router.get('/security/dashboard', getSecurityDashboard);
router.get('/security/logs', getAuditLogs);
router.get('/security/failed-logins', getFailedLogins);

export default router;

import express from 'express';
import {
  createOrder,
  verifyPayment,
  getMyPayments,
  getOwnerPayments,
} from '../controllers/paymentController.js';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';
import { paymentLimiter, strictLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/create-order', protect, paymentLimiter, createOrder);
router.post('/verify', protect, paymentLimiter, verifyPayment);
router.get('/my-payments', protect, getMyPayments);
router.get('/owner/payments', protect, ownerOnly, getOwnerPayments);

export default router;

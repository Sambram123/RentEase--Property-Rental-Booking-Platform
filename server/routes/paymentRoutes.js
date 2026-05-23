import express from 'express';
import {
  createOrder,
  verifyPayment,
  getMyPayments,
  getOwnerPayments,
} from '../controllers/paymentController.js';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/my-payments', protect, getMyPayments);
router.get('/owner/payments', protect, ownerOnly, getOwnerPayments);

export default router;

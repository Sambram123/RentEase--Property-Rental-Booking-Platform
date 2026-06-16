import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  firebaseAuth,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// ── Public routes (rate-limited) ──────────────────────────────────────────────
// POST /api/auth/register  — register with email + password
router.post('/register', authLimiter, registerUser);

// POST /api/auth/login     — login with email + password
router.post('/login', authLimiter, loginUser);

// POST /api/auth/firebase  — Firebase SSO (Google / email-link etc.)
router.post('/firebase', authLimiter, firebaseAuth);

// ── Protected routes ──────────────────────────────────────────────────────────
// GET /api/auth/profile    — get current user profile (requires JWT)
router.get('/profile', protect, getUserProfile);

// Legacy alias kept for backward compatibility
router.get('/me', protect, getUserProfile);

export default router;

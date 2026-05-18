import express from 'express';
import { registerUser, loginUser, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/auth/register — register new user
router.post('/register', registerUser);

// POST /api/auth/login — authenticate and receive JWT
router.post('/login', loginUser);

// GET  /api/auth/me — get current user (protected)
router.get('/me', protect, getMe);

export default router;

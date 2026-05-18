import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const registerUser = asyncHandler(async (req, res) => {
  // TODO (Day 4): validate input, check duplicate email, create user, return JWT
  res.status(201).json({
    success: true,
    message: 'registerUser — coming soon',
    data: {},
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Login user & return JWT
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const loginUser = asyncHandler(async (req, res) => {
  // TODO (Day 4): find user, verify password, return JWT
  res.status(200).json({
    success: true,
    message: 'loginUser — coming soon',
    data: {},
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  // TODO (Day 4): decode JWT from middleware, return req.user
  res.status(200).json({
    success: true,
    message: 'getMe — coming soon',
    data: {},
  });
});

export { registerUser, loginUser, getMe };

import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { applyDiceBearAvatar } from '../utils/dicebear.js';

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // ── Validate required fields ──────────────────────────────────────────────
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Please provide name, email, and password');
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters');
  }

  // ── Check for duplicate email ─────────────────────────────────────────────
  const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
  if (existingUser) {
    res.status(409);
    throw new Error('An account with that email already exists');
  }

  // ── Create user (password is hashed in User pre-save hook) ───────────────
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: role || 'tenant',
  });
  applyDiceBearAvatar(user, { seed: user.email });
  await user.save();

  // ── Generate JWT ──────────────────────────────────────────────────────────
  const token = generateToken({ id: user._id, role: user.role });

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Login user & return JWT
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  // ── Find user and explicitly select password ──────────────────────────────
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  // ── Generate JWT ──────────────────────────────────────────────────────────
  const token = generateToken({ id: user._id, role: user.role });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get current authenticated user profile
// @route   GET /api/auth/profile
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getUserProfile = asyncHandler(async (req, res) => {
  // req.user is attached by the protect middleware
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    success: true,
    message: 'Profile fetched successfully',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      },
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Firebase SSO — sync/create user in our DB and return JWT
// @route   POST /api/auth/firebase
// @access  Public (called after Firebase client-side auth)
// ─────────────────────────────────────────────────────────────────────────────
const firebaseAuth = asyncHandler(async (req, res) => {
  const { name, email, avatar, firebaseUid } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }

  // ── Upsert user (create if new, find if existing) ────────────────────────
  let user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    // Create a new user without a password (Firebase manages it)
    user = await User.create({
      name: name || 'RentEase User',
      email: email.toLowerCase().trim(),
      password: firebaseUid + process.env.JWT_SECRET, // deterministic, never used for login
      isVerified: true, // Firebase already verified
      role: 'tenant',
    });
    applyDiceBearAvatar(user, { seed: user.email });
    await user.save();
  } else if (!user.avatar) {
    applyDiceBearAvatar(user, { seed: user.email });
    await user.save();
  }

  const token = generateToken({ id: user._id, role: user.role });

  res.status(200).json({
    success: true,
    message: 'Firebase authentication successful',
    data: {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    },
  });
});

export { registerUser, loginUser, getUserProfile, firebaseAuth };

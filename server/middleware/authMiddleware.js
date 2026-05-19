import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';

// ─── Helper: extract Bearer token ────────────────────────────────────────────
const getTokenFromHeader = (req) => {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// protect — verifies JWT and attaches req.user
// ─────────────────────────────────────────────────────────────────────────────
const protect = asyncHandler(async (req, res, next) => {
  const token = getTokenFromHeader(req);

  if (!token) {
    res.status(401);
    throw new Error('Not authorized — no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    res.status(401);
    throw new Error('Not authorized — token is invalid or expired');
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    res.status(401);
    throw new Error('Not authorized — user no longer exists');
  }

  req.user = user; // attach full user document to request
  next();
});

// ─────────────────────────────────────────────────────────────────────────────
// adminOnly — must come AFTER protect
// ─────────────────────────────────────────────────────────────────────────────
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    res.status(403);
    throw new Error('Access denied — admins only');
  }
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// ownerOnly — must come AFTER protect; allows owner OR admin
// ─────────────────────────────────────────────────────────────────────────────
const ownerOnly = (req, res, next) => {
  if (!['owner', 'admin'].includes(req.user?.role)) {
    res.status(403);
    throw new Error('Access denied — property owners only');
  }
  next();
};

export { protect, adminOnly, ownerOnly, getTokenFromHeader };

import rateLimit from 'express-rate-limit';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: standard JSON error response for rate limit hits
// ─────────────────────────────────────────────────────────────────────────────
const rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Global API rate limiter — applied to all /api/* routes
// 100 requests per 15 minutes per IP
// ─────────────────────────────────────────────────────────────────────────────
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  message: 'Too many requests from this IP, please try again after 15 minutes.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Auth limiter — login / register / firebase
// 10 requests per 15 minutes per IP (brute-force protection)
// ─────────────────────────────────────────────────────────────────────────────
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  skipSuccessfulRequests: false,
});

// ─────────────────────────────────────────────────────────────────────────────
// Payment limiter — create-order / verify
// 20 requests per hour per IP
// ─────────────────────────────────────────────────────────────────────────────
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// ─────────────────────────────────────────────────────────────────────────────
// Messaging limiter — send messages
// 60 messages per minute per IP
// ─────────────────────────────────────────────────────────────────────────────
export const messageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// ─────────────────────────────────────────────────────────────────────────────
// Upload limiter — file/image uploads
// 30 uploads per hour per IP
// ─────────────────────────────────────────────────────────────────────────────
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// ─────────────────────────────────────────────────────────────────────────────
// Strict limiter — high-value actions (booking, refund)
// 30 requests per hour per IP
// ─────────────────────────────────────────────────────────────────────────────
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

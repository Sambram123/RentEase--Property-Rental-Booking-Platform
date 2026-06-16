import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import xssFilters from 'xss-filters';
import hpp from 'hpp';
import { globalLimiter } from './rateLimiter.js';

// ─────────────────────────────────────────────────────────────────────────────
// Custom NoSQL injection sanitizer compatible with Express 5
// express-mongo-sanitize sets req.query which is read-only in Express 5
// This manually sanitizes req.body to strip MongoDB operators ($, .) from keys
// ─────────────────────────────────────────────────────────────────────────────
const sanitizeObject = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      obj[i] = sanitizeObject(obj[i]);
    }
    return obj;
  }

  const keys = Object.keys(obj);
  for (const key of keys) {
    const val = obj[key];
    
    // Sanitize the key name if it starts with $ or contains .
    let cleanKey = key;
    if (key.startsWith('$') || key.includes('.')) {
      cleanKey = key.replace(/\$/g, '').replace(/\./g, '_');
      delete obj[key];
    }
    
    // Recursively sanitize value if it's an object or array
    if (val !== null && typeof val === 'object') {
      obj[cleanKey] = sanitizeObject(val);
    } else {
      obj[cleanKey] = val;
    }
  }
  return obj;
};

const mongoSanitize = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
};

// ─────────────────────────────────────────────────────────────────────────────
// Custom XSS sanitizer compatible with Express 5
// xss-clean sets req.query which is read-only in Express 5
// This sanitizes values inside req.body, req.query, and req.params in-place
// ─────────────────────────────────────────────────────────────────────────────
const sanitizeXssValue = (val) => {
  if (typeof val === 'string') {
    return xssFilters.inHTMLData(val).trim();
  }
  if (Array.isArray(val)) return val.map(sanitizeXssValue);
  if (val !== null && typeof val === 'object') return sanitizeXssObject(val);
  return val;
};

const sanitizeXssObject = (obj) => {
  for (const key of Object.keys(obj)) {
    obj[key] = sanitizeXssValue(obj[key]);
  }
  return obj;
};

const xssClean = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeXssObject(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    sanitizeXssObject(req.query);
  }
  if (req.params && typeof req.params === 'object') {
    sanitizeXssObject(req.params);
  }
  next();
};

const applyMiddleware = (app) => {
  // ── Security headers (Helmet) ─────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", 'https://checkout.razorpay.com'],
          frameSrc: ["'self'", 'https://api.razorpay.com'],
          imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://api.dicebear.com'],
          connectSrc: ["'self'", 'https://api.razorpay.com'],
        },
      },
      crossOriginEmbedderPolicy: false, // Allow Razorpay iframe
    })
  );

  // ── CORS ──────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ── Body parsing with size limits ────────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // ── NoSQL injection sanitization (custom, Express 5 compatible) ──────────
  app.use(mongoSanitize);

  // ── XSS sanitization ─────────────────────────────────────────────────────
  // Strips HTML tags from user input to prevent cross-site scripting
  app.use(xssClean);

  // ── HTTP Parameter Pollution prevention ──────────────────────────────────
  // Prevents duplicate query param exploits (e.g., ?sort=name&sort=password)
  app.use(
    hpp({
      whitelist: [
        // Allow array params that are legitimately used in searches/filters
        'amenities',
        'propertyType',
        'city',
        'status',
      ],
    })
  );

  // ── Global rate limiter on all API routes ────────────────────────────────
  app.use('/api', globalLimiter);

  // ── HTTP request logging ─────────────────────────────────────────────────
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
};

export default applyMiddleware;

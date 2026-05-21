import express from 'express';
import {
  createProperty,
  getProperties,
  getSingleProperty,
  getOwnerProperties,
  updateProperty,
  deleteProperty,
} from '../controllers/propertyController.js';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── Owner-specific — MUST be before /:id to avoid conflict ───────────────────
// GET /api/properties/owner/my-properties  — owner's own listings
router.get('/owner/my-properties', protect, getOwnerProperties);

// ── Public + authenticated ────────────────────────────────────────────────────
// GET    /api/properties        — list properties (filters via query params)
// POST   /api/properties        — create listing (owner / admin only)
router
  .route('/')
  .get(getProperties)
  .post(protect, ownerOnly, createProperty);

// GET    /api/properties/:id    — property details (public)
// PUT    /api/properties/:id    — update listing (owner of property / admin)
// DELETE /api/properties/:id    — delete listing (owner of property / admin)
router
  .route('/:id')
  .get(getSingleProperty)
  .put(protect, updateProperty)          // ownership verified inside controller
  .delete(protect, deleteProperty);      // ownership verified inside controller

export default router;

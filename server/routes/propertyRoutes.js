import express from 'express';
import {
  createProperty,
  getProperties,
  getSingleProperty,
  updateProperty,
  deleteProperty,
} from '../controllers/propertyController.js';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET    /api/properties       — list all available properties (public)
// POST   /api/properties       — create a new listing (owner / admin only)
router
  .route('/')
  .get(getProperties)
  .post(protect, ownerOnly, createProperty);

// GET    /api/properties/:id   — get property details (public)
// PUT    /api/properties/:id   — update listing (owner / admin)
// DELETE /api/properties/:id   — remove listing (owner / admin)
router
  .route('/:id')
  .get(getSingleProperty)
  .put(protect, ownerOnly, updateProperty)
  .delete(protect, ownerOnly, deleteProperty);

export default router;

import express from 'express';
import {
  createProperty,
  getProperties,
  getSingleProperty,
  updateProperty,
  deleteProperty,
} from '../controllers/propertyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET    /api/properties       — list all available properties (public)
// POST   /api/properties       — create a new listing (protected)
router
  .route('/')
  .get(getProperties)
  .post(protect, createProperty);

// GET    /api/properties/:id   — get property details (public)
// PUT    /api/properties/:id   — update listing (protected)
// DELETE /api/properties/:id   — remove listing (protected)
router
  .route('/:id')
  .get(getSingleProperty)
  .put(protect, updateProperty)
  .delete(protect, deleteProperty);

export default router;

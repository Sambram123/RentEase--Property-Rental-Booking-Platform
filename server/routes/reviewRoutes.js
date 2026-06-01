import express from 'express';
import {
  createReview,
  getPropertyReviews,
  updateReview,
  deleteReview,
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST   /api/reviews              — create review (auth required)
router.post('/', protect, createReview);

// GET    /api/reviews/property/:propertyId — get reviews for a property (public)
router.get('/property/:propertyId', getPropertyReviews);

// PUT    /api/reviews/:id          — update own review (auth required)
router.put('/:id', protect, updateReview);

// DELETE /api/reviews/:id          — delete own review (auth required)
router.delete('/:id', protect, deleteReview);

export default router;

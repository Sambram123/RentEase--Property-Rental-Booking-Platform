import express from 'express';
import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
} from '../controllers/wishlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET    /api/wishlist               — get saved properties
router.get('/', protect, getWishlist);

// POST   /api/wishlist/:propertyId   — add to wishlist
router.post('/:propertyId', protect, addToWishlist);

// DELETE /api/wishlist/:propertyId   — remove from wishlist
router.delete('/:propertyId', protect, removeFromWishlist);

export default router;

import express from 'express';
import {
  createProperty,
  getProperties,
  getSingleProperty,
  getOwnerProperties,
  updateProperty,
  deleteProperty,
} from '../controllers/propertyController.js';
import {
  getTrending,
  getFeatured,
  getSimilar,
  getRecentlyViewed,
  trackView,
  getPopularCities,
  trackSearchAction,
} from '../controllers/recommendationController.js';
import { protect, ownerOnly } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── Static routes — MUST be before /:id ──────────────────────────────────────

// Owner listing
router.get('/owner/my-properties', protect, getOwnerProperties);

// Trending / featured / discovery (public)
router.get('/trending',        getTrending);
router.get('/featured',        getFeatured);
router.get('/popular-cities',  getPopularCities);

// Recently viewed (private)
router.get('/recently-viewed', protect, getRecentlyViewed);

// Track search (private)
router.post('/track-search', protect, trackSearchAction);

// ── CRUD ──────────────────────────────────────────────────────────────────────
router
  .route('/')
  .get(getProperties)
  .post(protect, ownerOnly, createProperty);

// ── Single property + sub-routes ──────────────────────────────────────────────
router
  .route('/:id')
  .get(getSingleProperty)
  .put(protect, updateProperty)
  .delete(protect, deleteProperty);

// Similar properties
router.get('/:id/similar', getSimilar);

// Track view (auth optional — increment viewCount)
router.post('/:id/view', protect, trackView);

export default router;

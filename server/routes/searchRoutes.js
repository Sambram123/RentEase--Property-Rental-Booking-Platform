import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  saveSearch,
  getSavedSearches,
  deleteSavedSearch,
  getSearchHistory,
} from '../controllers/recommendationController.js';

const router = express.Router();

router.use(protect);

// Static before dynamic
router.get('/history', getSearchHistory);

router.route('/')
  .get(getSavedSearches)
  .post(saveSearch);

router.delete('/:id', deleteSavedSearch);

export default router;

import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getProfile,
  updateProfile,
  changePassword,
  getPreferences,
  updatePreferences,
  updateAvatar,
  resetAvatar,
  deleteAccount,
} from '../controllers/userController.js';

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);
router.put('/avatar', updateAvatar);
router.delete('/avatar', resetAvatar);
router.delete('/account', deleteAccount);

export default router;

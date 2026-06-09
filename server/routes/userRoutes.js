import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { uploadAvatar as uploadMiddleware } from '../middleware/uploadMiddleware.js';
import {
  getProfile,
  updateProfile,
  changePassword,
  getPreferences,
  updatePreferences,
  uploadAvatar,
  removeAvatar,
  deleteAccount,
} from '../controllers/userController.js';

const router = express.Router();

const handleUpload = (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      res.status(400);
      next(new Error(err.message || 'File upload failed'));
    } else {
      next();
    }
  });
};

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);
router.post('/avatar', handleUpload, uploadAvatar);
router.delete('/avatar', removeAvatar);
router.delete('/account', deleteAccount);

export default router;

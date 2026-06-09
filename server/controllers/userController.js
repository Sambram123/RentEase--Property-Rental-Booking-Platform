import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Booking from '../models/Booking.js';
import Payment from '../models/Payment.js';
import Review from '../models/Review.js';
import Notification from '../models/Notification.js';
import formatUser, { getProfileCompletion } from '../utils/formatUser.js';
import { validatePasswordStrength } from '../utils/passwordValidator.js';
import { cloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';

const deleteCloudinaryImage = async (publicId) => {
  if (!publicId || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch {
    // non-fatal — image may already be removed
  }
};

const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'rentease/avatars', transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }] },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });

// GET /api/users/profile
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    success: true,
    message: 'Profile fetched successfully',
    data: {
      user: formatUser(user),
      profileCompletion: getProfileCompletion(user),
    },
  });
});

// PUT /api/users/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, bio, city, state, avatar } = req.body;
  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (name !== undefined) {
    if (!name.trim()) {
      res.status(400);
      throw new Error('Name cannot be empty');
    }
    user.name = name.trim();
  }

  if (email !== undefined) {
    const normalized = email.toLowerCase().trim();
    if (!/^\S+@\S+\.\S+$/.test(normalized)) {
      res.status(400);
      throw new Error('Please provide a valid email address');
    }
    if (normalized !== user.email) {
      const existing = await User.findOne({ email: normalized });
      if (existing) {
        res.status(409);
        throw new Error('An account with that email already exists');
      }
      user.email = normalized;
    }
  }

  if (phone !== undefined) user.phone = phone.trim();
  if (bio !== undefined) user.bio = bio.trim();
  if (city !== undefined) user.city = city.trim();
  if (state !== undefined) user.state = state.trim();

  // Allow URL-based avatar update (e.g. external link)
  if (avatar !== undefined && typeof avatar === 'string') {
    user.avatar = avatar.trim();
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: formatUser(user),
      profileCompletion: getProfileCompletion(user),
    },
  });
});

// PUT /api/users/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    res.status(400);
    throw new Error('Please provide current password, new password, and confirmation');
  }

  if (newPassword !== confirmPassword) {
    res.status(400);
    throw new Error('New passwords do not match');
  }

  const strengthError = validatePasswordStrength(newPassword);
  if (strengthError) {
    res.status(400);
    throw new Error(strengthError);
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Password changed successfully',
  });
});

// GET /api/users/preferences
const getPreferences = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.status(200).json({
    success: true,
    message: 'Preferences fetched successfully',
    data: { preferences: user.preferences },
  });
});

// PUT /api/users/preferences
const updatePreferences = asyncHandler(async (req, res) => {
  const {
    bookingNotifications,
    paymentNotifications,
    reviewNotifications,
    marketingNotifications,
  } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (typeof bookingNotifications === 'boolean') {
    user.preferences.bookingNotifications = bookingNotifications;
  }
  if (typeof paymentNotifications === 'boolean') {
    user.preferences.paymentNotifications = paymentNotifications;
  }
  if (typeof reviewNotifications === 'boolean') {
    user.preferences.reviewNotifications = reviewNotifications;
  }
  if (typeof marketingNotifications === 'boolean') {
    user.preferences.marketingNotifications = marketingNotifications;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Preferences updated successfully',
    data: { preferences: user.preferences },
  });
});

// POST /api/users/avatar
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload an image file');
  }

  if (!isCloudinaryConfigured()) {
    res.status(503);
    throw new Error('Image upload is not configured. Set Cloudinary environment variables.');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const result = await uploadToCloudinary(req.file.buffer);

  // Remove old Cloudinary avatar if present
  if (user.avatarPublicId) {
    await deleteCloudinaryImage(user.avatarPublicId);
  }

  user.avatar = result.secure_url;
  user.avatarPublicId = result.public_id;
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: {
      user: formatUser(user),
      profileCompletion: getProfileCompletion(user),
    },
  });
});

// DELETE /api/users/avatar
const removeAvatar = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.avatarPublicId) {
    await deleteCloudinaryImage(user.avatarPublicId);
  }

  user.avatar = '';
  user.avatarPublicId = '';
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Avatar removed successfully',
    data: {
      user: formatUser(user),
      profileCompletion: getProfileCompletion(user),
    },
  });
});

// DELETE /api/users/account
const deleteAccount = asyncHandler(async (req, res) => {
  const { password, confirmText } = req.body;

  if (confirmText !== 'DELETE') {
    res.status(400);
    throw new Error('Please type DELETE to confirm account deletion');
  }

  const user = await User.findById(req.user.id).select('+password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (password) {
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      res.status(401);
      throw new Error('Password is incorrect');
    }
  }

  if (user.avatarPublicId) {
    await deleteCloudinaryImage(user.avatarPublicId);
  }

  const userId = user._id;

  // Clean up related data
  await Promise.all([
    Booking.deleteMany({ user: userId }),
    Payment.deleteMany({ user: userId }),
    Review.deleteMany({ user: userId }),
    Notification.deleteMany({ user: userId }),
  ]);

  await user.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully',
  });
});

export {
  getProfile,
  updateProfile,
  changePassword,
  getPreferences,
  updatePreferences,
  uploadAvatar,
  removeAvatar,
  deleteAccount,
};

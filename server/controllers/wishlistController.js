import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/User.js';
import Property from '../models/Property.js';

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Add property to wishlist
// @route   POST /api/wishlist/:propertyId
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const addToWishlist = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  const property = await Property.findById(propertyId);
  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  const user = await User.findById(req.user._id);

  if (user.wishlist.some((id) => id.toString() === propertyId)) {
    res.status(409);
    throw new Error('Property already in wishlist');
  }

  user.wishlist.push(propertyId);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Added to wishlist',
    data: { wishlist: user.wishlist },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Remove property from wishlist
// @route   DELETE /api/wishlist/:propertyId
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const removeFromWishlist = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  const user = await User.findById(req.user._id);
  const idx = user.wishlist.findIndex((id) => id.toString() === propertyId);

  if (idx === -1) {
    res.status(404);
    throw new Error('Property not in wishlist');
  }

  user.wishlist.splice(idx, 1);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Removed from wishlist',
    data: { wishlist: user.wishlist },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get wishlist with populated properties
// @route   GET /api/wishlist
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    select: 'title price city address images type bedrooms bathrooms rating reviewsCount availability',
    populate: { path: 'owner', select: 'name avatar' },
  });

  res.status(200).json({
    success: true,
    message: 'Wishlist fetched successfully',
    data: {
      count: user.wishlist.length,
      properties: user.wishlist,
    },
  });
});

export { addToWishlist, removeFromWishlist, getWishlist };

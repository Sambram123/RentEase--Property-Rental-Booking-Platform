import asyncHandler from '../utils/asyncHandler.js';
import Review from '../models/Review.js';
import Property from '../models/Property.js';
import Booking from '../models/Booking.js';

// ─── Helper: recalculate property rating ──────────────────────────────────────
const refreshPropertyRating = async (propertyId) => {
  const stats = await Review.aggregate([
    { $match: { property: propertyId } },
    { $group: { _id: '$property', avg: { $avg: '$rating' }, cnt: { $sum: 1 } } },
  ]);
  if (stats.length > 0) {
    await Property.findByIdAndUpdate(propertyId, {
      rating: Math.round(stats[0].avg * 10) / 10,
      reviewsCount: stats[0].cnt,
    });
  } else {
    await Property.findByIdAndUpdate(propertyId, { rating: 0, reviewsCount: 0 });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
// ─────────────────────────────────────────────────────────────────────────────
const createReview = asyncHandler(async (req, res) => {
  const { propertyId, rating, comment } = req.body;

  if (!propertyId || !rating || !comment) {
    res.status(400);
    throw new Error('propertyId, rating, and comment are required');
  }

  if (rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  // Property must exist
  const property = await Property.findById(propertyId);
  if (!property) {
    res.status(404);
    throw new Error('Property not found');
  }

  // Cannot review own property
  if (property.owner.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot review your own property');
  }

  // Must have a completed or confirmed booking
  const hasBooking = await Booking.exists({
    user: req.user._id,
    property: propertyId,
    bookingStatus: { $in: ['confirmed', 'completed'] },
  });
  if (!hasBooking) {
    res.status(403);
    throw new Error('You can only review properties you have booked');
  }

  // One review per user per property
  const existing = await Review.findOne({ user: req.user._id, property: propertyId });
  if (existing) {
    res.status(409);
    throw new Error('You have already reviewed this property');
  }

  const review = await Review.create({
    user: req.user._id,
    property: propertyId,
    rating: Number(rating),
    comment: comment.trim(),
  });

  await refreshPropertyRating(property._id);

  const populated = await review.populate('user', 'name avatar');

  res.status(201).json({
    success: true,
    message: 'Review added successfully',
    data: { review: populated },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get reviews for a property
// @route   GET /api/reviews/property/:propertyId
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getPropertyReviews = asyncHandler(async (req, res) => {
  const { propertyId } = req.params;

  const reviews = await Review.find({ property: propertyId })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .lean();

  // Aggregate stats
  const stats = await Review.aggregate([
    { $match: { property: (await import('mongoose')).default.Types.ObjectId.createFromHexString(propertyId) } },
    { $group: { _id: null, avg: { $avg: '$rating' }, cnt: { $sum: 1 } } },
  ]);

  res.status(200).json({
    success: true,
    message: 'Reviews fetched successfully',
    data: {
      reviews,
      count: reviews.length,
      averageRating: stats[0]?.avg ? Math.round(stats[0].avg * 10) / 10 : 0,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private (review owner)
// ─────────────────────────────────────────────────────────────────────────────
const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  if (review.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to edit this review');
  }

  const { rating, comment } = req.body;
  if (rating !== undefined) {
    if (rating < 1 || rating > 5) {
      res.status(400);
      throw new Error('Rating must be between 1 and 5');
    }
    review.rating = Number(rating);
  }
  if (comment !== undefined) {
    review.comment = comment.trim();
  }

  await review.save();
  await refreshPropertyRating(review.property);

  const populated = await review.populate('user', 'name avatar');

  res.status(200).json({
    success: true,
    message: 'Review updated successfully',
    data: { review: populated },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (review owner or admin)
// ─────────────────────────────────────────────────────────────────────────────
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  const isOwner = review.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error('Not authorized to delete this review');
  }

  const propertyId = review.property;
  await review.deleteOne();
  await refreshPropertyRating(propertyId);

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully',
    data: {},
  });
});

export { createReview, getPropertyReviews, updateReview, deleteReview };
